const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
    try {
        const { username, email_id, password, first_name, last_name, phone } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const existingEmail = await User.findByEmail(email_id);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create new user
        const user = await User.create({
            username,
            email_id,
            password,
            first_name,
            last_name,
            phone,
            role: 'employee'
        });
        
        // Generate token
        const token = generateToken({ 
            userId: user.id,
            username: user.username,
            role: user.role 
        });
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email_id,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is not active' });
        }
        
        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await User.updateLastLogin(user.id);
        
        // Generate token
        const token = generateToken({ 
            userId: user.id,
            username: user.username,
            role: user.role 
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email_id,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                last_login: user.last_login_datetime
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['first_name', 'last_name', 'phone', 'email_id'];
        const updates = {};
        
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        
        // Check if email is being changed and if it's already taken
        if (updates.email_id) {
            const existingEmail = await User.findByEmail(updates.email_id);
            if (existingEmail && existingEmail.id !== req.user.id) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        
        const user = await User.update(req.user.id, updates);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        await User.changePassword(req.user.id, oldPassword, newPassword);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        if (error.message === 'Invalid current password') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to change password' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll(req.query);
        
        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers
};
