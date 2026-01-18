const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller.js');
const verifyToken = require('../middlewares/auth.middleware');

// Endpoint: GET /api/search/recommendations
// Dashboard otomatis (Sesuai Gizi & Jam)
router.get('/recommendations', verifyToken, searchController.getSmartRecommendations);

// Endpoint: GET /api/search/query?q=nama_makanan
// Pencarian manual (Bebas / Ngeyel Mode)
router.get('/query', verifyToken, searchController.searchRecipes);

module.exports = router;