const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply JSON parser
router.use(express.json());

// PUBLIC ROUTE - Get all subcategories or filter by category (no authentication required)
router.get('/public', subCategoryController.getAllSubCategories);

// All routes below require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all subcategories (or filter by category_id query param)
router.get('/', subCategoryController.getAllSubCategories);

// Get subcategory by ID
router.get('/:id', subCategoryController.getSubCategoryById);

// Create new subcategory
router.post('/', subCategoryController.createSubCategory);

// Update subcategory
router.put('/:id', subCategoryController.updateSubCategory);

// Delete subcategory
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;
