const { connectDB, getPool, sql } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const createEmployeeUser = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        const pool = getPool();
        
        // Get employee details from command line or use defaults
        const args = process.argv.slice(2);
        
        let employeeData = {
            username: args[0] || 'employee1',
            password: args[1] || 'employee123',
            email_id: args[2] || 'employee1@company.com',
            first_name: args[3] || 'John',
            last_name: args[4] || 'Doe',
            phone: args[5] || '1234567890'
        };

        // Interactive mode if no arguments provided
        if (args.length === 0) {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const question = (query) => {
                return new Promise((resolve) => {
                    rl.question(query, resolve);
                });
            };

            console.log('\n📝 Creating New Employee User');
            console.log('Press Enter to use default values shown in [brackets]\n');

            employeeData.username = await question(`Username [${employeeData.username}]: `) || employeeData.username;
            employeeData.password = await question(`Password [${employeeData.password}]: `) || employeeData.password;
            employeeData.email_id = await question(`Email [${employeeData.email_id}]: `) || employeeData.email_id;
            employeeData.first_name = await question(`First Name [${employeeData.first_name}]: `) || employeeData.first_name;
            employeeData.last_name = await question(`Last Name [${employeeData.last_name}]: `) || employeeData.last_name;
            employeeData.phone = await question(`Phone [${employeeData.phone}]: `) || employeeData.phone;

            rl.close();
        }
        
        // Check if username already exists
        const existingUser = await pool.request()
            .input('username', sql.NVarChar, employeeData.username)
            .query('SELECT id FROM tbl_users WHERE username = @username');

        if (existingUser.recordset.length > 0) {
            console.log(`❌ Username '${employeeData.username}' already exists!`);
            console.log('Please try with a different username.');
            return;
        }

        // Check if email already exists
        const existingEmail = await pool.request()
            .input('email_id', sql.NVarChar, employeeData.email_id)
            .query('SELECT id FROM tbl_users WHERE email_id = @email_id');

        if (existingEmail.recordset.length > 0) {
            console.log(`❌ Email '${employeeData.email_id}' already exists!`);
            console.log('Please try with a different email.');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(employeeData.password, 10);

        // Create employee user
        const result = await pool.request()
            .input('username', sql.NVarChar, employeeData.username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email_id', sql.NVarChar, employeeData.email_id)
            .input('first_name', sql.NVarChar, employeeData.first_name)
            .input('last_name', sql.NVarChar, employeeData.last_name)
            .input('phone', sql.NVarChar, employeeData.phone)
            .input('role', sql.NVarChar, 'customer') // Using 'customer' role (allowed by constraint)
            .input('status', sql.NVarChar, 'active')
            .query(`
                INSERT INTO tbl_users (username, password, email_id, first_name, last_name, phone, role, status, created_date)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email_id, INSERTED.first_name, INSERTED.last_name, INSERTED.role
                VALUES (@username, @password, @email_id, @first_name, @last_name, @phone, @role, @status, GETDATE())
            `);

        const newEmployee = result.recordset[0];
        console.log('\n✅ Employee user created successfully!');
        console.log('=====================================');
        console.log(`ID: ${newEmployee.id}`);
        console.log(`Username: ${newEmployee.username}`);
        console.log(`Email: ${newEmployee.email_id}`);
        console.log(`Name: ${newEmployee.first_name} ${newEmployee.last_name}`);
        console.log(`Role: ${newEmployee.role}`);
        console.log('');
        console.log('🔑 Login Credentials:');
        console.log(`Username: ${employeeData.username}`);
        console.log(`Password: ${employeeData.password}`);
        console.log('');
        console.log('🎯 Employee Permissions:');
        console.log('✓ Can view all blog posts');
        console.log('✓ Can create new blog posts');
        console.log('✓ Can edit/delete own blog posts');
        console.log('✓ Can comment on any blog post');
        console.log('✓ Can edit/delete own comments');
        console.log('✓ Can view events on home page');
        console.log('✗ Cannot manage events (admin only)');
        console.log('✗ Cannot delete other employees\' content');

    } catch (error) {
        console.error('❌ Error creating employee user:', error);
    } finally {
        process.exit(0);
    }
};

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🧑‍💼 Employee User Creation Script

Usage:
  node createEmployeeUser.js                           # Interactive mode
  node createEmployeeUser.js [username] [password] [email] [firstName] [lastName] [phone]

Examples:
  node createEmployeeUser.js                           # Interactive mode with prompts
  node createEmployeeUser.js john doe123 john@company.com John Doe 1234567890
  node createEmployeeUser.js alice alice123 alice@company.com Alice Smith

Options:
  --help, -h    Show this help message

Default values (used in non-interactive mode if not provided):
  username:   employee1
  password:   employee123
  email:      employee1@company.com
  firstName:  John
  lastName:   Doe
  phone:      1234567890
`);
    process.exit(0);
}

createEmployeeUser();
