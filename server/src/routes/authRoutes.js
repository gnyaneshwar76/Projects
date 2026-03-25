const express = require('express');
const { register, login, getCurrentUser, getUserProfile, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.get('/profile/:userId', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
