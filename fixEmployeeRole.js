const { connectDB, getPool, sql } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const fixEmployeeCreation = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('🔧 Attempting to create employee with different role values...\n');

        const testData = {
            username: 'testemployee',
            password: 'test123',
            email_id: 'test@company.com',
            first_name: 'Test',
            last_name: 'Employee',
            phone: '1234567890'
        };

        const hashedPassword = await bcrypt.hash(testData.password, 10);

        // Try different role values that might be accepted
        const rolesToTry = ['employee', 'Employee', 'user', 'User', '2', 'staff', 'member'];

        for (const role of rolesToTry) {
            try {
                console.log(`Trying role: "${role}"`);
                
                const result = await pool.request()
                    .input('username', sql.NVarChar, `${testData.username}_${role}`)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('email_id', sql.NVarChar, `${role}@test.com`)
                    .input('first_name', sql.NVarChar, testData.first_name)
                    .input('last_name', sql.NVarChar, testData.last_name)
                    .input('phone', sql.NVarChar, testData.phone)
                    .input('role', sql.NVarChar, role)
                    .input('status', sql.NVarChar, 'active')
                    .query(`
                        INSERT INTO tbl_users (username, password, email_id, first_name, last_name, phone, role, status, created_date)
                        OUTPUT INSERTED.id, INSERTED.username, INSERTED.role
                        VALUES (@username, @password, @email_id, @first_name, @last_name, @phone, @role, @status, GETDATE())
                    `);

                const user = result.recordset[0];
                console.log(`✅ SUCCESS! Role "${role}" worked!`);
                console.log(`Created user: ${user.username} with role: ${user.role}\n`);
                
                // Clean up test user
                await pool.request()
                    .input('id', sql.Int, user.id)
                    .query('DELETE FROM tbl_users WHERE id = @id');
                
                console.log(`🔧 Solution: Use role "${role}" in createEmployeeUser.js`);
                break;

            } catch (error) {
                console.log(`❌ Role "${role}" failed: ${error.message.split('.')[0]}`);
            }
        }

    } catch (error) {
        console.error('❌ Error in fix attempt:', error);
    } finally {
        process.exit(0);
    }
};

fixEmployeeCreation();
