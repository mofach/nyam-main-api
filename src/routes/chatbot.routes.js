const express = require('express');
const chatbotController = require('../controllers/chatbot.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class ChatbotRoutes {
  constructor(controller, middleware) {
    this.router = express.Router();
    this.controller = controller;
    this.middleware = middleware;
    this.setRoutes();
  }

  setRoutes() {
    this.router.post('/', this.middleware.verifyToken, this.controller.chat);
  }
}

module.exports = new ChatbotRoutes(chatbotController, authMiddleware).router;