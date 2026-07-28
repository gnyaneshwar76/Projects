const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  register, verifyEmail, login, verifyOTP, 
  forgotPassword, resetPassword, 
  getCurrentUser, getUserProfile, updateProfile 
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased slightly for UX
  message: { error: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Public auth routes
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', loginLimiter, verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes (require auth)
router.get('/me', authMiddleware, getCurrentUser);
router.get('/profile/:userId', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
