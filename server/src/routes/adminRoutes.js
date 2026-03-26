const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// All routes require both standard auth and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Moderation Endpoints
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.updateReportStatus);

router.delete('/bugs/:id', adminController.deleteBug);
router.delete('/comments/:id', adminController.deleteComment);

router.post('/users/:id/ban', adminController.toggleBanUser);

module.exports = router;
