const { connectDB, getPool, sql } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        const pool = getPool();
        
        // Check if admin user already exists
        const existingAdmin = await pool.request()
            .input('username', sql.NVarChar, 'admin')
            .query('SELECT id FROM tbl_users WHERE username = @username');

        if (existingAdmin.recordset.length > 0) {
            console.log('❌ Admin user already exists!');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('superadmin123', 10);

        // Create admin user
        const result = await pool.request()
            .input('username', sql.NVarChar, 'superadmin')
            .input('password', sql.NVarChar, hashedPassword)
            .input('email_id', sql.NVarChar, 'superadmin@company.com')
            .input('first_name', sql.NVarChar, 'superadmin')
            .input('last_name', sql.NVarChar, 'User')
            .input('phone', sql.NVarChar, '1234567890')
            .input('role', sql.NVarChar, 'admin') // Using string 'admin' role (allowed by constraint)
            .input('status', sql.NVarChar, 'active')
            .query(`
                INSERT INTO tbl_users (username, password, email_id, first_name, last_name, phone, role, status, created_date)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email_id, INSERTED.first_name, INSERTED.last_name, INSERTED.role
                VALUES (@username, @password, @email_id, @first_name, @last_name, @phone, @role, @status, GETDATE())
            `);

        const adminUser = result.recordset[0];
        console.log('✅ Admin user created successfully!');
        console.log('Admin Details:');
        console.log(`ID: ${adminUser.id}`);
        console.log(`Username: ${adminUser.username}`);
        console.log(`Email: ${adminUser.email_id}`);
        console.log(`Name: ${adminUser.first_name} ${adminUser.last_name}`);
        console.log(`Role: ${adminUser.role}`);
        console.log('');
        console.log('Login Credentials:');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        process.exit(0);
    }
};

createAdminUser();
