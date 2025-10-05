const { connectDB, getPool, sql } = require('./src/config/database');

const checkConstraintDetails = async () => {
    try {
        await connectDB();
        const pool = getPool();

        console.log('🔍 Checking Role Constraint Details...\n');

        // Get the specific constraint that's failing
        const constraint = await pool.request()
            .query(`
                SELECT 
                    cc.CONSTRAINT_NAME,
                    cc.CHECK_CLAUSE,
                    ccu.COLUMN_NAME,
                    ccu.TABLE_NAME
                FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                    ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                WHERE cc.CONSTRAINT_NAME = 'CK__tbl_users__role__2645B050'
                   OR ccu.COLUMN_NAME = 'role' AND ccu.TABLE_NAME = 'tbl_users'
            `);

        console.log('📋 Role Constraint Details:');
        if (constraint.recordset.length > 0) {
            constraint.recordset.forEach(c => {
                console.log(`Table: ${c.TABLE_NAME}`);
                console.log(`Column: ${c.COLUMN_NAME}`);
                console.log(`Constraint: ${c.CONSTRAINT_NAME}`);
                console.log(`Check Clause: ${c.CHECK_CLAUSE}`);
            });
        } else {
            console.log('No constraints found with that name. Checking all role constraints...');
            
            const allConstraints = await pool.request()
                .query(`
                    SELECT 
                        cc.CONSTRAINT_NAME,
                        cc.CHECK_CLAUSE,
                        ccu.COLUMN_NAME,
                        ccu.TABLE_NAME
                    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                    JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                        ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                    WHERE ccu.COLUMN_NAME = 'role' AND ccu.TABLE_NAME = 'tbl_users'
                `);
                
            allConstraints.recordset.forEach(c => {
                console.log(`Table: ${c.TABLE_NAME}`);
                console.log(`Column: ${c.COLUMN_NAME}`);
                console.log(`Constraint: ${c.CONSTRAINT_NAME}`);
                console.log(`Check Clause: ${c.CHECK_CLAUSE}`);
            });
        }

        // Check what role values currently exist
        console.log('\\n👥 Current Role Values in Database:');
        const roles = await pool.request()
            .query('SELECT DISTINCT role FROM tbl_users ORDER BY role');
            
        roles.recordset.forEach(role => {
            console.log(`- Role: ${role.role} (Type: ${typeof role.role})`);
        });

        // Try to understand the constraint by testing values
        console.log('\\n🧪 Testing Role Values:');
        const testValues = [1, 2, 3, 4, 5, 6];
        
        for (const testRole of testValues) {
            try {
                await pool.request()
                    .input('role', sql.Int, testRole)
                    .query(`
                        SELECT CASE 
                            WHEN @role IN (SELECT DISTINCT role FROM tbl_users) 
                            THEN 'EXISTS' 
                            ELSE 'NEW' 
                        END as status
                    `);
                console.log(`Role ${testRole}: Would be allowed if constraint permits`);
            } catch (error) {
                console.log(`Role ${testRole}: Would fail constraint`);
            }
        }

    } catch (error) {
        console.error('❌ Error checking constraint:', error);
    } finally {
        process.exit(0);
    }
};

checkConstraintDetails();
