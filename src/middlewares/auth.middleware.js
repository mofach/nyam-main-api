const { admin } = require('../config/firebase.config');

class AuthMiddleware {
  constructor(firebaseAdmin) {
    this.admin = firebaseAdmin;
  }

  verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'fail', message: 'Unauthorized: No token provided' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await this.admin.auth().verifyIdToken(idToken);

      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Middleware Auth Error:', error);
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized: Invalid or expired token',
        error: error.message
      });
    }
  }
}

module.exports = new AuthMiddleware(admin);