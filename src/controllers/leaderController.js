const Leader = require('../models/Leader');
const path = require('path');
const fs = require('fs').promises;

// Get all leaders (public - active only)
exports.getAllLeaders = async (req, res) => {
    try {
        const leaders = await Leader.findAll();
        res.json(leaders);
    } catch (error) {
        console.error('Error fetching leaders:', error);
        res.status(500).json({ error: 'Failed to fetch leaders' });
    }
};

// Get all leaders for admin (including inactive)
exports.getAllLeadersForAdmin = async (req, res) => {
    try {
        const leaders = await Leader.findAllForAdmin();
        res.json(leaders);
    } catch (error) {
        console.error('Error fetching leaders:', error);
        res.status(500).json({ error: 'Failed to fetch leaders' });
    }
};

// Get single leader by ID
exports.getLeader = async (req, res) => {
    try {
        const { id } = req.params;
        const leader = await Leader.findById(id);
        
        if (!leader) {
            return res.status(404).json({ error: 'Leader not found' });
        }
        
        res.json(leader);
    } catch (error) {
        console.error('Error fetching leader:', error);
        res.status(500).json({ error: 'Failed to fetch leader' });
    }
};

// Create new leader (admin only)
exports.createLeader = async (req, res) => {
    try {
        const { name, title, description, icon, display_order, status } = req.body;
        
        // Validate required fields
        if (!name || !title) {
            return res.status(400).json({ error: 'Name and title are required' });
        }
        
        // Handle image upload
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/leaders/${req.file.filename}`;
        }
        
        const leaderData = {
            name,
            title,
            description,
            image: imagePath,
            icon,
            display_order: display_order || 0,
            status: status || 'active',
            created_by: req.user.id
        };
        
        const newLeader = await Leader.create(leaderData);
        res.status(201).json({
            message: 'Leader created successfully',
            leader: newLeader
        });
    } catch (error) {
        console.error('Error creating leader:', error);
        res.status(500).json({ error: 'Failed to create leader' });
    }
};

// Update leader (admin only)
exports.updateLeader = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, title, description, icon, display_order, status } = req.body;
        
        // Check if leader exists
        const existingLeader = await Leader.findById(id);
        if (!existingLeader) {
            return res.status(404).json({ error: 'Leader not found' });
        }
        
        // Validate required fields
        if (!name || !title) {
            return res.status(400).json({ error: 'Name and title are required' });
        }
        
        // Handle image upload
        let imagePath = existingLeader.image;
        if (req.file) {
            // Delete old image if exists
            if (existingLeader.image) {
                const oldImagePath = path.join(__dirname, '../../', existingLeader.image);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found or already deleted');
                }
            }
            imagePath = `/uploads/leaders/${req.file.filename}`;
        }
        
        const leaderData = {
            name,
            title,
            description,
            image: imagePath,
            icon,
            display_order: display_order || 0,
            status: status || 'active'
        };
        
        const updatedLeader = await Leader.update(id, leaderData);
        res.json({
            message: 'Leader updated successfully',
            leader: updatedLeader
        });
    } catch (error) {
        console.error('Error updating leader:', error);
        res.status(500).json({ error: 'Failed to update leader' });
    }
};

// Delete leader (admin only)
exports.deleteLeader = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if leader exists
        const existingLeader = await Leader.findById(id);
        if (!existingLeader) {
            return res.status(404).json({ error: 'Leader not found' });
        }
        
        // Delete image file if exists
        if (existingLeader.image) {
            const imagePath = path.join(__dirname, '../../', existingLeader.image);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted');
            }
        }
        
        await Leader.delete(id);
        res.json({ message: 'Leader deleted successfully' });
    } catch (error) {
        console.error('Error deleting leader:', error);
        res.status(500).json({ error: 'Failed to delete leader' });
    }
};

// Update display order (admin only)
exports.updateDisplayOrder = async (req, res) => {
    try {
        const { updates } = req.body;
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'Invalid updates format' });
        }
        
        await Leader.updateDisplayOrder(updates);
        res.json({ message: 'Display order updated successfully' });
    } catch (error) {
        console.error('Error updating display order:', error);
        res.status(500).json({ error: 'Failed to update display order' });
    }
};
