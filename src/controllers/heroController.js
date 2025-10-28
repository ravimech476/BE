const HeroSection = require('../models/HeroSection');
const path = require('path');
const fs = require('fs').promises;

// Get active hero section (PUBLIC)
exports.getActive = async (req, res) => {
    try {
        const hero = await HeroSection.getActive();
        
        if (!hero) {
            return res.status(404).json({ error: 'No active hero section found' });
        }
        
        res.json(hero);
    } catch (error) {
        console.error('Error fetching active hero section:', error);
        res.status(500).json({ error: 'Failed to fetch hero section' });
    }
};

// Get all hero sections (ADMIN)
exports.getAll = async (req, res) => {
    try {
        const heroes = await HeroSection.findAll();
        res.json(heroes);
    } catch (error) {
        console.error('Error fetching hero sections:', error);
        res.status(500).json({ error: 'Failed to fetch hero sections' });
    }
};

// Get single hero section by ID (ADMIN)
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const hero = await HeroSection.findById(id);
        
        if (!hero) {
            return res.status(404).json({ error: 'Hero section not found' });
        }
        
        res.json(hero);
    } catch (error) {
        console.error('Error fetching hero section:', error);
        res.status(500).json({ error: 'Failed to fetch hero section' });
    }
};

// Create new hero section (ADMIN)
exports.create = async (req, res) => {
    try {
        const { title } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/hero/${req.file.filename}`;
        }
        
        const heroData = {
            title,
            image: imagePath,
            created_by: req.user.id
        };
        
        const newHero = await HeroSection.create(heroData);
        res.status(201).json({
            message: 'Hero section created successfully',
            hero: newHero
        });
    } catch (error) {
        console.error('Error creating hero section:', error);
        res.status(500).json({ error: 'Failed to create hero section' });
    }
};

// Update hero section (ADMIN)
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, is_active } = req.body;
        
        // Check if hero section exists
        const existingHero = await HeroSection.findById(id);
        if (!existingHero) {
            return res.status(404).json({ error: 'Hero section not found' });
        }
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        // Handle image upload
        let imagePath = existingHero.image;
        if (req.file) {
            // Delete old image if exists and is not a URL
            if (existingHero.image && !existingHero.image.startsWith('http')) {
                const oldImagePath = path.join(__dirname, '../../', existingHero.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found or already deleted');
                }
            }
            imagePath = `/uploads/hero/${req.file.filename}`;
        }
        
        const heroData = {
            title,
            image: imagePath,
            is_active: is_active === 'true' || is_active === true || is_active === 1
        };
        
        const updatedHero = await HeroSection.update(id, heroData);
        res.json({
            message: 'Hero section updated successfully',
            hero: updatedHero
        });
    } catch (error) {
        console.error('Error updating hero section:', error);
        res.status(500).json({ error: 'Failed to update hero section' });
    }
};

// Delete hero section (ADMIN)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if hero section exists
        const existingHero = await HeroSection.findById(id);
        if (!existingHero) {
            return res.status(404).json({ error: 'Hero section not found' });
        }
        
        // Don't allow deleting the active hero section
        if (existingHero.is_active) {
            return res.status(400).json({ error: 'Cannot delete active hero section. Please activate another one first.' });
        }
        
        // Delete image file if exists and is not a URL
        if (existingHero.image && !existingHero.image.startsWith('http')) {
            const imagePath = path.join(__dirname, '../../', existingHero.image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted');
            }
        }
        
        await HeroSection.delete(id);
        res.json({ message: 'Hero section deleted successfully' });
    } catch (error) {
        console.error('Error deleting hero section:', error);
        res.status(500).json({ error: 'Failed to delete hero section' });
    }
};

// Set active hero section (ADMIN)
exports.setActive = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if hero section exists
        const existingHero = await HeroSection.findById(id);
        if (!existingHero) {
            return res.status(404).json({ error: 'Hero section not found' });
        }
        
        const updatedHero = await HeroSection.setActive(id);
        res.json({
            message: 'Hero section activated successfully',
            hero: updatedHero
        });
    } catch (error) {
        console.error('Error setting active hero section:', error);
        res.status(500).json({ error: 'Failed to set active hero section' });
    }
};
