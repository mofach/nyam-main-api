const admin = require('firebase-admin');
// Pastikan path ke serviceAccountKey.json benar (naik 2 level dari folder config)
const serviceAccount = require('../../serviceAccountKey.json'); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };