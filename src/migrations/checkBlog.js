const { connectDB, getPool } = require('../config/database');

const checkBlogSystem = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('===========================================');
        console.log('BLOG SYSTEM DIAGNOSTIC');
        console.log('===========================================\n');
        
        // 1. Check if blog tables exist
        console.log('1. CHECKING BLOG TABLES:');
        console.log('-------------------------------------------');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME IN ('blog_posts', 'blog_categories', 'blog_comments', 'blog_post_categories')
            ORDER BY TABLE_NAME
        `);
        
        if (tablesResult.recordset.length === 0) {
            console.log('❌ No blog tables found! Run migrations first:');
            console.log('   npm run migrate:up');
            process.exit(1);
        }
        
        console.log('✅ Blog tables found:');
        tablesResult.recordset.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
        
        // 2. Check blog posts
        console.log('\n2. BLOG POSTS STATUS:');
        console.log('-------------------------------------------');
        const postsResult = await pool.request().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
            FROM blog_posts
        `);
        
        console.log(`Total Posts: ${postsResult.recordset[0].total}`);
        console.log(`Published: ${postsResult.recordset[0].published}`);
        console.log(`Drafts: ${postsResult.recordset[0].draft}`);
        
        // 3. List all posts with details
        console.log('\n3. ALL POSTS:');
        console.log('-------------------------------------------');
        const allPostsResult = await pool.request().query(`
            SELECT 
                p.id,
                p.title,
                p.status,
                p.author_id,
                u.username as author,
                p.created_date,
                p.published_date
            FROM blog_posts p
            JOIN tbl_users u ON p.author_id = u.id
            ORDER BY p.created_date DESC
        `);
        
        if (allPostsResult.recordset.length > 0) {
            console.table(allPostsResult.recordset);
        } else {
            console.log('No posts found');
        }
        
        // 4. Check users
        console.log('\n4. USERS WITH POSTS:');
        console.log('-------------------------------------------');
        const usersResult = await pool.request().query(`
            SELECT 
                u.id,
                u.username,
                u.first_name + ' ' + u.last_name as full_name,
                u.role,
                COUNT(p.id) as post_count
            FROM tbl_users u
            LEFT JOIN blog_posts p ON u.id = p.author_id
            GROUP BY u.id, u.username, u.first_name, u.last_name, u.role
            HAVING COUNT(p.id) > 0
            ORDER BY post_count DESC
        `);
        
        if (usersResult.recordset.length > 0) {
            console.table(usersResult.recordset);
        } else {
            console.log('No users have created posts yet');
        }
        
        // 5. Check categories
        console.log('\n5. CATEGORIES:');
        console.log('-------------------------------------------');
        const categoriesResult = await pool.request().query(`
            SELECT 
                c.id,
                c.name,
                c.slug,
                COUNT(pc.post_id) as post_count
            FROM blog_categories c
            LEFT JOIN blog_post_categories pc ON c.id = pc.category_id
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.name
        `);
        
        if (categoriesResult.recordset.length > 0) {
            console.table(categoriesResult.recordset);
        } else {
            console.log('No categories found');
        }
        
        console.log('\n===========================================');
        console.log('DIAGNOSTIC COMPLETE');
        console.log('===========================================');
        
        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
};

checkBlogSystem();
