const { getPool, sql } = require('../config/database');

const createTables = async () => {
    const pool = getPool();
    
    try {
        // Check if tbl_users exists (assuming it already exists as per your query)
        const userTableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'tbl_users'
        `);
        
        if (userTableExists.recordset.length === 0) {
            console.log('Creating tbl_users table...');
            await pool.request().query(`
                CREATE TABLE tbl_users (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    username NVARCHAR(100) UNIQUE NOT NULL,
                    password NVARCHAR(255) NOT NULL,
                    email_id NVARCHAR(255) UNIQUE NOT NULL,
                    role NVARCHAR(50) DEFAULT 'employee',
                    status NVARCHAR(20) DEFAULT 'active',
                    last_login_datetime DATETIME,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    first_name NVARCHAR(100),
                    last_name NVARCHAR(100),
                    phone NVARCHAR(20),
                    role_id INT,
                    created_by INT,
                    customer_code NVARCHAR(50)
                )
            `);
            console.log('✅ tbl_users table created');
        } else {
            console.log('✅ tbl_users table already exists');
        }
        
        // Create blog_posts table
        const blogTableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'blog_posts'
        `);
        
        if (blogTableExists.recordset.length === 0) {
            console.log('Creating blog_posts table...');
            await pool.request().query(`
                CREATE TABLE blog_posts (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    title NVARCHAR(500) NOT NULL,
                    slug NVARCHAR(500) UNIQUE NOT NULL,
                    content NVARCHAR(MAX) NOT NULL,
                    excerpt NVARCHAR(500),
                    featured_image NVARCHAR(500),
                    author_id INT NOT NULL,
                    status NVARCHAR(20) DEFAULT 'draft',
                    view_count INT DEFAULT 0,
                    published_date DATETIME,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (author_id) REFERENCES tbl_users(id)
                )
            `);
            console.log('✅ blog_posts table created');
        } else {
            console.log('✅ blog_posts table already exists');
        }
        
        // Create blog_categories table
        const categoryTableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'blog_categories'
        `);
        
        if (categoryTableExists.recordset.length === 0) {
            console.log('Creating blog_categories table...');
            await pool.request().query(`
                CREATE TABLE blog_categories (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    name NVARCHAR(100) NOT NULL,
                    slug NVARCHAR(100) UNIQUE NOT NULL,
                    description NVARCHAR(500),
                    created_date DATETIME DEFAULT GETDATE()
                )
            `);
            console.log('✅ blog_categories table created');
        } else {
            console.log('✅ blog_categories table already exists');
        }
        
        // Create blog_post_categories junction table
        const postCategoryTableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'blog_post_categories'
        `);
        
        if (postCategoryTableExists.recordset.length === 0) {
            console.log('Creating blog_post_categories table...');
            await pool.request().query(`
                CREATE TABLE blog_post_categories (
                    post_id INT NOT NULL,
                    category_id INT NOT NULL,
                    PRIMARY KEY (post_id, category_id),
                    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ blog_post_categories table created');
        } else {
            console.log('✅ blog_post_categories table already exists');
        }
        
        // Create blog_comments table
        const commentTableExists = await pool.request().query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' 
            AND TABLE_NAME = 'blog_comments'
        `);
        
        if (commentTableExists.recordset.length === 0) {
            console.log('Creating blog_comments table...');
            await pool.request().query(`
                CREATE TABLE blog_comments (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    post_id INT NOT NULL,
                    user_id INT NOT NULL,
                    content NVARCHAR(MAX) NOT NULL,
                    status NVARCHAR(20) DEFAULT 'approved',
                    created_date DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES tbl_users(id)
                )
            `);
            console.log('✅ blog_comments table created');
        } else {
            console.log('✅ blog_comments table already exists');
        }
        
        // Create indexes for better performance
        console.log('Creating indexes...');
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_blog_posts_author ON blog_posts(author_id)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_blog_posts_status ON blog_posts(status)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        try {
            await pool.request().query(`
                CREATE INDEX idx_blog_posts_published ON blog_posts(published_date DESC)
            `);
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
        }
        
        console.log('✅ All indexes created');
        console.log('✅ Migration completed successfully');
        
    } catch (err) {
        console.error('❌ Migration failed:', err);
        throw err;
    }
};

const dropTables = async () => {
    const pool = getPool();
    
    try {
        console.log('Dropping tables...');
        
        // Drop tables in reverse order due to foreign key constraints
        await pool.request().query(`
            IF OBJECT_ID('dbo.blog_comments', 'U') IS NOT NULL DROP TABLE blog_comments
        `);
        
        await pool.request().query(`
            IF OBJECT_ID('dbo.blog_post_categories', 'U') IS NOT NULL DROP TABLE blog_post_categories
        `);
        
        await pool.request().query(`
            IF OBJECT_ID('dbo.blog_posts', 'U') IS NOT NULL DROP TABLE blog_posts
        `);
        
        await pool.request().query(`
            IF OBJECT_ID('dbo.blog_categories', 'U') IS NOT NULL DROP TABLE blog_categories
        `);
        
        console.log('✅ Tables dropped successfully');
    } catch (err) {
        console.error('❌ Drop tables failed:', err);
        throw err;
    }
};

module.exports = {
    createTables,
    dropTables
};
