const express = require('express');
const router = express.Router();
const passkeyController = require('../controllers/passkeyController');
const { authMiddleware } = require('../middleware/authMiddleware');

// PROTECTED: User must be logged in to register a passkey
router.post('/register/options', authMiddleware, passkeyController.getRegistrationOptions);
router.post('/register/verify', authMiddleware, passkeyController.verifyRegistration);

// PUBLIC: Login flow
router.post('/login/options', passkeyController.getAuthenticationOptions);
router.post('/login/verify', passkeyController.verifyAuthentication);

module.exports = router;
