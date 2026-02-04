const express = require('express');
const authController = require('../controllers/auth.controller');

class AuthRoutes {
  constructor(controller) {
    this.router = express.Router();
    this.controller = controller;
    this.setRoutes();
  }

  setRoutes() {
    this.router.post('/google', this.controller.googleAuth);
  }
}

module.exports = new AuthRoutes(authController).router;