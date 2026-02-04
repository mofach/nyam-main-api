const express = require('express');
const multer = require('multer');
const predictController = require('../controllers/predict.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class PredictRoutes {
  constructor(controller, middleware) {
    this.router = express.Router();
    this.controller = controller;
    this.middleware = middleware;
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }
    });
    this.setRoutes();
  }

  setRoutes() {
    this.router.post('/food', 
      this.middleware.verifyToken, 
      this.upload.single('file'), 
      this.controller.scanFood
    );
  }
}

module.exports = new PredictRoutes(predictController, authMiddleware).router;