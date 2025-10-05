const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

// JSON body parser
const jsonParser = express.json({ limit: '10mb' });

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/messages', jsonParser, chatController.sendMessage);

// Get conversation with a specific user
router.get('/conversations/:contactId', chatController.getConversation);

// Get all conversations
router.get('/conversations', chatController.getAllConversations);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Poll for new messages (for real-time updates)
router.get('/poll/:contactId', chatController.pollMessages);

// Get all users for chat
router.get('/users', chatController.getAllUsers);

module.exports = router;
