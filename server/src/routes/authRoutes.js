const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  register, verifyEmail, login, verify2FA, toggle2FA, 
  forgotPassword, resetPassword, 
  getCurrentUser, getUserProfile, updateProfile 
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Public auth routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', loginLimiter, login);
router.post('/verify-2fa', loginLimiter, verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require auth)
router.post('/2fa/toggle', authMiddleware, toggle2FA);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/profile/:userId', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
