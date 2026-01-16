const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Method PUT karena kita meng-update data user yang sudah dibuat saat Login Google
// Endpoint: /api/users/:uid/profile
router.put('/:uid/profile', userController.updateProfile);

module.exports = router;