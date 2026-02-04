const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Dashboard otomatis (Sesuai Gizi & Jam)
router.get('/recommendations', 
    authMiddleware.verifyToken, 
    searchController.getSmartRecommendations
);

// Pencarian manual
router.get('/query', 
    authMiddleware.verifyToken, 
    searchController.searchRecipes
);

module.exports = router;