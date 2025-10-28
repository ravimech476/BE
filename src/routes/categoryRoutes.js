const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply JSON parser
router.use(express.json());

// PUBLIC ROUTE - Get all categories (no authentication required)
router.get('/public', categoryController.getAllCategories);

// All routes below require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Create new category
router.post('/', categoryController.createCategory);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
