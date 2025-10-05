const { getPool, sql } = require('../config/database');

class DashboardLink {
    static async create(linkData) {
        const pool = getPool();
        const result = await pool.request()
            .input('title', sql.NVarChar, linkData.title)
            .input('description', sql.NVarChar, linkData.description)
            .input('url', sql.NVarChar, linkData.url)
            .input('display_order', sql.Int, linkData.display_order || 0)
            .input('status', sql.NVarChar, linkData.status || 'active')
            .query(`
                INSERT INTO dashboard_links (title, description, url, display_order, status)
                OUTPUT INSERTED.*
                VALUES (@title, @description, @url, @display_order, @status)
            `);
        
        return result.recordset[0];
    }
    
    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM dashboard_links WHERE id = @id');
        
        return result.recordset[0];
    }
    
    static async getAll(filters = {}) {
        const pool = getPool();
        let query = 'SELECT * FROM dashboard_links WHERE 1=1';
        const request = pool.request();
        
        if (filters.status) {
            query += ' AND status = @status';
            request.input('status', sql.NVarChar, filters.status);
        }
        
        query += ' ORDER BY display_order ASC, created_date DESC';
        
        const result = await request.query(query);
        return result.recordset;
    }
    
    static async update(id, updateData) {
        const pool = getPool();
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, id);
        request.input('modified_date', sql.DateTime, new Date());
        
        const allowedFields = ['title', 'description', 'url', 'display_order', 'status'];
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = @${field}`);
                if (field === 'display_order') {
                    request.input(field, sql.Int, updateData[field]);
                } else {
                    request.input(field, sql.NVarChar, updateData[field]);
                }
            }
        }
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        const query = `
            UPDATE dashboard_links 
            SET ${updates.join(', ')}, modified_date = @modified_date
            OUTPUT INSERTED.*
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        return result.recordset[0];
    }
    
    static async delete(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM dashboard_links WHERE id = @id');
        
        return result.rowsAffected[0] > 0;
    }
}

module.exports = DashboardLink;
