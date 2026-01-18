const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Endpoint: GET /api/news
router.get('/', verifyToken, newsController.getNews);

module.exports = router;