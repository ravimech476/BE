const News = require('../models/News');
const path = require('path');
const fs = require('fs').promises;

// Get all news (public - active only)
exports.getAllNews = async (req, res) => {
    try {
        const news = await News.findAll();
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};

// Get all news for admin (including inactive)
exports.getAllNewsForAdmin = async (req, res) => {
    try {
        const news = await News.findAllForAdmin();
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};

// Get single news by ID
exports.getNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id);
        
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};

// Create new news (admin only)
exports.createNews = async (req, res) => {
    try {
        const { title, content, excerpt, category, display_order, status, published_date } = req.body;
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/news/${req.file.filename}`;
        }
        
        const newsData = {
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
        
        const newNews = await News.create(newsData);
        res.status(201).json({
            message: 'News created successfully',
            news: newNews
        });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Failed to create news' });
    }
};

// Update news (admin only)
exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, category, display_order, status, published_date } = req.body;
        
        // Check if news exists
        const existingNews = await News.findById(id);
        if (!existingNews) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        // Handle image upload
        let imagePath = existingNews.image;
        if (req.file) {
            // Delete old image if exists
            if (existingNews.image) {
                const oldImagePath = path.join(__dirname, '../../', existingNews.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found or already deleted');
                }
            }
            imagePath = `/uploads/news/${req.file.filename}`;
        }
        
        const newsData = {
            title,
            content,
            excerpt,
            image: imagePath,
            category,
            display_order: display_order || 0,
            status: status || 'active',
            published_date: published_date || existingNews.published_date
        };
        
        const updatedNews = await News.update(id, newsData);
        res.json({
            message: 'News updated successfully',
            news: updatedNews
        });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Failed to update news' });
    }
};

// Delete news (admin only)
exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if news exists
        const existingNews = await News.findById(id);
        if (!existingNews) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        // Delete image file if exists
        if (existingNews.image) {
            const imagePath = path.join(__dirname, '../../', existingNews.image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted');
            }
        }
        
        await News.delete(id);
        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Failed to delete news' });
    }
};
