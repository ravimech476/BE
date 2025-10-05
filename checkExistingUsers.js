const { connectDB, getPool, sql } = require('./src/config/database');

const checkExistingUsers = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('👥 Checking existing users in database...\n');

        // Get all users and their roles
        const users = await pool.request()
            .query('SELECT id, username, role, status, created_date FROM tbl_users ORDER BY created_date');

        if (users.recordset.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log('📋 Existing users:');
            console.log('='.repeat(60));
            users.recordset.forEach(user => {
                console.log(`ID: ${user.id} | Username: ${user.username} | Role: "${user.role}" | Status: ${user.status}`);
            });
        }

        // Get distinct roles
        const roles = await pool.request()
            .query('SELECT DISTINCT role FROM tbl_users WHERE role IS NOT NULL');

        console.log('\n🎭 Roles currently in use:');
        if (roles.recordset.length === 0) {
            console.log('No roles found.');
        } else {
            roles.recordset.forEach(role => {
                console.log(`- "${role.role}"`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        process.exit(0);
    }
};

checkExistingUsers();
