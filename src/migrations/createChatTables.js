const { getPool, sql } = require('../config/database');

const createChatTables = async () => {
    const pool = getPool();
    
    try {
        console.log('Creating chat tables...');
        
        // Create chat_messages table
        const chatMessagesExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'chat_messages'
        `);
        
        if (chatMessagesExists.recordset.length === 0) {
            console.log('Creating chat_messages table...');
            await pool.request().query(`
                CREATE TABLE chat_messages (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    message_text NVARCHAR(MAX) NOT NULL,
                    is_read BIT DEFAULT 0,
                    created_date DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (sender_id) REFERENCES tbl_users(id),
                    FOREIGN KEY (receiver_id) REFERENCES tbl_users(id)
                )
            `);
            console.log('✅ chat_messages table created');
        } else {
            console.log('✅ chat_messages table already exists');
        }
        
        // Create indexes for better performance
        console.log('Creating chat indexes...');
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_chat_sender ON chat_messages(sender_id)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_chat_created ON chat_messages(created_date DESC)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        console.log('✅ All chat indexes created');
        console.log('✅ Chat tables migration completed successfully');
        
    } catch (err) {
        console.error('❌ Chat tables migration failed:', err);
        throw err;
    }
};

const dropChatTables = async () => {
    const pool = getPool();
    
    try {
        console.log('Dropping chat tables...');
        
        await pool.request().query(`
            IF OBJECT_ID('dbo.chat_messages', 'U') IS NOT NULL DROP TABLE chat_messages
        `);
        
        console.log('✅ Chat tables dropped successfully');
    } catch (err) {
        console.error('❌ Drop chat tables failed:', err);
        throw err;
    }
};

// Run migration if called directly
if (require.main === module) {
    const { connectDB } = require('../config/database');
    
    const run = async () => {
        try {
            await connectDB();
            await createChatTables();
            process.exit(0);
        } catch (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    };
    
    run();
}

module.exports = {
    createChatTables,
    dropChatTables
};
