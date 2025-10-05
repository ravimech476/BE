const { getPool, sql } = require('../config/database');

class News {
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT n.*, u.username as created_by_username
                FROM news n
                LEFT JOIN tbl_users u ON n.created_by = u.id
                WHERE n.status = 'active'
                ORDER BY n.published_date DESC, n.display_order ASC, n.created_date DESC
            `);
        return result.recordset;
    }

    static async findAllForAdmin() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT n.*, u.username as created_by_username
                FROM news n
                LEFT JOIN tbl_users u ON n.created_by = u.id
                ORDER BY n.published_date DESC, n.display_order ASC, n.created_date DESC
            `);
        return result.recordset;
    }

    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT n.*, u.username as created_by_username
                FROM news n
                LEFT JOIN tbl_users u ON n.created_by = u.id
                WHERE n.id = @id
            `);
        return result.recordset[0];
    }

    static async create(newsData) {
        const pool = getPool();
        const result = await pool.request()
            .input('title', sql.NVarChar, newsData.title)
            .input('content', sql.NVarChar, newsData.content)
            .input('excerpt', sql.NVarChar, newsData.excerpt || null)
            .input('image', sql.NVarChar, newsData.image || null)
            .input('category', sql.NVarChar, newsData.category || null)
            .input('display_order', sql.Int, newsData.display_order || 0)
            .input('status', sql.NVarChar, newsData.status || 'active')
            .input('published_date', sql.DateTime, newsData.published_date || new Date())
            .input('created_by', sql.Int, newsData.created_by)
            .query(`
                INSERT INTO news (title, content, excerpt, image, category, display_order, status, published_date, created_by)
                OUTPUT INSERTED.*
                VALUES (@title, @content, @excerpt, @image, @category, @display_order, @status, @published_date, @created_by)
            `);
        return result.recordset[0];
    }

    static async update(id, newsData) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, newsData.title)
            .input('content', sql.NVarChar, newsData.content)
            .input('excerpt', sql.NVarChar, newsData.excerpt || null)
            .input('image', sql.NVarChar, newsData.image || null)
            .input('category', sql.NVarChar, newsData.category || null)
            .input('display_order', sql.Int, newsData.display_order || 0)
            .input('status', sql.NVarChar, newsData.status || 'active')
            .input('published_date', sql.DateTime, newsData.published_date || new Date())
            .query(`
                UPDATE news 
                SET title = @title,
                    content = @content,
                    excerpt = @excerpt,
                    image = @image,
                    category = @category,
                    display_order = @display_order,
                    status = @status,
                    published_date = @published_date,
                    modified_date = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    static async delete(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM news 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }
}

module.exports = News;
