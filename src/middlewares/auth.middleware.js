const { admin } = require('../config/firebase.config');

const verifyToken = async (req, res, next) => {
  try {
    // 1. Ambil token dari Header Authorization
    // Format standar: "Bearer eyJhbGciOi..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized: No token provided'
      });
    }

    // Ambil string tokennya saja (buang kata 'Bearer ')
    const idToken = authHeader.split('Bearer ')[1];

    // 2. Verifikasi Token ke Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 3. Simpan data user hasil decode ke request object
    // Supaya bisa dipakai di controller nanti (req.user.uid)
    req.user = decodedToken;

    next(); // Lanjut ke controller
  } catch (error) {
    console.error('Middleware Auth Error:', error);
    return res.status(401).json({
      status: 'fail',
      message: 'Unauthorized: Invalid or expired token',
      error: error.message
    });
  }
};

module.exports = verifyToken;