const mlService = require('../services/ml.service');

const scanFood = async (req, res) => {
  try {
    // 1. Cek apakah ada file yang diupload
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No image uploaded'
      });
    }

    // 2. Ambil Buffer gambar (karena kita pakai MemoryStorage)
    const imageBuffer = req.file.buffer;
    const filename = req.file.originalname;

    // 3. Panggil ML Service
    const prediction = await mlService.predictFood(imageBuffer, filename);

    // 4. Kirim Response ke Mobile
    // Mobile butuh "predicted_class" untuk nanti request ke Edamam (Next Step)
    res.status(200).json({
      status: 'success',
      message: 'Food recognized',
      data: prediction // { predicted_class: "sapi", predicted_prob: 0.95 }
    });

  } catch (error) {
    // Handle error "Makanan tidak dikenali" dari ML API
    if (error.message === 'Makanan tidak dikenali.' || error.message.includes('No file')) {
        return res.status(400).json({
            status: 'fail',
            message: error.message // "Makanan tidak dikenali."
        });
    }

    console.error('Scan Food Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
};

module.exports = { scanFood };