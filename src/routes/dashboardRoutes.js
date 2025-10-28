const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// JSON body parser
const jsonParser = express.json({ limit: '10mb' });

// Public routes - Get all active dashboard links
router.get('/links', jsonParser, dashboardController.getAllLinks);

// Public route - Get dashboard links grouped by category
router.get('/links-by-category', jsonParser, dashboardController.getLinksByCategory);

// Admin only routes
router.post('/links', authenticate, authorize('admin'), jsonParser, dashboardController.createLink);
router.get('/links/:id', authenticate, authorize('admin'), jsonParser, dashboardController.getLink);
router.put('/links/:id', authenticate, authorize('admin'), jsonParser, dashboardController.updateLink);
router.delete('/links/:id', authenticate, authorize('admin'), jsonParser, dashboardController.deleteLink);

module.exports = router;
