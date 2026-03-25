const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { aiChat } = require('../controllers/aiController');

// POST /api/ai-chat — NVIDIA-powered AI debugging assistant
router.post('/ai-chat', authMiddleware, aiChat);

module.exports = router;
