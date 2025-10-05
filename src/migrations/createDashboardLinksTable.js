const { getPool, sql } = require('../config/database');

const createDashboardLinksTable = async () => {
    const pool = getPool();
    
    try {
        console.log('Creating dashboard_links table...');
        
        const tableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'dashboard_links'
        `);
        
        if (tableExists.recordset.length === 0) {
            await pool.request().query(`
                CREATE TABLE dashboard_links (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    title NVARCHAR(200) NOT NULL,
                    description NVARCHAR(MAX),
                    url NVARCHAR(500) NOT NULL,
                    display_order INT DEFAULT 0,
                    status NVARCHAR(20) DEFAULT 'active',
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('✅ dashboard_links table created');
            
            // Create index for display order
            await pool.request().query(`
                CREATE INDEX idx_dashboard_links_order ON dashboard_links(display_order, status)
            `);
            console.log('✅ Indexes created');
            
        } else {
            console.log('✅ dashboard_links table already exists');
        }
        
    } catch (err) {
        console.error('❌ Failed to create dashboard_links table:', err);
        throw err;
    }
};

const dropDashboardLinksTable = async () => {
    const pool = getPool();
    
    try {
        console.log('Dropping dashboard_links table...');
        await pool.request().query(`
            IF OBJECT_ID('dbo.dashboard_links', 'U') IS NOT NULL DROP TABLE dashboard_links
        `);
        console.log('✅ dashboard_links table dropped successfully');
    } catch (err) {
        console.error('❌ Failed to drop dashboard_links table:', err);
        throw err;
    }
};

// Run migration if called directly
if (require.main === module) {
    const { connectDB } = require('../config/database');
    
    const run = async () => {
        try {
            await connectDB();
            await createDashboardLinksTable();
            process.exit(0);
        } catch (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    };
    
    run();
}

module.exports = {
    createDashboardLinksTable,
    dropDashboardLinksTable
};
