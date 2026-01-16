const { db, auth } = require('../config/firebase.config');

/**
 * Memverifikasi token Google dan melakukan Login atau Register (Upsert)
 * @param {string} idToken - Token JWT dari client
 * @returns {Promise<Object>} Object berisi data user dan status isNewUser
 */
const authenticateGoogleUser = async (idToken) => {
  // 1. Verifikasi Token ke Firebase (Bisa throw error jika token invalid)
  const decodedToken = await auth.verifyIdToken(idToken);
  const { uid, email, name, picture } = decodedToken;

  // 2. Cek User di Firestore
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  let userData;
  let isNewUser = false;

  if (!doc.exists) {
    // --- REGISTER (User Baru) ---
    isNewUser = true;
    
    // Schema awal user default
    userData = {
      uid: uid,
      email: email,
      name: name || 'User Tanpa Nama',
      photoUrl: picture || '',
      createdAt: new Date().toISOString(),
      // Struktur data fisik kosong untuk diisi saat onboarding
      physicalData: {
          gender: null,
          age: null,
          height: null,
          weight: null,
          activityLevel: null
      },
      // Struktur kesehatan kosong
      healthStats: {
          bmi: null,
          bmiStatus: null,
          bmr: null,
          tdee: null
      },
      // Struktur preferensi kosong
      preferences: {
          allergies: []
      },
      isOnboardingCompleted: false
    };
    
    // Simpan ke database
    await userRef.set(userData);
    
  } else {
    // --- LOGIN (User Lama) ---
    isNewUser = false;
    
    // Update waktu login terakhir
    await userRef.update({ 
      lastLogin: new Date().toISOString() 
    });
    
    userData = doc.data();
  }

  // Return data bersih ke controller
  return { userData, isNewUser };
};

module.exports = { authenticateGoogleUser };