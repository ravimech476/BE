const ChatMessage = require('../models/ChatMessage');
const { verifyToken } = require('../utils/jwt');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

const setupSocketIO = (io) => {
    // Middleware for authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error'));
            }
            
            const decoded = verifyToken(token);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });
    
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.username} (ID: ${socket.userId})`);
        
        // Add user to online users
        onlineUsers.set(socket.userId, socket.id);
        
        // Broadcast online users list
        io.emit('online_users', Array.from(onlineUsers.keys()));
        
        // User joins their personal room
        socket.join(`user_${socket.userId}`);
        
        // Handle sending a message
        socket.on('send_message', async (data) => {
            try {
                const { receiver_id, message_text } = data;
                
                if (!message_text || !message_text.trim()) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }
                
                // Save message to database
                const message = await ChatMessage.create({
                    sender_id: socket.userId,
                    receiver_id: receiver_id,
                    message_text: message_text.trim()
                });
                
                // Add sender info to message
                message.sender_username = socket.username;
                
                // Send to receiver INSTANTLY if they're online
                io.to(`user_${receiver_id}`).emit('new_message', message);
                
                // Send confirmation back to sender
                socket.emit('message_sent', message);
                
                console.log(`📨 Message from ${socket.username} to user ${receiver_id}`);
                
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        
        // Handle typing indicator
        socket.on('typing', (data) => {
            const { receiver_id, isTyping } = data;
            io.to(`user_${receiver_id}`).emit('user_typing', {
                userId: socket.userId,
                username: socket.username,
                isTyping
            });
        });
        
        // Handle marking messages as read
        socket.on('mark_as_read', async (data) => {
            try {
                const { sender_id } = data;
                await ChatMessage.markAsRead(socket.userId, sender_id);
                
                // Notify sender that messages were read
                io.to(`user_${sender_id}`).emit('messages_read', {
                    reader_id: socket.userId
                });
                
            } catch (error) {
                console.error('Mark as read error:', error);
            }
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.username} (ID: ${socket.userId})`);
            
            // Remove from online users
            onlineUsers.delete(socket.userId);
            
            // Broadcast updated online users list
            io.emit('online_users', Array.from(onlineUsers.keys()));
        });
        
        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
    
    return io;
};

// Get online users (for API endpoint)
const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

module.exports = {
    setupSocketIO,
    getOnlineUsers
};
