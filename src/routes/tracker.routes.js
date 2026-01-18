const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/tracker.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Endpoint: POST /api/tracker/meals (Simpan Makanan)
router.post('/meals', verifyToken, trackerController.addMeal);

// Endpoint: GET /api/tracker/history (Ambil Data Progress)
router.get('/history', verifyToken, trackerController.getTodayLog);

module.exports = router;