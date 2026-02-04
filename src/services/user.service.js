const { db } = require('../config/firebase.config');
const mlService = require('./ml.service');

class UserService {
  constructor(database, ml) {
    this.db = database;
    this.mlService = ml;
  }

  // Helper Methods (Internal Logic)
  _calculateAge(birthdate) {
    const birthDateObj = new Date(birthdate);
    const ageDifMs = Date.now() - birthDateObj.getTime();
    const ageDate = new Date(ageDifMs); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  _getBmrLabel(score) {
    const labels = ["Extremely Weak", "Weak", "Normal", "Overweight", "Obesity", "Extremely Obesity"];
    return labels[score] || "Unknown";
  }

  async updateUserPhysicalData(uid, data) {
    const { name, birthdate, gender, height, weight, activityLevel, allergies } = data;

    const age = this._calculateAge(birthdate);
    const heightInMeters = height / 100;
    
    // Hitung BMI
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    let bmiStatus = this._determineBmiStatus(bmi);

    // Hitung BMR (Mifflin-St Jeor)
    let bmr = (parseInt(gender) === 0) 
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    bmr = Math.round(bmr);

    const tdee = Math.round(bmr * parseFloat(activityLevel));

    // Prediksi ML
    const bmrScore = await this.mlService.predictBmrScore({ 
      gender: parseInt(gender), height: parseFloat(height), weight: parseFloat(weight), bmi 
    });

    const updatePayload = {
      name,
      birthdate,
      physicalData: { gender: parseInt(gender), age, height: parseFloat(height), weight: parseFloat(weight), activityLevel: parseFloat(activityLevel) },
      preferences: { allergies: allergies || [] },
      healthStats: { bmi, bmiStatus, bmr, tdee, bmrScore, bmrLabel: bmrScore !== null ? this._getBmrLabel(bmrScore) : null },
      nutritionalNeeds: {
        calories: tdee,
        carbs: Math.round((tdee * 0.5) / 4),
        protein: Math.round((tdee * 0.3) / 4),
        fat: Math.round((tdee * 0.2) / 9)
      },
      isOnboardingCompleted: true
    };

    const userRef = this.db.collection('users').doc(uid);
    await userRef.update(updatePayload);
    const updatedDoc = await userRef.get();
    return updatedDoc.data();
  }

  _determineBmiStatus(bmi) {
    if (bmi < 16) return 'Severely Underweight';
    if (bmi <= 18.4) return 'Underweight';
    if (bmi <= 24.9) return 'Normal';
    if (bmi <= 29.9) return 'Overweight';
    if (bmi <= 34.9) return 'Moderately Obese';
    if (bmi <= 39.9) return 'Severely Obese';
    return 'Morbidly Obese';
  }

  async getUserProfile(uid) {
    const doc = await this.db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  }
}

module.exports = new UserService(db, mlService);