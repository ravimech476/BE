const { getPool } = require('./src/config/database');
const { connectDB } = require('./src/config/database');

const checkUsers = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('='.repeat(60));
        console.log('👥 CHECKING USERS TABLE');
        console.log('='.repeat(60));
        
        // Count users
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM tbl_users WHERE status = 'active'
        `);
        
        const total = countResult.recordset[0].total;
        console.log(`📊 Total Active Users: ${total}`);
        console.log('');
        
        if (total === 0) {
            console.log('❌ No active users found in database');
            console.log('   You need to create users first!');
            process.exit(1);
        }
        
        // Get all active users
        const usersResult = await pool.request().query(`
            SELECT id, username, email_id, first_name, last_name, role
            FROM tbl_users 
            WHERE status = 'active'
            ORDER BY first_name, last_name
        `);
        
        console.log('✅ Active Users List:');
        console.log('');
        
        usersResult.recordset.forEach((user, index) => {
            const fullName = `${user.first_name} ${user.last_name}`;
            const displayName = `${fullName} (${user.email_id})`;
            console.log(`${index + 1}. ${displayName}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Role: ${user.role}`);
            console.log('');
        });
        
        console.log('='.repeat(60));
        console.log('✅ Users are available for dropdown!');
        console.log('');
        console.log('🔗 Test the API:');
        console.log('   GET http://localhost:5000/api/users');
        console.log('   (Requires admin authentication)');
        console.log('='.repeat(60));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkUsers();
