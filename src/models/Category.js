const { getPool, sql } = require('../config/database');

class Category {
    static async create(categoryData) {
        const pool = getPool();
        const slug = categoryData.slug || this.generateSlug(categoryData.name);
        
        const result = await pool.request()
            .input('name', sql.NVarChar, categoryData.name)
            .input('slug', sql.NVarChar, slug)
            .input('description', sql.NVarChar, categoryData.description || null)
            .query(`
                INSERT INTO blog_categories (name, slug, description)
                OUTPUT INSERTED.*
                VALUES (@name, @slug, @description)
            `);
        
        return result.recordset[0];
    }
    
    static async update(categoryId, updateData) {
        const pool = getPool();
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, categoryId);
        
        if (updateData.name !== undefined) {
            updates.push('name = @name');
            request.input('name', sql.NVarChar, updateData.name);
            
            if (!updateData.slug) {
                updates.push('slug = @slug');
                request.input('slug', sql.NVarChar, this.generateSlug(updateData.name));
            }
        }
        
        if (updateData.slug !== undefined) {
            updates.push('slug = @slug');
            request.input('slug', sql.NVarChar, updateData.slug);
        }
        
        if (updateData.description !== undefined) {
            updates.push('description = @description');
            request.input('description', sql.NVarChar, updateData.description);
        }
        
        const query = `
            UPDATE blog_categories 
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
                       (SELECT COUNT(*) FROM blog_post_categories WHERE category_id = c.id) as post_count
                FROM blog_categories c
                WHERE c.id = @id
            `);
        
        return result.recordset[0];
    }
    
    static async findBySlug(slug) {
        const pool = getPool();
        const result = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query(`
                SELECT c.*, 
                       (SELECT COUNT(*) FROM blog_post_categories WHERE category_id = c.id) as post_count
                FROM blog_categories c
                WHERE c.slug = @slug
            `);
        
        return result.recordset[0];
    }
    
    static async getAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT c.*, 
                       (SELECT COUNT(*) 
                        FROM blog_post_categories pc 
                        JOIN blog_posts p ON pc.post_id = p.id 
                        WHERE pc.category_id = c.id AND p.status = 'published') as post_count
                FROM blog_categories c
                ORDER BY c.name
            `);
        
        return result.recordset;
    }
    
    static async delete(categoryId) {
        const pool = getPool();
        
        // Check if category has posts
        const checkResult = await pool.request()
            .input('id', sql.Int, categoryId)
            .query('SELECT COUNT(*) as count FROM blog_post_categories WHERE category_id = @id');
        
        if (checkResult.recordset[0].count > 0) {
            throw new Error('Cannot delete category with associated posts');
        }
        
        const result = await pool.request()
            .input('id', sql.Int, categoryId)
            .query('DELETE FROM blog_categories WHERE id = @id');
        
        return result.rowsAffected[0] > 0;
    }
    
    static generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}

module.exports = Category;
