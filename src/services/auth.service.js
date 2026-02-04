class AuthService {
  constructor(db, auth) {
    this.db = db;
    this.auth = auth;
  }

  async authenticateGoogleUser(idToken) {
    const decodedToken = await this.auth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    const userRef = this.db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;
    let isNewUser = false;

    if (!doc.exists) {
      isNewUser = true;
      userData = {
        uid,
        email,
        name: name || 'User Tanpa Nama',
        photoUrl: picture || '',
        createdAt: new Date().toISOString(),
        physicalData: { gender: null, age: null, height: null, weight: null, activityLevel: null },
        healthStats: { bmi: null, bmiStatus: null, bmr: null, tdee: null },
        preferences: { allergies: [] },
        isOnboardingCompleted: false
      };
      await userRef.set(userData);
    } else {
      isNewUser = false;
      await userRef.update({ lastLogin: new Date().toISOString() });
      userData = doc.data();
    }

    return { userData, isNewUser };
  }
}

const { db, auth } = require('../config/firebase.config');
module.exports = new AuthService(db, auth);