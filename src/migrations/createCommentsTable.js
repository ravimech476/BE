const { connectDB, getPool, sql } = require('../config/database');

const createCommentsTable = async () => {
    try {
        await connectDB();
        const pool = getPool();

        // Check if table exists
        const tableExists = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'blog_comments'
            `);

        if (tableExists.recordset[0].count > 0) {
            console.log('✅ Comments table already exists');
            return;
        }

        // Create comments table
        await pool.request().query(`
            CREATE TABLE blog_comments (
                id int IDENTITY(1,1) PRIMARY KEY,
                post_id int NOT NULL,
                user_id int NOT NULL,
                content nvarchar(max) NOT NULL,
                status nvarchar(20) DEFAULT 'approved',
                created_date datetime DEFAULT GETDATE(),
                modified_date datetime,
                FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES tbl_users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Comments table created successfully');

    } catch (error) {
        console.error('❌ Error creating comments table:', error);
    }
};

module.exports = { createCommentsTable };

// Run if called directly
if (require.main === module) {
    createCommentsTable().then(() => process.exit(0));
}
