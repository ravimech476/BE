const { getPool, sql } = require('../config/database');

class BlogPost {
    static async create(postData) {
        const pool = getPool();
        const slug = postData.slug || this.generateSlug(postData.title);
        
        const result = await pool.request()
            .input('title', sql.NVarChar, postData.title)
            .input('slug', sql.NVarChar, slug)
            .input('content', sql.NVarChar, postData.content)
            .input('excerpt', sql.NVarChar, postData.excerpt || this.generateExcerpt(postData.content))
            .input('featured_image', sql.NVarChar, postData.featured_image || null)
            .input('author_id', sql.Int, postData.author_id)
            .input('status', sql.NVarChar, postData.status || 'draft')
            .input('published_date', sql.DateTime, postData.status === 'published' ? new Date() : null)
            .query(`
                INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, author_id, status, published_date)
                OUTPUT INSERTED.*
                VALUES (@title, @slug, @content, @excerpt, @featured_image, @author_id, @status, @published_date)
            `);
        
        const post = result.recordset[0];
        
        // Add categories if provided
        if (postData.categories && postData.categories.length > 0) {
            await this.updateCategories(post.id, postData.categories);
        }
        
        return post;
    }
    
    static async update(postId, updateData) {
        const pool = getPool();
        const allowedFields = ['title', 'content', 'excerpt', 'featured_image', 'status'];
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, postId);
        request.input('modified_date', sql.DateTime, new Date());
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = @${field}`);
                request.input(field, sql.NVarChar, updateData[field]);
            }
        }
        
        if (updateData.status === 'published') {
            updates.push('published_date = @published_date');
            request.input('published_date', sql.DateTime, new Date());
        }
        
        if (updateData.title && !updateData.slug) {
            updates.push('slug = @slug');
            request.input('slug', sql.NVarChar, this.generateSlug(updateData.title));
        }
        
        const query = `
            UPDATE blog_posts 
            SET ${updates.join(', ')}, modified_date = @modified_date
            OUTPUT INSERTED.*
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        const post = result.recordset[0];
        
        // Update categories if provided
        if (updateData.categories) {
            await this.updateCategories(postId, updateData.categories);
        }
        
        return post;
    }
    
    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT p.*, 
                       u.username as author_username,
                       u.first_name as author_first_name,
                       u.last_name as author_last_name,
                       (SELECT STRING_AGG(c.name, ', ') 
                        FROM blog_categories c 
                        JOIN blog_post_categories pc ON c.id = pc.category_id 
                        WHERE pc.post_id = p.id) as categories
                FROM blog_posts p
                JOIN tbl_users u ON p.author_id = u.id
                WHERE p.id = @id
            `);
        
        if (result.recordset.length > 0) {
            // Increment view count
            await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = @id');
        }
        
        return result.recordset[0];
    }
    
    static async findBySlug(slug) {
        const pool = getPool();
        const result = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query(`
                SELECT p.*, 
                       u.username as author_username,
                       u.first_name as author_first_name,
                       u.last_name as author_last_name,
                       (SELECT STRING_AGG(c.name, ', ') 
                        FROM blog_categories c 
                        JOIN blog_post_categories pc ON c.id = pc.category_id 
                        WHERE pc.post_id = p.id) as categories
                FROM blog_posts p
                JOIN tbl_users u ON p.author_id = u.id
                WHERE p.slug = @slug
            `);
        
        if (result.recordset.length > 0) {
            // Increment view count
            await pool.request()
                .input('id', sql.Int, result.recordset[0].id)
                .query('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = @id');
        }
        
        return result.recordset[0];
    }
    
    static async getAll(filters = {}) {
        const pool = getPool();
        let query = `
            SELECT p.*, 
                   u.username as author_username,
                   u.first_name as author_first_name,
                   u.last_name as author_last_name,
                   (SELECT STRING_AGG(c.name, ', ') 
                    FROM blog_categories c 
                    JOIN blog_post_categories pc ON c.id = pc.category_id 
                    WHERE pc.post_id = p.id) as categories,
                   (SELECT COUNT(*) FROM blog_comments WHERE post_id = p.id AND status = 'approved') as comment_count
            FROM blog_posts p
            JOIN tbl_users u ON p.author_id = u.id
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (filters.status) {
            query += ' AND p.status = @status';
            request.input('status', sql.NVarChar, filters.status);
        }
        
        if (filters.author_id) {
            query += ' AND p.author_id = @author_id';
            request.input('author_id', sql.Int, filters.author_id);
        }
        
        if (filters.category) {
            query += ` AND EXISTS (
                SELECT 1 FROM blog_post_categories pc 
                JOIN blog_categories c ON pc.category_id = c.id 
                WHERE pc.post_id = p.id AND c.slug = @category
            )`;
            request.input('category', sql.NVarChar, filters.category);
        }
        
        if (filters.search) {
            query += ' AND (p.title LIKE @search OR p.content LIKE @search)';
            request.input('search', sql.NVarChar, `%${filters.search}%`);
        }
        
        // Pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get total count
        const countQuery = query.replace(
            /SELECT.*FROM/s, 
            'SELECT COUNT(*) as total FROM'
        ).replace(/ORDER BY.*$/, '');
        
        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total;
        
        // Add ordering and pagination
        query += ' ORDER BY p.published_date DESC, p.created_date DESC';
        query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        
        const result = await request.query(query);
        
        return {
            posts: result.recordset,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    static async delete(postId) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, postId)
            .query('DELETE FROM blog_posts WHERE id = @id');
        
        return result.rowsAffected[0] > 0;
    }
    
    static async updateCategories(postId, categoryIds) {
        const pool = getPool();
        
        // First, delete existing categories
        await pool.request()
            .input('post_id', sql.Int, postId)
            .query('DELETE FROM blog_post_categories WHERE post_id = @post_id');
        
        // Then add new ones
        for (const categoryId of categoryIds) {
            await pool.request()
                .input('post_id', sql.Int, postId)
                .input('category_id', sql.Int, categoryId)
                .query(`
                    INSERT INTO blog_post_categories (post_id, category_id)
                    VALUES (@post_id, @category_id)
                `);
        }
    }
    
    static async getPopular(limit = 5) {
        const pool = getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) p.id, p.title, p.slug, p.view_count, p.published_date,
                       u.username as author_username,
                       u.first_name as author_first_name,
                       u.last_name as author_last_name
                FROM blog_posts p
                JOIN tbl_users u ON p.author_id = u.id
                WHERE p.status = 'published'
                ORDER BY p.view_count DESC
            `);
        
        return result.recordset;
    }
    
    static async getRecent(limit = 5) {
        const pool = getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) p.id, p.title, p.slug, p.excerpt, p.published_date, p.featured_image,
                       u.username as author_username,
                       u.first_name as author_first_name,
                       u.last_name as author_last_name
                FROM blog_posts p
                JOIN tbl_users u ON p.author_id = u.id
                WHERE p.status = 'published'
                ORDER BY p.published_date DESC
            `);
        
        return result.recordset;
    }
    
    static generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    static generateExcerpt(content, maxLength = 200) {
        const plainText = content.replace(/<[^>]*>/g, '');
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength).trim() + '...';
    }
}

module.exports = BlogPost;
