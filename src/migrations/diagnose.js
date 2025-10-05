const { connectDB, getPool } = require('../config/database');

const runDiagnostics = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('===========================================');
        console.log('DATABASE DIAGNOSTICS');
        console.log('===========================================\n');
        
        // 1. Check Users Table Structure
        console.log('1. USERS TABLE STRUCTURE:');
        console.log('-------------------------------------------');
        const columnsResult = await pool.request().query(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'tbl_users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.table(columnsResult.recordset);
        
        // 2. Check Constraints
        console.log('\n2. CONSTRAINTS ON tbl_users:');
        console.log('-------------------------------------------');
        const constraintsResult = await pool.request().query(`
            SELECT 
                tc.CONSTRAINT_NAME,
                tc.CONSTRAINT_TYPE,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'tbl_users'
        `);
        
        constraintsResult.recordset.forEach(c => {
            console.log(`${c.CONSTRAINT_NAME}: ${c.CONSTRAINT_TYPE}`);
            if (c.CHECK_CLAUSE) {
                console.log(`  Check: ${c.CHECK_CLAUSE}`);
            }
        });
        
        // 3. Sample existing data
        console.log('\n3. SAMPLE EXISTING DATA:');
        console.log('-------------------------------------------');
        const sampleResult = await pool.request().query(`
            SELECT TOP 5
                id,
                username,
                email_id,
                role,
                status,
                created_date
            FROM tbl_users
            ORDER BY created_date DESC
        `);
        
        if (sampleResult.recordset.length > 0) {
            console.table(sampleResult.recordset);
        } else {
            console.log('No users found in database');
        }
        
        // 4. Distinct role values
        console.log('\n4. DISTINCT ROLE VALUES:');
        console.log('-------------------------------------------');
        const rolesResult = await pool.request().query(`
            SELECT DISTINCT role, COUNT(*) as user_count
            FROM tbl_users
            WHERE role IS NOT NULL
            GROUP BY role
        `);
        
        if (rolesResult.recordset.length > 0) {
            console.table(rolesResult.recordset);
        } else {
            console.log('No roles found');
        }
        
        // 5. Check if blog tables exist
        console.log('\n5. BLOG TABLES STATUS:');
        console.log('-------------------------------------------');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME IN ('blog_posts', 'blog_categories', 'blog_comments', 'blog_post_categories')
        `);
        
        const blogTables = ['blog_posts', 'blog_categories', 'blog_comments', 'blog_post_categories'];
        blogTables.forEach(table => {
            const exists = tablesResult.recordset.some(t => t.TABLE_NAME === table);
            console.log(`${table}: ${exists ? '✅ Exists' : '❌ Not Found'}`);
        });
        
        console.log('\n===========================================');
        console.log('DIAGNOSTICS COMPLETE');
        console.log('===========================================');
        
        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
};

runDiagnostics();
