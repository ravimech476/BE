const { getPool, sql } = require('../config/database');

const createNewsTable = async () => {
    const pool = getPool();
    
    try {
        // Check if news table exists
        const tableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'news'
        `);
        
        if (tableExists.recordset.length === 0) {
            console.log('Creating news table...');
            await pool.request().query(`
                CREATE TABLE news (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    title NVARCHAR(500) NOT NULL,
                    content NVARCHAR(MAX) NOT NULL,
                    excerpt NVARCHAR(500),
                    image NVARCHAR(500),
                    category NVARCHAR(100),
                    display_order INT DEFAULT 0,
                    status NVARCHAR(20) DEFAULT 'active',
                    published_date DATETIME,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    created_by INT,
                    FOREIGN KEY (created_by) REFERENCES tbl_users(id)
                )
            `);
            console.log('✅ news table created successfully');
            
            // Create index for better performance
            await pool.request().query(`
                CREATE INDEX idx_news_status ON news(status);
                CREATE INDEX idx_news_published_date ON news(published_date DESC);
            `);
            console.log('✅ Indexes created on news table');
            
        } else {
            console.log('✅ news table already exists');
        }
        
    } catch (error) {
        console.error('❌ Error creating news table:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    const { connectDB } = require('../config/database');
    
    connectDB()
        .then(createNewsTable)
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = createNewsTable;
