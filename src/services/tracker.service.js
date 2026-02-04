const { db, admin } = require('../config/firebase.config');
const userService = require('./user.service');

class TrackerService {
  constructor(database, firestoreAdmin, userSvc) {
    this.db = database;
    this.admin = firestoreAdmin;
    this.userService = userSvc;
  }

  // Private helper untuk mendapatkan string tanggal Jakarta
  _getTodayDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  async addMealLog(uid, mealData) {
    const today = this._getTodayDate();
    const dailyRef = this.db.collection('users').doc(uid).collection('daily_logs').doc(today);

    const newMeal = {
      mealTime: new Date().toISOString(),
      foodName: mealData.foodName,
      calories: Number(mealData.calories) || 0,
      carbs: Number(mealData.carbs) || 0,
      protein: Number(mealData.protein) || 0,
      fat: Number(mealData.fat) || 0,
      imageUrl: mealData.imageUrl || null,
      sourceUrl: mealData.sourceUrl || null
    };

    const doc = await dailyRef.get();

    if (!doc.exists) {
      // Ambil target nutrisi dari profil user (Snapshotting)
      const userProfile = await this.userService.getUserProfile(uid);
      const target = userProfile?.nutritionalNeeds || { calories: 2000, carbs: 250, protein: 100, fat: 65 };

      const newLog = {
        date: today,
        lastUpdated: new Date().toISOString(),
        target: target,
        summary: {
          totalCalories: newMeal.calories,
          totalCarbs: newMeal.carbs,
          totalProtein: newMeal.protein,
          totalFat: newMeal.fat
        },
        meals: [newMeal]
      };

      await dailyRef.set(newLog);
      return newLog;
    } else {
      // Atomic update menggunakan increment dan arrayUnion
      await dailyRef.update({
        lastUpdated: new Date().toISOString(),
        "summary.totalCalories": this.admin.firestore.FieldValue.increment(newMeal.calories),
        "summary.totalCarbs": this.admin.firestore.FieldValue.increment(newMeal.carbs),
        "summary.totalProtein": this.admin.firestore.FieldValue.increment(newMeal.protein),
        "summary.totalFat": this.admin.firestore.FieldValue.increment(newMeal.fat),
        meals: this.admin.firestore.FieldValue.arrayUnion(newMeal)
      });

      const updatedDoc = await dailyRef.get();
      return updatedDoc.data();
    }
  }

  async getDailyLog(uid, date) {
    const targetDate = date || this._getTodayDate();
    const doc = await this.db.collection('users').doc(uid).collection('daily_logs').doc(targetDate).get();
    return doc.exists ? doc.data() : null;
  }
}

module.exports = new TrackerService(db, admin, userService);