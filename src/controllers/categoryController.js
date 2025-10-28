const Category = require('../models/Category');

const categoryController = {
    // Get all categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.findAll();
            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    },

    // Get category by ID
    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json(category);
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ error: 'Failed to fetch category' });
        }
    },

    // Create new category
    createCategory: async (req, res) => {
        try {
            const { name } = req.body;
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Category name is required' });
            }
            
            const newCategory = await Category.create({ name: name.trim() });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    },

    // Update category
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Category name is required' });
            }
            
            const updatedCategory = await Category.update(id, { name: name.trim() });
            
            if (!updatedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json(updatedCategory);
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    },

    // Delete category
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCategory = await Category.delete(id);
            
            if (!deletedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json({ message: 'Category deleted successfully', category: deletedCategory });
        } catch (error) {
            console.error('Error deleting category:', error);
            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }
};

module.exports = categoryController;
