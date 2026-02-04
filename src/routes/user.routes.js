const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class UserMiddleware {
  isOwner = (req, res, next) => {
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ status: 'fail', message: 'Forbidden: You can only update your own profile' });
    }
    next();
  };
}

class UserRoutes {
  constructor(controller, authMW, userMW) {
    this.router = express.Router();
    this.controller = controller;
    this.authMW = authMW;
    this.userMW = userMW;
    this.setRoutes();
  }

  setRoutes() {
    this.router.put('/:uid/profile', this.authMW.verifyToken, this.userMW.isOwner, this.controller.updateProfile);
    this.router.get('/:uid/profile', this.authMW.verifyToken, this.userMW.isOwner, this.controller.getProfile);
  }
}

module.exports = new UserRoutes(userController, authMiddleware, new UserMiddleware()).router;