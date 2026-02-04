const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

class UserMiddleware {
    isOwner(req, res, next) {
    if (req.user.uid !== req.params.uid) {
        return res.status(403).json({ status: 'fail', message: 'Forbidden: You can only update your own profile' });
    }
    next();
    }
}

const userMW = new UserMiddleware();

router.put('/:uid/profile', authMiddleware.verifyToken, userMW.isOwner, userController.updateProfile);
router.get('/:uid/profile', authMiddleware.verifyToken, userMW.isOwner, userController.getProfile);

module.exports = router;