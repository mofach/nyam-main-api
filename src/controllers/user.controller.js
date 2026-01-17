const userService = require('../services/user.service');


//UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const data = req.body;

    // 1. Validasi Input (Tugas Controller: Memastikan data lengkap sebelum diproses)
    if (!uid) {
      return res.status(400).json({ status: 'fail', message: 'UID is required' });
    }
    
    // Validasi field wajib
    const requiredFields = ['height', 'weight', 'birthdate', 'gender', 'activityLevel'];
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Data tidak lengkap. Field yang kurang: ${missingFields.join(', ')}`
      });
    }

    // 2. Panggil Service (Lempar ke "Dapur")
    const updatedUser = await userService.updateUserPhysicalData(uid, data);

    // 3. Kirim Respon (Tugas Controller: Formatting Response)
    res.status(200).json({
      status: 'success',
      message: 'Data fisik berhasil disimpan',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
};

//GET PROFILE
const getProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    // 1. Validasi UID (Guard Clause)
    if (!uid) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'UID is required' 
      });
    }

    // 2. Panggil Service
    const userData = await userService.getUserProfile(uid);

    // 3. Cek apakah user ada
    if (!userData) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // 4. Kirim Response Sukses
    res.status(200).json({
      status: 'success',
      message: 'User profile retrieved successfully',
      data: userData
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

module.exports = { 
  updateProfile, 
  getProfile
};