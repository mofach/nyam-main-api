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
router.put('/:uid/profile', 
    verifyToken,  // 1. Cek Token Valid gak?
    isOwner,      // 2. Cek Punya Hak gak? (Opsional tapi disarankan)
    userController.updateProfile // 3. Proses
);
module.exports = router;