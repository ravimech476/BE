const User = require('../models/User');

// Get all users (for dropdowns, etc.) - Admin only
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        
        // Return simplified user data for dropdown
        const userList = users.map(user => ({
            id: user.id,
            username: user.username,
            email_id: user.email_id,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: `${user.first_name} ${user.last_name}`,
            display_name: `${user.first_name} ${user.last_name} (${user.email_id})`
        }));
        
        res.json(userList);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
