const express = require('express');
const router = express.Router();
const multer = require('multer');
const predictController = require('../controllers/predict.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Setup Multer (Simpan di RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Batas 5MB (Optional, biar server gak meledak)
  }
});

// Endpoint: POST /api/predict/food
// Wajib Login (verifyToken) -> Upload File (key: 'file') -> Controller
router.post('/food', 
    verifyToken, 
    upload.single('file'), // 'file' sesuai permintaan kamu "key (file)"
    predictController.scanFood
);

module.exports = router;