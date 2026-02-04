const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/tracker.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/meals', authMiddleware.verifyToken, trackerController.addMeal);
router.get('/history', authMiddleware.verifyToken, trackerController.getTodayLog);

module.exports = router;