const { getPool, sql } = require('../config/database');

class Leader {
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT l.*, u.username as created_by_username
                FROM leaders l
                LEFT JOIN tbl_users u ON l.created_by = u.id
                WHERE l.status = 'active'
                ORDER BY l.display_order ASC, l.created_date DESC
            `);
        return result.recordset;
    }

    static async findAllForAdmin() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT l.*, u.username as created_by_username
                FROM leaders l
                LEFT JOIN tbl_users u ON l.created_by = u.id
                ORDER BY l.display_order ASC, l.created_date DESC
            `);
        return result.recordset;
    }

    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT l.*, u.username as created_by_username
                FROM leaders l
                LEFT JOIN tbl_users u ON l.created_by = u.id
                WHERE l.id = @id
            `);
        return result.recordset[0];
    }

    static async create(leaderData) {
        const pool = getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar, leaderData.name)
            .input('title', sql.NVarChar, leaderData.title)
            .input('description', sql.NVarChar, leaderData.description || null)
            .input('image', sql.NVarChar, leaderData.image || null)
            .input('icon', sql.NVarChar, leaderData.icon || null)
            .input('display_order', sql.Int, leaderData.display_order || 0)
            .input('status', sql.NVarChar, leaderData.status || 'active')
            .input('created_by', sql.Int, leaderData.created_by)
            .query(`
                INSERT INTO leaders (name, title, description, image, icon, display_order, status, created_by)
                OUTPUT INSERTED.*
                VALUES (@name, @title, @description, @image, @icon, @display_order, @status, @created_by)
            `);
        return result.recordset[0];
    }

    static async update(id, leaderData) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, leaderData.name)
            .input('title', sql.NVarChar, leaderData.title)
            .input('description', sql.NVarChar, leaderData.description || null)
            .input('image', sql.NVarChar, leaderData.image || null)
            .input('icon', sql.NVarChar, leaderData.icon || null)
            .input('display_order', sql.Int, leaderData.display_order || 0)
            .input('status', sql.NVarChar, leaderData.status || 'active')
            .query(`
                UPDATE leaders 
                SET name = @name,
                    title = @title,
                    description = @description,
                    image = @image,
                    icon = @icon,
                    display_order = @display_order,
                    status = @status,
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
                DELETE FROM leaders 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    static async updateDisplayOrder(updates) {
        const pool = getPool();
        const transaction = pool.transaction();
        
        try {
            await transaction.begin();
            
            for (const update of updates) {
                await transaction.request()
                    .input('id', sql.Int, update.id)
                    .input('display_order', sql.Int, update.display_order)
                    .query(`
                        UPDATE leaders 
                        SET display_order = @display_order,
                            modified_date = GETDATE()
                        WHERE id = @id
                    `);
            }
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = Leader;
