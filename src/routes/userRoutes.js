const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// JSON body parser
const jsonParser = express.json({ limit: '10mb' });

// Admin only - Get all users
router.get('/', authenticate, authorize('admin'), jsonParser, userController.getAllUsers);

module.exports = router;
