const express = require('express');
const trackerController = require('../controllers/tracker.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class TrackerRoutes {
  constructor(controller, middleware) {
    this.router = express.Router();
    this.controller = controller;
    this.middleware = middleware;
    this.setRoutes();
  }

  setRoutes() {
    this.router.post('/meals', this.middleware.verifyToken, this.controller.addMeal);
    this.router.get('/history', this.middleware.verifyToken, this.controller.getTodayLog);
  }
}

module.exports = new TrackerRoutes(trackerController, authMiddleware).router;