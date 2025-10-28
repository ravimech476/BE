const { getPool, sql } = require('../config/database');

class Category {
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT id, name, created_date, modified_date
                FROM categories
                ORDER BY name ASC
            `);
        return result.recordset;
    }

    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, name, created_date, modified_date
                FROM categories
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    static async create(categoryData) {
        const pool = getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar, categoryData.name)
            .query(`
                INSERT INTO categories (name)
                OUTPUT INSERTED.*
                VALUES (@name)
            `);
        return result.recordset[0];
    }

    static async update(id, categoryData) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, categoryData.name)
            .query(`
                UPDATE categories 
                SET name = @name,
                    modified_date = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    static async delete(id) {
        const pool = getPool();
        
        // Check if category has subcategories
        const subCatCheck = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count
                FROM subcategories
                WHERE category_id = @id
            `);
        
        if (subCatCheck.recordset[0].count > 0) {
            throw new Error('Cannot delete category with existing subcategories');
        }
        
        // Check if category is used in dashboard links
        const dashboardCheck = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count
                FROM dashboard_links
                WHERE category_id = @id
            `);
        
        if (dashboardCheck.recordset[0].count > 0) {
            throw new Error('Cannot delete category used in dashboard links');
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM categories 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }
}

module.exports = Category;
