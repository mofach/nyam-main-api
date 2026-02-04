const express = require('express');
const router = express.Router();
const multer = require('multer');
const predictController = require('../controllers/predict.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/food', 
    authMiddleware.verifyToken, 
    upload.single('file'), 
    predictController.scanFood
);

module.exports = router;