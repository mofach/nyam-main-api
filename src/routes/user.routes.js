const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/auth.middleware');

const isOwner = (req, res, next) => {
    if (req.user.uid !== req.params.uid) {
        return res.status(403).json({ 
            status: 'fail', 
            message: 'Forbidden: You can only update your own profile' 
        });
    }
    next();
};
// 1. Update Profile (PUT)
router.put('/:uid/profile', 
    verifyToken, 
    isOwner, 
    userController.updateProfile
);

// 2. Get Profile (GET) <-- INI KODE BARUNYA
router.get('/:uid/profile', 
    verifyToken,  // Cek Login
    isOwner,      // Cek Kepemilikan Data
    userController.getProfile
);
module.exports = router;