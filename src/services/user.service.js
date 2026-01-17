const { db } = require('../config/firebase.config');
const mlService = require('./ml.service');

// Daftar Alergi yang Diizinkan (Whitelist)
const ALLOWED_ALLERGIES = [
  'gluten-free', 
  'dairy-free', 
  'egg-free', 
  'soy-free', 
  'wheat-free', 
  'fish-free', 
  'shellfish-free', 
  'tree-nut-free', 
  'peanut-free'
];

// Helper: Hitung Umur
const calculateAge = (birthdate) => {
  const birthDateObj = new Date(birthdate);
  const ageDifMs = Date.now() - birthDateObj.getTime();
  const ageDate = new Date(ageDifMs); 
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Helper: Mapping Label ML (Opsional, biar data di DB lebih terbaca)
const getBmrLabel = (score) => {
    const labels = [
        "Extremely Weak",   // 0
        "Weak",             // 1
        "Normal",           // 2
        "Overweight",       // 3
        "Obesity",          // 4
        "Extremely Obesity" // 5
    ];
    return labels[score] || "Unknown";
};


// UPDATE
const updateUserPhysicalData = async (uid, data) => {
  const { name, birthdate, gender, height, weight, activityLevel, allergies } = data;

  // --- 1. PREPARASI DATA ---
  const age = calculateAge(birthdate);
  const heightInMeters = height / 100;
  
  // --- 2. HITUNG BMI (Rumus Kustom User) ---
  const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  let bmiStatus = 'Normal';

  if (bmi < 16) bmiStatus = 'Severely Underweight';
  else if (bmi >= 16.1 && bmi <= 18.4) bmiStatus = 'Underweight';
  else if (bmi >= 18.5 && bmi <= 24.9) bmiStatus = 'Normal';
  else if (bmi >= 25 && bmi <= 29.9) bmiStatus = 'Overweight';
  else if (bmi >= 30 && bmi <= 34.9) bmiStatus = 'Moderately Obese';
  else if (bmi >= 35 && bmi <= 39.9) bmiStatus = 'Severely Obese';
  else bmiStatus = 'Morbidly Obese';

  // --- 3. HITUNG BMR MANUAL (Mifflin-St Jeor) ---
  let bmr = 0;
  // Asumsi Input: 0 = Pria, 1 = Wanita
  if (parseInt(gender) === 0) { 
      // Pria: (10 × weight) + (6.25 × height) - (5 × age) + 5
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else { 
      // Wanita: (10 × weight) + (6.25 × height) - (5 × age) - 161
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  bmr = Math.round(bmr);

  // --- 4. HITUNG TDEE & MAKRO ---
  // TDEE = BMR * Activity Level
  const tdee = Math.round(bmr * parseFloat(activityLevel));

  // Hitung Kebutuhan Makro (Gram)
  // Karbohidrat (4 kal/gr) = 50%
  // Protein (4 kal/gr) = 30%
  // Lemak (9 kal/gr) = 20%
  const macros = {
      carbs: Math.round((tdee * 0.50) / 4),
      protein: Math.round((tdee * 0.30) / 4),
      fat: Math.round((tdee * 0.20) / 9)
  };

  // --- 5. PREDIKSI ML (BMR Score) ---
  const mlPayload = {
    gender: parseInt(gender), // Pastikan format integer (0/1)
    height: parseFloat(height),
    weight: parseFloat(weight),
    bmi: bmi
  };

  // Tembak ke API Python
  const bmrScore = await mlService.predictBmrScore(mlPayload);

  // --- 6. UPDATE DATABASE ---
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
      bmr: bmr,          // Hasil Mifflin-St Jeor
      tdee: tdee,        // Hasil TDEE
      bmrScore: bmrScore,      // Hasil ML (0-5)
      bmrLabel: bmrScore !== null ? getBmrLabel(bmrScore) : null // Label ML
    },
    nutritionalNeeds: {  // <-- Data Makro Baru
        calories: tdee,
        carbs: macros.carbs,
        protein: macros.protein,
        fat: macros.fat
    },
    isOnboardingCompleted: true
  };

  const userRef = db.collection('users').doc(uid);
  await userRef.update(updatePayload);

  const updatedDoc = await userRef.get();
  return updatedDoc.data();
};

//GET
const getUserProfile = async (uid) => {
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};

module.exports = { 
  updateUserPhysicalData, 
  getUserProfile // <-- Jangan lupa export fungsi baru ini
};