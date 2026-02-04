const mlService = require('../services/ml.service');
const userService = require('../services/user.service');
const edamamService = require('../services/edamam.service');

class PredictController {
  constructor(ml, user, edamam) {
    this.mlService = ml;
    this.userService = user;
    this.edamamService = edamam;
  }

  scanFood = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'fail', message: 'No image uploaded' });
      }

      const uid = req.user.uid; 
      const userProfile = await this.userService.getUserProfile(uid);
      
      if (!userProfile) {
          return res.status(404).json({ status: 'fail', message: 'User profile not found. Please complete onboarding.' });
      }

      const prediction = await this.mlService.predictFood(req.file.buffer, req.file.originalname);

      const recommendations = await this.edamamService.getRecommendations(
          uid, 
          userProfile, 
          prediction.predicted_class
      );

      res.status(200).json({
        status: 'success',
        message: 'Food recognized and recipes fetched',
        data: {
          recognition: prediction,
          recommendations: recommendations
        }
      });

    } catch (error) {
      if (error.message === 'Makanan tidak dikenali.' || error.message.includes('No file')) {
          return res.status(400).json({ status: 'fail', message: error.message });
      }
      console.error('Scan Flow Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error', detail: error.message });
    }
  }
}

module.exports = new PredictController(mlService, userService, edamamService);