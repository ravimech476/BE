const { connectDB, getPool, sql } = require('./src/config/database');

const showRoleMappings = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('🎭 Database Role Mappings');
        console.log('========================\n');

        // Check if there's a roles table
        const rolesTableExists = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'roles' OR TABLE_NAME = 'tbl_roles'
            `);

        if (rolesTableExists.recordset[0].count > 0) {
            console.log('📋 Roles Table Found:');
            const roles = await pool.request()
                .query('SELECT * FROM tbl_roles ORDER BY id');
            
            roles.recordset.forEach(role => {
                console.log(`ID: ${role.id} | Name: ${role.role_name} | Description: ${role.description || 'N/A'}`);
            });
        } else {
            console.log('No dedicated roles table found.');
        }

        // Check existing users and their roles
        console.log('\n👥 Existing Users and Their Roles:');
        const users = await pool.request()
            .query(`
                SELECT id, username, role, first_name, last_name, status 
                FROM tbl_users 
                ORDER BY role, id
            `);

        if (users.recordset.length === 0) {
            console.log('No users found.');
        } else {
            users.recordset.forEach(user => {
                console.log(`ID: ${user.id} | Role: ${user.role} | Username: ${user.username} | Name: ${user.first_name} ${user.last_name}`);
            });
        }

        // Suggest role mappings
        console.log('\n💡 Suggested Role Mappings:');
        console.log('1 = Admin (Full system access)');
        console.log('2 = Employee (Blog creation, commenting)');
        console.log('3 = Manager (Extended permissions)');
        console.log('4 = Guest (Read-only access)');
        console.log('5 = Customer (Customer portal access)');

    } catch (error) {
        console.error('❌ Error checking roles:', error);
    } finally {
        process.exit(0);
    }
};

showRoleMappings();
