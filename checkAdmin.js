const { connectDB, getPool, sql } = require('./src/config/database');

const checkAdminUser = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('👑 Checking Admin User Details...\n');

        // Check admin user
        const adminUsers = await pool.request()
            .query(`
                SELECT id, username, role, first_name, last_name, status, created_date
                FROM tbl_users 
                WHERE username = 'admin' OR username = 'superadmin' OR role = 1
                ORDER BY created_date DESC
            `);

        if (adminUsers.recordset.length === 0) {
            console.log('❌ No admin users found!');
        } else {
            console.log('📋 Admin Users Found:');
            adminUsers.recordset.forEach(user => {
                console.log(`ID: ${user.id} | Username: ${user.username} | Role: ${user.role} | Name: ${user.first_name} ${user.last_name}`);
            });
        }

        // Show all users
        console.log('\\n👥 All Users in Database:');
        const allUsers = await pool.request()
            .query('SELECT id, username, role, first_name, last_name, status FROM tbl_users ORDER BY id');

        allUsers.recordset.forEach(user => {
            console.log(`ID: ${user.id} | Username: ${user.username} | Role: ${user.role} | Name: ${user.first_name} ${user.last_name} | Status: ${user.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
};

checkAdminUser();
