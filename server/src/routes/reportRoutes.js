const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, reportController.submitReport);

module.exports = router;
