const { connectDB, getPool, sql } = require('./src/config/database');

const checkUserTableConstraints = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('🔍 Checking tbl_users table constraints...\n');

        // Get table constraints
        const constraints = await pool.request()
            .query(`
                SELECT 
                    cc.CONSTRAINT_NAME,
                    cc.CHECK_CLAUSE,
                    ccu.COLUMN_NAME
                FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                    ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                WHERE ccu.TABLE_NAME = 'tbl_users'
            `);

        console.log('📋 Check Constraints:');
        constraints.recordset.forEach(constraint => {
            console.log(`\nConstraint: ${constraint.CONSTRAINT_NAME}`);
            console.log(`Column: ${constraint.COLUMN_NAME}`);
            console.log(`Check Clause: ${constraint.CHECK_CLAUSE}`);
        });

        // Get existing roles from users table
        const roles = await pool.request()
            .query('SELECT DISTINCT role FROM tbl_users');

        console.log('\n👥 Existing roles in database:');
        roles.recordset.forEach(role => {
            console.log(`- ${role.role}`);
        });

        // Get table structure
        const columns = await pool.request()
            .query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'tbl_users'
                AND COLUMN_NAME = 'role'
            `);

        console.log('\n📄 Role column details:');
        columns.recordset.forEach(col => {
            console.log(`Column: ${col.COLUMN_NAME}`);
            console.log(`Type: ${col.DATA_TYPE}`);
            console.log(`Nullable: ${col.IS_NULLABLE}`);
            console.log(`Default: ${col.COLUMN_DEFAULT}`);
        });

    } catch (error) {
        console.error('❌ Error checking constraints:', error);
    } finally {
        process.exit(0);
    }
};

checkUserTableConstraints();
