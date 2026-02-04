const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

class FirebaseConfig {
  constructor() {
    this.initialize();
  }

  initialize() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("🔥 Firebase Admin SDK initialized");
    }
    
    this.db = admin.firestore();
    this.auth = admin.auth();
    this.admin = admin;
  }

  getFirestore() {
    return this.db;
  }

  getAuth() {
    return this.auth;
  }

  getAdmin() {
    return this.admin;
  }
}

// Kita ekspor instance-nya agar tetap Singleton
const firebaseInstance = new FirebaseConfig();

module.exports = {
  db: firebaseInstance.getFirestore(),
  auth: firebaseInstance.getAuth(),
  admin: firebaseInstance.getAdmin()
};