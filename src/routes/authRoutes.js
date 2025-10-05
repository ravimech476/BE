const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    validatePasswordChange
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, validatePasswordChange, authController.changePassword);

// Admin only routes
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);

module.exports = router;
