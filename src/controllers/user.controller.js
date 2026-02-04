const userService = require('../services/user.service');

class UserController {
  constructor(service) {
    this.service = service;
  }

  updateProfile = async (req, res) => {
    try {
      const { uid } = req.params;
      const data = req.body;

      if (!uid) return res.status(400).json({ status: 'fail', message: 'UID is required' });

      const requiredFields = ['height', 'weight', 'birthdate', 'gender', 'activityLevel'];
      const missingFields = requiredFields.filter(f => data[f] === undefined || data[f] === null);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ status: 'fail', message: `Data tidak lengkap: ${missingFields.join(', ')}` });
      }

      const updatedUser = await this.service.updateUserPhysicalData(uid, data);
      res.status(200).json({ status: 'success', message: 'Data fisik berhasil disimpan', data: updatedUser });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
    }
  }

  getProfile = async (req, res) => {
    try {
      const { uid } = req.params;
      const userData = await this.service.getUserProfile(uid);

      if (!userData) return res.status(404).json({ status: 'fail', message: 'User not found' });

      res.status(200).json({ status: 'success', message: 'User profile retrieved successfully', data: userData });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal Server Error', error: error.message });
    }
  }
}

module.exports = new UserController(userService);