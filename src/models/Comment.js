const { getPool, sql } = require('../config/database');

class Comment {
    static async create(commentData) {
        const pool = getPool();
        
        const result = await pool.request()
            .input('post_id', sql.Int, commentData.post_id)
            .input('user_id', sql.Int, commentData.user_id)
            .input('content', sql.NVarChar, commentData.content)
            .input('status', sql.NVarChar, commentData.status || 'approved')
            .query(`
                INSERT INTO blog_comments (post_id, user_id, content, status)
                OUTPUT INSERTED.*
                VALUES (@post_id, @user_id, @content, @status)
            `);
        
        return result.recordset[0];
    }
    
    static async update(commentId, updateData) {
        const pool = getPool();
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, commentId);
        
        if (updateData.content !== undefined) {
            updates.push('content = @content');
            request.input('content', sql.NVarChar, updateData.content);
        }
        
        if (updateData.status !== undefined) {
            updates.push('status = @status');
            request.input('status', sql.NVarChar, updateData.status);
        }
        
        const query = `
            UPDATE blog_comments 
            SET ${updates.join(', ')}
            OUTPUT INSERTED.*
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        return result.recordset[0];
    }
    
    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT c.*, 
                       u.username, u.first_name, u.last_name,
                       p.title as post_title, p.slug as post_slug
                FROM blog_comments c
                JOIN tbl_users u ON c.user_id = u.id
                JOIN blog_posts p ON c.post_id = p.id
                WHERE c.id = @id
            `);
        
        return result.recordset[0];
    }
    
    static async getByPostId(postId, status = 'approved') {
        const pool = getPool();
        const result = await pool.request()
            .input('post_id', sql.Int, postId)
            .input('status', sql.NVarChar, status)
            .query(`
                SELECT c.*, 
                       u.username, u.first_name, u.last_name
                FROM blog_comments c
                JOIN tbl_users u ON c.user_id = u.id
                WHERE c.post_id = @post_id AND c.status = @status
                ORDER BY c.created_date DESC
            `);
        
        return result.recordset;
    }
    
    static async getByUserId(userId) {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query(`
                SELECT c.*, 
                       p.title as post_title, p.slug as post_slug
                FROM blog_comments c
                JOIN blog_posts p ON c.post_id = p.id
                WHERE c.user_id = @user_id
                ORDER BY c.created_date DESC
            `);
        
        return result.recordset;
    }
    
    static async getAll(filters = {}) {
        const pool = getPool();
        let query = `
            SELECT c.*, 
                   u.username, u.first_name, u.last_name,
                   p.title as post_title, p.slug as post_slug
            FROM blog_comments c
            JOIN tbl_users u ON c.user_id = u.id
            JOIN blog_posts p ON c.post_id = p.id
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (filters.status) {
            query += ' AND c.status = @status';
            request.input('status', sql.NVarChar, filters.status);
        }
        
        query += ' ORDER BY c.created_date DESC';
        
        const result = await request.query(query);
        return result.recordset;
    }
    
    static async delete(commentId) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, commentId)
            .query('DELETE FROM blog_comments WHERE id = @id');
        
        return result.rowsAffected[0] > 0;
    }
    
    static async moderate(commentId, status) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, commentId)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE blog_comments 
                SET status = @status
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        
        return result.recordset[0];
    }
}

module.exports = Comment;
