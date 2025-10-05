const { connectDB, getPool, sql } = require('../config/database');

const createEventsTable = async () => {
    try {
        await connectDB();
        const pool = getPool();

        // Check if table exists
        const tableExists = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'tbl_events'
            `);

        if (tableExists.recordset[0].count > 0) {
            console.log('✅ Events table already exists');
            return;
        }

        // Create events table
        await pool.request().query(`
            CREATE TABLE tbl_events (
                id int IDENTITY(1,1) PRIMARY KEY,
                event_name nvarchar(255) NOT NULL,
                event_date datetime NOT NULL,
                description nvarchar(max),
                created_by int NOT NULL,
                created_date datetime DEFAULT GETDATE(),
                modified_date datetime,
                status nvarchar(20) DEFAULT 'active',
                FOREIGN KEY (created_by) REFERENCES tbl_users(id)
            )
        `);

        console.log('✅ Events table created successfully');

    } catch (error) {
        console.error('❌ Error creating events table:', error);
    }
};

module.exports = { createEventsTable };

// Run if called directly
if (require.main === module) {
    createEventsTable().then(() => process.exit(0));
}
