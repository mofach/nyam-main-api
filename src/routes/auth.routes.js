const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Karena di controller sudah pakai arrow function, tidak perlu .bind(this)
router.post('/google', authController.googleAuth);

module.exports = router;