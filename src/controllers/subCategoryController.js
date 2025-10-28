const SubCategory = require('../models/SubCategory');

const subCategoryController = {
    // Get all subcategories or filter by category
    getAllSubCategories: async (req, res) => {
        try {
            const { category_id } = req.query;
            
            let subCategories;
            if (category_id) {
                subCategories = await SubCategory.findByCategory(category_id);
            } else {
                subCategories = await SubCategory.findAll();
            }
            
            res.json(subCategories);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            res.status(500).json({ error: 'Failed to fetch subcategories' });
        }
    },

    // Get subcategory by ID
    getSubCategoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const subCategory = await SubCategory.findById(id);
            
            if (!subCategory) {
                return res.status(404).json({ error: 'SubCategory not found' });
            }
            
            res.json(subCategory);
        } catch (error) {
            console.error('Error fetching subcategory:', error);
            res.status(500).json({ error: 'Failed to fetch subcategory' });
        }
    },

    // Create new subcategory
    createSubCategory: async (req, res) => {
        try {
            const { category_id, name } = req.body;
            
            if (!category_id) {
                return res.status(400).json({ error: 'Category is required' });
            }
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'SubCategory name is required' });
            }
            
            const newSubCategory = await SubCategory.create({
                category_id,
                name: name.trim()
            });
            
            res.status(201).json(newSubCategory);
        } catch (error) {
            console.error('Error creating subcategory:', error);
            res.status(500).json({ error: 'Failed to create subcategory' });
        }
    },

    // Update subcategory
    updateSubCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { category_id, name } = req.body;
            
            if (!category_id) {
                return res.status(400).json({ error: 'Category is required' });
            }
            
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'SubCategory name is required' });
            }
            
            const updatedSubCategory = await SubCategory.update(id, {
                category_id,
                name: name.trim()
            });
            
            if (!updatedSubCategory) {
                return res.status(404).json({ error: 'SubCategory not found' });
            }
            
            res.json(updatedSubCategory);
        } catch (error) {
            console.error('Error updating subcategory:', error);
            res.status(500).json({ error: 'Failed to update subcategory' });
        }
    },

    // Delete subcategory
    deleteSubCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedSubCategory = await SubCategory.delete(id);
            
            if (!deletedSubCategory) {
                return res.status(404).json({ error: 'SubCategory not found' });
            }
            
            res.json({ message: 'SubCategory deleted successfully', subCategory: deletedSubCategory });
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to delete subcategory' });
        }
    }
};

module.exports = subCategoryController;
