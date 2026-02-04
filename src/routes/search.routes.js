const express = require('express');
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class SearchRoutes {
  constructor(controller, middleware) {
    this.router = express.Router();
    this.controller = controller;
    this.middleware = middleware;
    this.setRoutes();
  }

  setRoutes() {
    this.router.get('/recommendations', this.middleware.verifyToken, this.controller.getSmartRecommendations);
    this.router.get('/query', this.middleware.verifyToken, this.controller.searchRecipes);
  }
}

module.exports = new SearchRoutes(searchController, authMiddleware).router;