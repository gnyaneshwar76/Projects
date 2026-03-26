const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Specific named routes MUST come before /:bugId parameterized routes
 */
router.get('/search', authMiddleware, bugController.searchBugs);
router.get('/tags', authMiddleware, bugController.getTags);
router.get('/stats/dashboard', authMiddleware, bugController.getDashboardStats);
router.get('/analysis/cluster', authMiddleware, bugController.analyzeWithClustering);
router.post('/suggest', authMiddleware, bugController.suggestBugImprovements);

/**
 * Bug CRUD Operations
 */
router.post('/', authMiddleware, bugController.createBug);
router.get('/', authMiddleware, bugController.getAllBugs);
router.get('/:bugId/similar', authMiddleware, bugController.findSimilar);
router.get('/:bugId', authMiddleware, bugController.getBugById);
router.put('/:bugId', authMiddleware, bugController.updateBug);
router.delete('/:bugId', authMiddleware, bugController.deleteBug);

/**
 * Comments & Engagement
 */
router.post('/:bugId/comments', authMiddleware, bugController.addComment);
router.get('/:bugId/comments', authMiddleware, bugController.getComments);
router.post('/:bugId/comments/:commentId/vote', authMiddleware, bugController.voteOnComment);
router.post('/:bugId/vote', authMiddleware, bugController.voteOnBug);
router.put('/:bugId/solve', authMiddleware, bugController.markAsSolved);

// Bookmark
router.post('/:bugId/bookmark', authMiddleware, bugController.toggleBookmark);

// AI Chat Feature
router.post('/chat/ai', bugController.chatWithAI);

module.exports = router;
