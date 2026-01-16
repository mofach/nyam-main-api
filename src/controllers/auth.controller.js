const authService = require('../services/auth.service');

const googleAuth = async (req, res) => {
  try {
    // 1. Ambil Input
    const { idToken } = req.body;

    // 2. Validasi Input
    if (!idToken) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'ID Token is required' 
      });
    }

    // 3. Panggil Service (Proses Bisnis)
    // Service akan mengembalikan data user dan status apakah dia user baru/lama
    const { userData, isNewUser } = await authService.authenticateGoogleUser(idToken);

    // 4. Kirim Response
    res.status(200).json({
      status: 'success',
      message: isNewUser ? 'Registration successful' : 'Login successful',
      data: userData
    });

  } catch (error) {
    console.error('Auth Service Error:', error);
    
    // Handle error spesifik token
    if (error.code && error.code.startsWith('auth/')) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired Google token',
            error: error.message
        });
    }

    // Error umum server
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

module.exports = { googleAuth };