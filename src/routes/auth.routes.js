const express = require('express');
const router = express.Router();
// Import controller dengan nama file baru
const authController = require('../controllers/auth.controller');

// POST /api/auth/google
router.post('/google', authController.googleAuth);

module.exports = router;