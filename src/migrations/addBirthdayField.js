const { getPool, sql } = require('../config/database');

const addBirthdayField = async () => {
    const pool = getPool();
    
    try {
        console.log('Checking if date_of_birth column exists...');
        
        // Check if the column already exists
        const columnCheck = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'tbl_users' 
            AND COLUMN_NAME = 'date_of_birth'
        `);
        
        if (columnCheck.recordset.length === 0) {
            console.log('Adding date_of_birth column to tbl_users...');
            await pool.request().query(`
                ALTER TABLE tbl_users
                ADD date_of_birth DATE NULL
            `);
            console.log('✅ date_of_birth column added successfully');
        } else {
            console.log('✅ date_of_birth column already exists');
        }
        
    } catch (err) {
        console.error('❌ Failed to add date_of_birth column:', err);
        throw err;
    }
};

const removeBirthdayField = async () => {
    const pool = getPool();
    
    try {
        console.log('Removing date_of_birth column from tbl_users...');
        await pool.request().query(`
            ALTER TABLE tbl_users
            DROP COLUMN date_of_birth
        `);
        console.log('✅ date_of_birth column removed successfully');
    } catch (err) {
        console.error('❌ Failed to remove date_of_birth column:', err);
        throw err;
    }
};

// Run migration if called directly
if (require.main === module) {
    const { connectDB } = require('../config/database');
    
    const run = async () => {
        try {
            await connectDB();
            await addBirthdayField();
            process.exit(0);
        } catch (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    };
    
    run();
}

module.exports = {
    addBirthdayField,
    removeBirthdayField
};
