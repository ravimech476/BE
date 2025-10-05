const { getPool, sql } = require('../config/database');

const createLeadersTable = async () => {
    const pool = getPool();
    
    try {
        // Check if leaders table exists
        const tableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'leaders'
        `);
        
        if (tableExists.recordset.length === 0) {
            console.log('Creating leaders table...');
            await pool.request().query(`
                CREATE TABLE leaders (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    name NVARCHAR(200) NOT NULL,
                    title NVARCHAR(200) NOT NULL,
                    description NVARCHAR(MAX),
                    image NVARCHAR(500),
                    icon NVARCHAR(100),
                    display_order INT DEFAULT 0,
                    status NVARCHAR(20) DEFAULT 'active',
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    created_by INT,
                    FOREIGN KEY (created_by) REFERENCES tbl_users(id)
                )
            `);
            console.log('✅ leaders table created successfully');
            
            // Create index for better performance
            await pool.request().query(`
                CREATE INDEX idx_leaders_status ON leaders(status)
            `);
            console.log('✅ Index created on leaders table');
            
        } else {
            console.log('✅ leaders table already exists');
        }
        
    } catch (error) {
        console.error('❌ Error creating leaders table:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    const { connectDB } = require('../config/database');
    
    connectDB()
        .then(createLeadersTable)
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = createLeadersTable;
