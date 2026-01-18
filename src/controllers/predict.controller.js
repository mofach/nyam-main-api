const mlService = require('../services/ml.service');
const userService = require('../services/user.service');
const edamamService = require('../services/edamam.service');

const scanFood = async (req, res) => {
  try {
    // 1. Validasi File
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image uploaded' });
    }

    // 2. Ambil UID dari Token (Middleware)
    // Kita butuh UID untuk mengambil data alergi & sisa nutrisi user
    const uid = req.user.uid; 
    
    // 3. Ambil Profile User
    const userProfile = await userService.getUserProfile(uid);
    if (!userProfile) {
        return res.status(404).json({ status: 'fail', message: 'User profile not found. Please complete onboarding.' });
    }

    // 4. ML Prediction (Kirim Gambar ke Python)
    const imageBuffer = req.file.buffer;
    const filename = req.file.originalname;
    
    // Prediksi: { predicted_class: "ayam", predicted_prob: 0.95 }
    const prediction = await mlService.predictFood(imageBuffer, filename);

    // 5. Edamam Search (Pakai hasil prediksi ML)
    const recommendations = await edamamService.getRecommendations(
        uid, 
        userProfile, 
        prediction.predicted_class // misal "ayam"
    );

    // 6. Response Gabungan
    res.status(200).json({
      status: 'success',
      message: 'Food recognized and recipes fetched',
      data: {
        recognition: prediction,   // Hasil Scan Gambar
        recommendations: recommendations // Hasil Resep Edamam
      }
    });

  } catch (error) {
    // Error Handling
    if (error.message === 'Makanan tidak dikenali.' || error.message.includes('No file')) {
        return res.status(400).json({ status: 'fail', message: error.message });
    }
    console.error('Scan Flow Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error', detail: error.message });
  }
};

module.exports = { scanFood };