const express = require('express');
const newsController = require('../controllers/news.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class NewsRoutes {
  constructor(controller, middleware) {
    this.router = express.Router();
    this.controller = controller;
    this.middleware = middleware;
    this.setRoutes();
  }

  setRoutes() {
    this.router.get('/', this.middleware.verifyToken, this.controller.getNews);
  }
}

module.exports = new NewsRoutes(newsController, authMiddleware).router;