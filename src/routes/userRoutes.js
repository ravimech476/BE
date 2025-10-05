const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin only - Get all users
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

module.exports = router;
