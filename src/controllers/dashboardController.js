const DashboardLink = require('../models/DashboardLink');

// Get all dashboard links (public)
exports.getAllLinks = async (req, res) => {
    try {
        const links = await DashboardLink.getAll({ status: 'active' });
        
        res.json({
            success: true,
            links
        });
    } catch (error) {
        console.error('Get all dashboard links error:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard links',
            details: error.message 
        });
    }
};

// Get dashboard links grouped by category and subcategory (public)
exports.getLinksByCategory = async (req, res) => {
    try {
        const links = await DashboardLink.getAll({ status: 'active' });
        
        // Group links by category and subcategory
        const groupedData = {};
        
        links.forEach(link => {
            if (!link.category_id || !link.subcategory_id) return;
            
            if (!groupedData[link.category_id]) {
                groupedData[link.category_id] = {
                    category_id: link.category_id,
                    category_name: link.category_name,
                    subcategories: {}
                };
            }
            
            if (!groupedData[link.category_id].subcategories[link.subcategory_id]) {
                groupedData[link.category_id].subcategories[link.subcategory_id] = {
                    subcategory_id: link.subcategory_id,
                    subcategory_name: link.subcategory_name,
                    links: []
                };
            }
            
            groupedData[link.category_id].subcategories[link.subcategory_id].links.push({
                id: link.id,
                title: link.title,
                description: link.description,
                url: link.url
            });
        });
        
        // Convert to array format
        const result = Object.values(groupedData).map(category => ({
            ...category,
            subcategories: Object.values(category.subcategories)
        }));
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get links by category error:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard links',
            details: error.message 
        });
    }
};

// Get single dashboard link
exports.getLink = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await DashboardLink.findById(id);
        
        if (!link) {
            return res.status(404).json({ error: 'Dashboard link not found' });
        }
        
        res.json({
            success: true,
            link
        });
    } catch (error) {
        console.error('Get dashboard link error:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard link',
            details: error.message 
        });
    }
};

// Create dashboard link (admin only)
exports.createLink = async (req, res) => {
    try {
        const { title, description, url, display_order, status } = req.body;
        
        if (!title || !url) {
            return res.status(400).json({ 
                error: 'Title and URL are required' 
            });
        }
        
        const link = await DashboardLink.create({
            title,
            description,
            url,
            display_order,
            status
        });
        
        res.status(201).json({
            success: true,
            message: 'Dashboard link created successfully',
            link
        });
    } catch (error) {
        console.error('Create dashboard link error:', error);
        res.status(500).json({ 
            error: 'Failed to create dashboard link',
            details: error.message 
        });
    }
};

// Update dashboard link (admin only)
exports.updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const existingLink = await DashboardLink.findById(id);
        if (!existingLink) {
            return res.status(404).json({ error: 'Dashboard link not found' });
        }
        
        const link = await DashboardLink.update(id, updateData);
        
        res.json({
            success: true,
            message: 'Dashboard link updated successfully',
            link
        });
    } catch (error) {
        console.error('Update dashboard link error:', error);
        res.status(500).json({ 
            error: 'Failed to update dashboard link',
            details: error.message 
        });
    }
};

// Delete dashboard link (admin only)
exports.deleteLink = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingLink = await DashboardLink.findById(id);
        if (!existingLink) {
            return res.status(404).json({ error: 'Dashboard link not found' });
        }
        
        await DashboardLink.delete(id);
        
        res.json({
            success: true,
            message: 'Dashboard link deleted successfully'
        });
    } catch (error) {
        console.error('Delete dashboard link error:', error);
        res.status(500).json({ 
            error: 'Failed to delete dashboard link',
            details: error.message 
        });
    }
};
