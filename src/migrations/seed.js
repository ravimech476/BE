const { connectDB, getPool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Seeding database...');
        
        // First, let's check what role values are valid
        console.log('Checking existing roles in database...');
        const existingRolesResult = await pool.request().query(`
            SELECT DISTINCT role FROM tbl_users WHERE role IS NOT NULL
        `);
        
        let adminRole = 'admin';
        let employeeRole = 'employee';
        
        if (existingRolesResult.recordset.length > 0) {
            const existingRoles = existingRolesResult.recordset.map(r => r.role);
            console.log('Found existing roles:', existingRoles);
            
            // Try to determine the correct role format
            if (existingRoles.some(r => r && r.toLowerCase() === 'admin')) {
                adminRole = existingRoles.find(r => r && r.toLowerCase() === 'admin');
            } else if (existingRoles.some(r => r && (r === '1' || r === 1))) {
                // Numeric roles - 1 might be admin
                adminRole = '1';
                employeeRole = '2';
            } else if (existingRoles.some(r => r && r.toUpperCase() === 'ADMIN')) {
                adminRole = 'ADMIN';
                employeeRole = 'EMPLOYEE';
            } else if (existingRoles.some(r => r && r === 'Admin')) {
                adminRole = 'Admin';
                employeeRole = 'Employee';
            }
        } else {
            // No existing roles, try to detect from constraint
            console.log('No existing roles found, checking constraints...');
            
            try {
                const constraintResult = await pool.request().query(`
                    SELECT CHECK_CLAUSE
                    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                    JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                        ON cc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                    WHERE ccu.TABLE_NAME = 'tbl_users' 
                        AND ccu.COLUMN_NAME = 'role'
                `);
                
                if (constraintResult.recordset.length > 0) {
                    const checkClause = constraintResult.recordset[0].CHECK_CLAUSE;
                    console.log('Constraint found:', checkClause);
                    
                    // Parse the constraint to find valid values
                    if (checkClause.includes("'Admin'")) {
                        adminRole = 'Admin';
                        employeeRole = 'Employee';
                    } else if (checkClause.includes("'ADMIN'")) {
                        adminRole = 'ADMIN';
                        employeeRole = 'EMPLOYEE';
                    } else if (checkClause.includes("(1)") || checkClause.includes("'1'")) {
                        adminRole = '1';
                        employeeRole = '2';
                    }
                    
                    // Extract values from IN clause if present
                    const inMatch = checkClause.match(/IN\s*\((.*?)\)/i);
                    if (inMatch) {
                        const values = inMatch[1].split(',').map(v => v.trim().replace(/'/g, ''));
                        console.log('Valid role values:', values);
                        
                        // Try to identify admin and employee roles
                        for (const val of values) {
                            if (val.toLowerCase().includes('admin')) {
                                adminRole = val;
                            } else if (val.toLowerCase().includes('employee') || val.toLowerCase().includes('user')) {
                                employeeRole = val;
                            }
                        }
                        
                        // If still not found, use first two values
                        if (values.length >= 2 && (adminRole === 'admin' || employeeRole === 'employee')) {
                            adminRole = values[0];
                            employeeRole = values[1];
                        }
                    }
                }
            } catch (constraintErr) {
                console.log('Could not check constraints:', constraintErr.message);
            }
        }
        
        console.log(`Using roles: Admin='${adminRole}', Employee='${employeeRole}'`);
        
        // Check if admin user exists
        const adminExists = await pool.request()
            .input('username', 'admin')
            .query('SELECT id FROM tbl_users WHERE username = @username');
        
        if (adminExists.recordset.length === 0) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            
            try {
                const adminResult = await pool.request()
                    .input('username', 'admin')
                    .input('password', hashedPassword)
                    .input('email_id', 'admin@company.com')
                    .input('first_name', 'Admin')
                    .input('last_name', 'User')
                    .input('role', adminRole)
                    .input('status', 'active')
                    .query(`
                        INSERT INTO tbl_users (username, password, email_id, first_name, last_name, role, status)
                        OUTPUT INSERTED.id
                        VALUES (@username, @password, @email_id, @first_name, @last_name, @role, @status)
                    `);
                
                console.log('✅ Admin user created (username: admin, password: Admin@123)');
                const adminId = adminResult.recordset[0].id;
                
                // Create sample blog post
                await createSampleBlogPost(pool, adminId);
                
            } catch (adminErr) {
                console.error('Failed to create admin user:', adminErr.message);
                console.log('Trying without role field...');
                
                // Try without role field (it might have a default)
                const adminResult = await pool.request()
                    .input('username', 'admin')
                    .input('password', hashedPassword)
                    .input('email_id', 'admin@company.com')
                    .input('first_name', 'Admin')
                    .input('last_name', 'User')
                    .input('status', 'active')
                    .query(`
                        INSERT INTO tbl_users (username, password, email_id, first_name, last_name, status)
                        OUTPUT INSERTED.id
                        VALUES (@username, @password, @email_id, @first_name, @last_name, @status)
                    `);
                
                console.log('✅ Admin user created without explicit role');
                const adminId = adminResult.recordset[0].id;
                
                // Update role if needed
                try {
                    await pool.request()
                        .input('id', adminId)
                        .input('role', adminRole)
                        .query('UPDATE tbl_users SET role = @role WHERE id = @id');
                } catch (updateErr) {
                    console.log('Could not update role:', updateErr.message);
                }
                
                await createSampleBlogPost(pool, adminId);
            }
        } else {
            console.log('ℹ️ Admin user already exists');
            await createSampleBlogPost(pool, adminExists.recordset[0].id);
        }
        
        // Create sample employees
        const employees = [
            { username: 'john.doe', email: 'john.doe@company.com', firstName: 'John', lastName: 'Doe' },
            { username: 'jane.smith', email: 'jane.smith@company.com', firstName: 'Jane', lastName: 'Smith' }
        ];
        
        for (const emp of employees) {
            const userExists = await pool.request()
                .input('username', emp.username)
                .query('SELECT id FROM tbl_users WHERE username = @username');
            
            if (userExists.recordset.length === 0) {
                const hashedPassword = await bcrypt.hash('Employee@123', 10);
                
                try {
                    await pool.request()
                        .input('username', emp.username)
                        .input('password', hashedPassword)
                        .input('email_id', emp.email)
                        .input('first_name', emp.firstName)
                        .input('last_name', emp.lastName)
                        .input('role', employeeRole)
                        .input('status', 'active')
                        .query(`
                            INSERT INTO tbl_users (username, password, email_id, first_name, last_name, role, status)
                            VALUES (@username, @password, @email_id, @first_name, @last_name, @role, @status)
                        `);
                } catch (empErr) {
                    // Try without role
                    await pool.request()
                        .input('username', emp.username)
                        .input('password', hashedPassword)
                        .input('email_id', emp.email)
                        .input('first_name', emp.firstName)
                        .input('last_name', emp.lastName)
                        .input('status', 'active')
                        .query(`
                            INSERT INTO tbl_users (username, password, email_id, first_name, last_name, status)
                            VALUES (@username, @password, @email_id, @first_name, @last_name, @status)
                        `);
                }
            }
        }
        
        console.log('✅ Sample employees created (password: Employee@123)');
        
        // Create categories
        await createCategories(pool);
        
        console.log('\n📝 Test Credentials:');
        console.log('   Admin: username: admin, password: Admin@123');
        console.log('   Employee: username: john.doe, password: Employee@123');
        console.log('\n✅ Seeding completed successfully');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

async function createCategories(pool) {
    const categories = [
        { name: 'Technology', slug: 'technology', description: 'Technology and software development' },
        { name: 'Company News', slug: 'company-news', description: 'Latest company updates and announcements' },
        { name: 'Industry Insights', slug: 'industry-insights', description: 'Industry trends and analysis' },
        { name: 'Tips & Tutorials', slug: 'tips-tutorials', description: 'Helpful tips and tutorials' }
    ];
    
    for (const cat of categories) {
        try {
            await pool.request()
                .input('name', cat.name)
                .input('slug', cat.slug)
                .input('description', cat.description)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM blog_categories WHERE slug = @slug)
                    INSERT INTO blog_categories (name, slug, description)
                    VALUES (@name, @slug, @description)
                `);
        } catch (err) {
            console.log(`Category ${cat.name} might already exist`);
        }
    }
    console.log('✅ Categories created');
}

async function createSampleBlogPost(pool, adminId) {
    try {
        const postExists = await pool.request()
            .input('slug', 'welcome-to-our-company-blog')
            .query('SELECT id FROM blog_posts WHERE slug = @slug');
        
        if (postExists.recordset.length === 0) {
            await pool.request()
                .input('title', 'Welcome to Our Company Blog')
                .input('slug', 'welcome-to-our-company-blog')
                .input('content', `
                    <h2>Welcome to Our New Blog Platform!</h2>
                    <p>We're excited to launch our new company blog where we'll share updates, insights, and knowledge with our team.</p>
                    <h3>What to Expect</h3>
                    <ul>
                        <li>Company news and updates</li>
                        <li>Technical tutorials and best practices</li>
                        <li>Industry insights and trends</li>
                        <li>Team spotlights and achievements</li>
                    </ul>
                    <p>Stay tuned for more exciting content!</p>
                `)
                .input('excerpt', 'Welcome to our new company blog platform where we share updates, insights, and knowledge.')
                .input('author_id', adminId)
                .input('status', 'published')
                .input('published_date', new Date())
                .query(`
                    INSERT INTO blog_posts (title, slug, content, excerpt, author_id, status, published_date)
                    VALUES (@title, @slug, @content, @excerpt, @author_id, @status, @published_date)
                `);
            
            console.log('✅ Sample blog post created');
        }
    } catch (err) {
        console.log('Sample blog post might already exist');
    }
}

seedData();
