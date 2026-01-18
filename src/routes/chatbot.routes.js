const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Endpoint: POST /api/chat
router.post('/', verifyToken, chatbotController.chat);

module.exports = router;