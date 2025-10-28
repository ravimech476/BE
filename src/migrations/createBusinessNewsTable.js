const { getPool, sql, connectDB } = require('../config/database');

const createBusinessNewsTable = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Creating business_news table...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[business_news]') AND type in (N'U'))
            BEGIN
                CREATE TABLE business_news (
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
                    CONSTRAINT FK_business_news_created_by FOREIGN KEY (created_by) REFERENCES tbl_users(id)
                )
            END
        `);
        
        console.log('✅ business_news table created successfully');
        
        // Create indexes for better performance
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_business_news_status' AND object_id = OBJECT_ID('business_news'))
            BEGIN
                CREATE INDEX idx_business_news_status ON business_news(status);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_business_news_published_date' AND object_id = OBJECT_ID('business_news'))
            BEGIN
                CREATE INDEX idx_business_news_published_date ON business_news(published_date DESC);
            END
        `);
        
        console.log('✅ Indexes created on business_news table');
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating business_news table:', error);
        process.exit(1);
    }
};

createBusinessNewsTable();
