const { db } = require('../config/firebase.config');

// Helper: Hitung Umur (Private function, gak perlu diexport)
const calculateAge = (birthdate) => {
  const birthDateObj = new Date(birthdate);
  const ageDifMs = Date.now() - birthDateObj.getTime();
  const ageDate = new Date(ageDifMs); 
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Logic Utama: Update Data User & Hitung Gizi
const updateUserPhysicalData = async (uid, data) => {
  const { name, birthdate, gender, height, weight, activityLevel, allergies } = data;

  // 1. Hitung Logika Gizi (Business Logic)
  const age = calculateAge(birthdate);
  const heightInMeters = height / 100;
  
  // BMI
  const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  let bmiStatus = 'Normal';
  if (bmi < 18.5) bmiStatus = 'Underweight';
  else if (bmi >= 18.5 && bmi <= 24.9) bmiStatus = 'Normal';
  else if (bmi >= 25 && bmi <= 29.9) bmiStatus = 'Overweight';
  else bmiStatus = 'Obesity';

  // BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (parseInt(gender) === 0) { // Male
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else { // Female
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // TDEE
  const tdee = Math.round(bmr * parseFloat(activityLevel));

  // 2. Siapkan Data untuk Database
  const updatePayload = {
    name: name,
    birthdate: birthdate,
    physicalData: {
      gender: parseInt(gender),
      age: age,
      height: parseFloat(height),
      weight: parseFloat(weight),
      activityLevel: parseFloat(activityLevel)
    },
    preferences: {
      allergies: allergies || []
    },
    healthStats: {
      bmi: bmi,
      bmiStatus: bmiStatus,
      bmr: Math.round(bmr),
      tdee: tdee
    },
    isOnboardingCompleted: true
  };

  // 3. Interaksi dengan Database
  const userRef = db.collection('users').doc(uid);
  await userRef.update(updatePayload);

  // Return data terbaru ke Controller
  const updatedDoc = await userRef.get();
  return updatedDoc.data();
};

module.exports = { updateUserPhysicalData };