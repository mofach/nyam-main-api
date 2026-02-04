const authService = require('../services/auth.service');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  // Gunakan arrow function agar 'this' tetap merujuk ke class instance
  googleAuth = async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ status: 'fail', message: 'ID Token is required' });
      }

      const { userData, isNewUser } = await this.service.authenticateGoogleUser(idToken);

      res.status(200).json({
        status: 'success',
        message: isNewUser ? 'Registration successful' : 'Login successful',
        data: userData
      });
    } catch (error) {
      console.error('Auth Controller Error:', error);
      if (error.code && error.code.startsWith('auth/')) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired Google token',
          error: error.message
        });
      }
      res.status(500).json({ status: 'error', message: 'Internal Server Error', error: error.message });
    }
  }
}

module.exports = new AuthController(authService);