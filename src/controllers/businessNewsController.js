const BusinessNews = require('../models/BusinessNews');
const path = require('path');
const fs = require('fs').promises;

// Get all business news (public - active only)
exports.getAllBusinessNews = async (req, res) => {
    try {
        const businessNews = await BusinessNews.findAll();
        res.json(businessNews);
    } catch (error) {
        console.error('Error fetching business news:', error);
        res.status(500).json({ error: 'Failed to fetch business news' });
    }
};

// Get all business news for admin (including inactive)
exports.getAllBusinessNewsForAdmin = async (req, res) => {
    try {
        const businessNews = await BusinessNews.findAllForAdmin();
        res.json(businessNews);
    } catch (error) {
        console.error('Error fetching business news:', error);
        res.status(500).json({ error: 'Failed to fetch business news' });
    }
};

// Get single business news by ID
exports.getBusinessNews = async (req, res) => {
    try {
        const { id } = req.params;
        const businessNews = await BusinessNews.findById(id);
        
        if (!businessNews) {
            return res.status(404).json({ error: 'Business news not found' });
        }
        
        res.json(businessNews);
    } catch (error) {
        console.error('Error fetching business news:', error);
        res.status(500).json({ error: 'Failed to fetch business news' });
    }
};

// Create new business news (admin only)
exports.createBusinessNews = async (req, res) => {
    try {
        const { title, content, excerpt, category, display_order, status, published_date } = req.body;
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/business-news/${req.file.filename}`;
        }
        
        const businessNewsData = {
            title,
            content,
            excerpt,
            image: imagePath,
            category,
            display_order: display_order || 0,
            status: status || 'active',
            published_date: published_date || new Date(),
            created_by: req.user.id
        };
        
        const newBusinessNews = await BusinessNews.create(businessNewsData);
        res.status(201).json({
            message: 'Business news created successfully',
            businessNews: newBusinessNews
        });
    } catch (error) {
        console.error('Error creating business news:', error);
        res.status(500).json({ error: 'Failed to create business news' });
    }
};

// Update business news (admin only)
exports.updateBusinessNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, category, display_order, status, published_date } = req.body;
        
        // Check if business news exists
        const existingBusinessNews = await BusinessNews.findById(id);
        if (!existingBusinessNews) {
            return res.status(404).json({ error: 'Business news not found' });
        }
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        // Handle image upload
        let imagePath = existingBusinessNews.image;
        if (req.file) {
            // Delete old image if exists
            if (existingBusinessNews.image) {
                const oldImagePath = path.join(__dirname, '../../', existingBusinessNews.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found or already deleted');
                }
            }
            imagePath = `/uploads/business-news/${req.file.filename}`;
        }
        
        const businessNewsData = {
            title,
            content,
            excerpt,
            image: imagePath,
            category,
            display_order: display_order || 0,
            status: status || 'active',
            published_date: published_date || existingBusinessNews.published_date
        };
        
        const updatedBusinessNews = await BusinessNews.update(id, businessNewsData);
        res.json({
            message: 'Business news updated successfully',
            businessNews: updatedBusinessNews
        });
    } catch (error) {
        console.error('Error updating business news:', error);
        res.status(500).json({ error: 'Failed to update business news' });
    }
};

// Delete business news (admin only)
exports.deleteBusinessNews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if business news exists
        const existingBusinessNews = await BusinessNews.findById(id);
        if (!existingBusinessNews) {
            return res.status(404).json({ error: 'Business news not found' });
        }
        
        // Delete image file if exists
        if (existingBusinessNews.image) {
            const imagePath = path.join(__dirname, '../../', existingBusinessNews.image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted');
            }
        }
        
        await BusinessNews.delete(id);
        res.json({ message: 'Business news deleted successfully' });
    } catch (error) {
        console.error('Error deleting business news:', error);
        res.status(500).json({ error: 'Failed to delete business news' });
    }
};
