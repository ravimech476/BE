const { getPool, sql } = require('../config/database');

class ChatMessage {
    // Send a message
    static async create(messageData) {
        const pool = getPool();
        const result = await pool.request()
            .input('sender_id', sql.Int, messageData.sender_id)
            .input('receiver_id', sql.Int, messageData.receiver_id)
            .input('message_text', sql.NVarChar, messageData.message_text)
            .query(`
                INSERT INTO chat_messages (sender_id, receiver_id, message_text)
                OUTPUT INSERTED.*
                VALUES (@sender_id, @receiver_id, @message_text)
            `);
        
        return result.recordset[0];
    }
    
    // Get conversation between two users
    static async getConversation(userId1, userId2, limit = 50) {
        const pool = getPool();
        const result = await pool.request()
            .input('user1', sql.Int, userId1)
            .input('user2', sql.Int, userId2)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) 
                    cm.*,
                    sender.username as sender_username,
                    sender.first_name as sender_first_name,
                    sender.last_name as sender_last_name,
                    receiver.username as receiver_username,
                    receiver.first_name as receiver_first_name,
                    receiver.last_name as receiver_last_name
                FROM chat_messages cm
                JOIN tbl_users sender ON cm.sender_id = sender.id
                JOIN tbl_users receiver ON cm.receiver_id = receiver.id
                WHERE (cm.sender_id = @user1 AND cm.receiver_id = @user2)
                   OR (cm.sender_id = @user2 AND cm.receiver_id = @user1)
                ORDER BY cm.created_date DESC
            `);
        
        // Return in chronological order (oldest first)
        return result.recordset.reverse();
    }
    
    // Get all conversations for a user (list of users they've chatted with)
    static async getUserConversations(userId) {
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                WITH ConversationUsers AS (
                    SELECT DISTINCT
                        CASE 
                            WHEN sender_id = @userId THEN receiver_id
                            ELSE sender_id
                        END as contact_id
                    FROM chat_messages
                    WHERE sender_id = @userId OR receiver_id = @userId
                ),
                LastMessages AS (
                    SELECT 
                        CASE 
                            WHEN sender_id = @userId THEN receiver_id
                            ELSE sender_id
                        END as contact_id,
                        MAX(created_date) as last_message_date,
                        (SELECT TOP 1 message_text 
                         FROM chat_messages cm2 
                         WHERE (cm2.sender_id = @userId AND cm2.receiver_id = CASE WHEN cm.sender_id = @userId THEN cm.receiver_id ELSE cm.sender_id END)
                            OR (cm2.receiver_id = @userId AND cm2.sender_id = CASE WHEN cm.sender_id = @userId THEN cm.receiver_id ELSE cm.sender_id END)
                         ORDER BY cm2.created_date DESC) as last_message,
                        (SELECT COUNT(*) 
                         FROM chat_messages 
                         WHERE receiver_id = @userId 
                         AND sender_id = CASE WHEN cm.sender_id = @userId THEN cm.receiver_id ELSE cm.sender_id END
                         AND is_read = 0) as unread_count
                    FROM chat_messages cm
                    WHERE sender_id = @userId OR receiver_id = @userId
                    GROUP BY CASE WHEN sender_id = @userId THEN receiver_id ELSE sender_id END
                )
                SELECT 
                    u.id,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email_id,
                    lm.last_message,
                    lm.last_message_date,
                    lm.unread_count
                FROM ConversationUsers cu
                JOIN tbl_users u ON cu.contact_id = u.id
                JOIN LastMessages lm ON cu.contact_id = lm.contact_id
                WHERE u.status = 'active'
                ORDER BY lm.last_message_date DESC
            `);
        
        return result.recordset;
    }
    
    // Mark messages as read
    static async markAsRead(userId, senderId) {
        const pool = getPool();
        await pool.request()
            .input('receiver_id', sql.Int, userId)
            .input('sender_id', sql.Int, senderId)
            .query(`
                UPDATE chat_messages
                SET is_read = 1
                WHERE receiver_id = @receiver_id 
                AND sender_id = @sender_id
                AND is_read = 0
            `);
        
        return true;
    }
    
    // Get unread message count
    static async getUnreadCount(userId) {
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as unread_count
                FROM chat_messages
                WHERE receiver_id = @userId AND is_read = 0
            `);
        
        return result.recordset[0].unread_count;
    }
    
    // Get new messages since a specific date (for polling)
    static async getNewMessages(userId, contactId, since) {
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('contactId', sql.Int, contactId)
            .input('since', sql.DateTime, since)
            .query(`
                SELECT 
                    cm.*,
                    sender.username as sender_username,
                    sender.first_name as sender_first_name,
                    sender.last_name as sender_last_name
                FROM chat_messages cm
                JOIN tbl_users sender ON cm.sender_id = sender.id
                WHERE ((cm.sender_id = @userId AND cm.receiver_id = @contactId)
                   OR (cm.sender_id = @contactId AND cm.receiver_id = @userId))
                AND cm.created_date > @since
                ORDER BY cm.created_date ASC
            `);
        
        return result.recordset;
    }
}

module.exports = ChatMessage;
