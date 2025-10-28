const { getPool, sql } = require('../config/database');

class SubCategory {
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT s.id, s.category_id, s.name, s.created_date, s.modified_date,
                       c.name as category_name
                FROM subcategories s
                LEFT JOIN categories c ON s.category_id = c.id
                ORDER BY c.name ASC, s.name ASC
            `);
        return result.recordset;
    }

    static async findByCategory(categoryId) {
        const pool = getPool();
        const result = await pool.request()
            .input('categoryId', sql.Int, categoryId)
            .query(`
                SELECT s.id, s.category_id, s.name, s.created_date, s.modified_date,
                       c.name as category_name
                FROM subcategories s
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE s.category_id = @categoryId
                ORDER BY s.name ASC
            `);
        return result.recordset;
    }

    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT s.id, s.category_id, s.name, s.created_date, s.modified_date,
                       c.name as category_name
                FROM subcategories s
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE s.id = @id
            `);
        return result.recordset[0];
    }

    static async create(subCategoryData) {
        const pool = getPool();
        const result = await pool.request()
            .input('categoryId', sql.Int, subCategoryData.category_id)
            .input('name', sql.NVarChar, subCategoryData.name)
            .query(`
                INSERT INTO subcategories (category_id, name)
                OUTPUT INSERTED.*
                VALUES (@categoryId, @name)
            `);
        return result.recordset[0];
    }

    static async update(id, subCategoryData) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('categoryId', sql.Int, subCategoryData.category_id)
            .input('name', sql.NVarChar, subCategoryData.name)
            .query(`
                UPDATE subcategories 
                SET category_id = @categoryId,
                    name = @name,
                    modified_date = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    static async delete(id) {
        const pool = getPool();
        
        // Check if subcategory is used in dashboard links
        const dashboardCheck = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count
                FROM dashboard_links
                WHERE subcategory_id = @id
            `);
        
        if (dashboardCheck.recordset[0].count > 0) {
            throw new Error('Cannot delete subcategory used in dashboard links');
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM subcategories 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }
}

module.exports = SubCategory;
