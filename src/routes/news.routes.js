const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Endpoint: GET /api/news
router.get('/', authMiddleware.verifyToken, newsController.getNews);

module.exports = router;