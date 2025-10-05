const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { getOnlineUsers } = require('../config/socket');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, message_text } = req.body;
        const sender_id = req.user.id;
        
        if (!receiver_id || !message_text) {
            return res.status(400).json({ 
                error: 'Receiver ID and message text are required' 
            });
        }
        
        if (!message_text.trim()) {
            return res.status(400).json({ 
                error: 'Message cannot be empty' 
            });
        }
        
        // Check if receiver exists
        const receiver = await User.findById(receiver_id);
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found' });
        }
        
        const message = await ChatMessage.create({
            sender_id,
            receiver_id,
            message_text: message_text.trim()
        });
        
        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ 
            error: 'Failed to send message',
            details: error.message 
        });
    }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        
        const messages = await ChatMessage.getConversation(userId, contactId, limit);
        
        // Mark messages as read
        await ChatMessage.markAsRead(userId, contactId);
        
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ 
            error: 'Failed to get conversation',
            details: error.message 
        });
    }
};

// Get all conversations for the current user
exports.getAllConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await ChatMessage.getUserConversations(userId);
        
        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ 
            error: 'Failed to get conversations',
            details: error.message 
        });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await ChatMessage.getUnreadCount(userId);
        
        res.json({
            success: true,
            unread_count: count
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ 
            error: 'Failed to get unread count',
            details: error.message 
        });
    }
};

// Poll for new messages (for real-time updates without WebSocket)
exports.pollMessages = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user.id;
        const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 5000); // Default: last 5 seconds
        
        const messages = await ChatMessage.getNewMessages(userId, contactId, since);
        
        // Mark new messages from contact as read
        if (messages.length > 0) {
            await ChatMessage.markAsRead(userId, contactId);
        }
        
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Poll messages error:', error);
        res.status(500).json({ 
            error: 'Failed to poll messages',
            details: error.message 
        });
    }
};

// Get all active users for chat
exports.getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const users = await User.findAll();
        const onlineUserIds = getOnlineUsers();
        
        // Exclude current user and format data
        const userList = users
            .filter(user => user.id !== currentUserId)
            .map(user => ({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
                email_id: user.email_id,
                is_online: onlineUserIds.includes(user.id)
            }));
        
        res.json({
            success: true,
            users: userList
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            error: 'Failed to get users',
            details: error.message 
        });
    }
};
