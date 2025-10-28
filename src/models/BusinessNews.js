const { getPool, sql } = require('../config/database');

class BusinessNews {
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT bn.*, u.username as created_by_username
                FROM business_news bn
                LEFT JOIN tbl_users u ON bn.created_by = u.id
                WHERE bn.status = 'active'
                ORDER BY bn.published_date DESC, bn.display_order ASC, bn.created_date DESC
            `);
        return result.recordset;
    }

    static async findAllForAdmin() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT bn.*, u.username as created_by_username
                FROM business_news bn
                LEFT JOIN tbl_users u ON bn.created_by = u.id
                ORDER BY bn.published_date DESC, bn.display_order ASC, bn.created_date DESC
            `);
        return result.recordset;
    }

    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT bn.*, u.username as created_by_username
                FROM business_news bn
                LEFT JOIN tbl_users u ON bn.created_by = u.id
                WHERE bn.id = @id
            `);
        return result.recordset[0];
    }

    static async create(businessNewsData) {
        const pool = getPool();
        const result = await pool.request()
            .input('title', sql.NVarChar, businessNewsData.title)
            .input('content', sql.NVarChar, businessNewsData.content)
            .input('excerpt', sql.NVarChar, businessNewsData.excerpt || null)
            .input('image', sql.NVarChar, businessNewsData.image || null)
            .input('category', sql.NVarChar, businessNewsData.category || null)
            .input('display_order', sql.Int, businessNewsData.display_order || 0)
            .input('status', sql.NVarChar, businessNewsData.status || 'active')
            .input('published_date', sql.DateTime, businessNewsData.published_date || new Date())
            .input('created_by', sql.Int, businessNewsData.created_by)
            .query(`
                INSERT INTO business_news (title, content, excerpt, image, category, display_order, status, published_date, created_by)
                OUTPUT INSERTED.*
                VALUES (@title, @content, @excerpt, @image, @category, @display_order, @status, @published_date, @created_by)
            `);
        return result.recordset[0];
    }

    static async update(id, businessNewsData) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, businessNewsData.title)
            .input('content', sql.NVarChar, businessNewsData.content)
            .input('excerpt', sql.NVarChar, businessNewsData.excerpt || null)
            .input('image', sql.NVarChar, businessNewsData.image || null)
            .input('category', sql.NVarChar, businessNewsData.category || null)
            .input('display_order', sql.Int, businessNewsData.display_order || 0)
            .input('status', sql.NVarChar, businessNewsData.status || 'active')
            .input('published_date', sql.DateTime, businessNewsData.published_date || new Date())
            .query(`
                UPDATE business_news 
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
                DELETE FROM business_news 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }
}

module.exports = BusinessNews;
