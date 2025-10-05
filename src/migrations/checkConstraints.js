const { connectDB, getPool } = require('../config/database');

const checkConstraints = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Checking role constraint and existing data...\n');
        
        // Check constraint definition
        const constraintResult = await pool.request().query(`
            SELECT 
                cc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            WHERE ccu.TABLE_NAME = 'tbl_users' 
                AND ccu.COLUMN_NAME = 'role'
        `);
        
        if (constraintResult.recordset.length > 0) {
            console.log('Role constraint found:');
            console.log(constraintResult.recordset[0].CHECK_CLAUSE);
            console.log('\n');
        }
        
        // Check existing roles in the database
        const rolesResult = await pool.request().query(`
            SELECT DISTINCT role, COUNT(*) as count
            FROM tbl_users
            WHERE role IS NOT NULL
            GROUP BY role
        `);
        
        console.log('Existing roles in database:');
        if (rolesResult.recordset.length > 0) {
            rolesResult.recordset.forEach(r => {
                console.log(`  - ${r.role}: ${r.count} users`);
            });
        } else {
            console.log('  No users with roles found');
        }
        
        // Check column definition
        const columnResult = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'tbl_users' 
                AND COLUMN_NAME = 'role'
        `);
        
        console.log('\nRole column definition:');
        console.log(columnResult.recordset[0]);
        
        // Try to find what values are valid
        console.log('\nTrying to determine valid role values...');
        
        // Common patterns to check
        const testRoles = [
            'Admin', 'admin', 'ADMIN',
            'Employee', 'employee', 'EMPLOYEE', 
            'User', 'user', 'USER',
            'Manager', 'manager', 'MANAGER',
            '1', '2', '3', '4', '5'  // Sometimes roles are numeric
        ];
        
        console.log('\nSuggested fix based on constraint:');
        const checkClause = constraintResult.recordset[0]?.CHECK_CLAUSE || '';
        
        if (checkClause.includes('IN')) {
            // Extract values from IN clause
            const matches = checkClause.match(/IN\s*\((.*?)\)/i);
            if (matches) {
                console.log('Valid role values from constraint:', matches[1]);
            }
        } else if (checkClause) {
            console.log('Constraint clause:', checkClause);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkConstraints();
