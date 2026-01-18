const { db, admin } = require('../config/firebase.config');
const userService = require('./user.service');

/**
 * Menambahkan log makanan ke database (Atomic Update)
 */
const addMealLog = async (uid, mealData) => {
  // 1. Tentukan Tanggal Hari Ini (ID Dokumen: YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  
  const userRef = db.collection('users').doc(uid);
  const dailyRef = userRef.collection('daily_logs').doc(today);

  // 2. Siapkan Data Makanan
  const newMeal = {
    mealTime: new Date().toISOString(), // Jam saat ini
    foodName: mealData.foodName,
    calories: Number(mealData.calories) || 0,
    carbs: Number(mealData.carbs) || 0,
    protein: Number(mealData.protein) || 0,
    fat: Number(mealData.fat) || 0,
    imageUrl: mealData.imageUrl || null
  };

  // 3. Cek apakah Dokumen Hari Ini sudah ada?
  const doc = await dailyRef.get();

  if (!doc.exists) {
    // --- KONDISI A: Makan Pertama Hari Ini (Buat Dokumen Baru) ---
    
    // Ambil target user terbaru dari profil untuk snapshot history
    const userProfile = await userService.getUserProfile(uid);
    // Fallback jika nutritionalNeeds belum ada
    const target = userProfile.nutritionalNeeds || { calories: 2000, carbs: 250, protein: 100, fat: 65 };

    const newLog = {
      date: today,
      lastUpdated: new Date().toISOString(),
      target: target, // Simpan target saat ini (biar kalau besok target ganti, history hari ini tetap)
      summary: {
        totalCalories: newMeal.calories,
        totalCarbs: newMeal.carbs,
        totalProtein: newMeal.protein,
        totalFat: newMeal.fat
      },
      meals: [newMeal]
    };

    await dailyRef.set(newLog);
    return newLog; // Return data baru

  } else {
    // --- KONDISI B: Sudah Ada Log Hari Ini (Update) ---
    
    // Gunakan FieldValue.increment agar atomik (mencegah race condition)
    await dailyRef.update({
      lastUpdated: new Date().toISOString(),
      "summary.totalCalories": admin.firestore.FieldValue.increment(newMeal.calories),
      "summary.totalCarbs": admin.firestore.FieldValue.increment(newMeal.carbs),
      "summary.totalProtein": admin.firestore.FieldValue.increment(newMeal.protein),
      "summary.totalFat": admin.firestore.FieldValue.increment(newMeal.fat),
      meals: admin.firestore.FieldValue.arrayUnion(newMeal) 
    });

    // Ambil data terbaru untuk dikembalikan ke frontend
    const updatedDoc = await dailyRef.get();
    return updatedDoc.data();
  }
};

/**
 * Mengambil Log Harian (Untuk Progress Bar di Home)
 */
const getDailyLog = async (uid, date) => {
  // Jika tanggal tidak dikirim, default ke hari ini
  const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  
  const doc = await db.collection('users').doc(uid).collection('daily_logs').doc(targetDate).get();

  if (!doc.exists) return null;
  return doc.data();
};

module.exports = { addMealLog, getDailyLog };