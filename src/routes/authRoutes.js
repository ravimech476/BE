const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    validatePasswordChange
} = require('../middleware/validation');

// JSON body parser for all auth routes
const jsonParser = express.json({ limit: '10mb' });

// Public routes
router.post('/register', jsonParser, validateUserRegistration, authController.register);
router.post('/login', jsonParser, validateUserLogin, authController.login);

// Protected routes
router.get('/profile', authenticate, jsonParser, authController.getProfile);
router.put('/profile', authenticate, jsonParser, authController.updateProfile);
router.post('/change-password', authenticate, jsonParser, validatePasswordChange, authController.changePassword);

// Admin only routes
router.get('/users', authenticate, authorize('admin'), jsonParser, authController.getAllUsers);

module.exports = router;
