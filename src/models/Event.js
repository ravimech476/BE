const { getPool, sql } = require('../config/database');

class Event {
    static async getAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT e.id, e.event_name, e.event_date, e.description, e.status,
                       e.created_date, e.modified_date,
                       u.first_name + ' ' + u.last_name as created_by_name
                FROM tbl_events e
                LEFT JOIN tbl_users u ON e.created_by = u.id
                WHERE e.status = 'active'
                ORDER BY e.event_date ASC
            `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT e.id, e.event_name, e.event_date, e.description, e.status,
                       e.created_date, e.modified_date, e.created_by,
                       u.first_name + ' ' + u.last_name as created_by_name
                FROM tbl_events e
                LEFT JOIN tbl_users u ON e.created_by = u.id
                WHERE e.id = @id
            `);
        return result.recordset[0];
    }

    static async create(eventData) {
        const pool = getPool();
        const result = await pool.request()
            .input('event_name', sql.NVarChar, eventData.event_name)
            .input('event_date', sql.DateTime, new Date(eventData.event_date))
            .input('description', sql.NVarChar, eventData.description || null)
            .input('created_by', sql.Int, eventData.created_by)
            .query(`
                INSERT INTO tbl_events (event_name, event_date, description, created_by)
                OUTPUT INSERTED.*
                VALUES (@event_name, @event_date, @description, @created_by)
            `);
        return result.recordset[0];
    }

    static async update(id, eventData) {
        const pool = getPool();
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, id);
        request.input('modified_date', sql.DateTime, new Date());
        
        if (eventData.event_name !== undefined) {
            updates.push('event_name = @event_name');
            request.input('event_name', sql.NVarChar, eventData.event_name);
        }
        
        if (eventData.event_date !== undefined) {
            updates.push('event_date = @event_date');
            request.input('event_date', sql.DateTime, new Date(eventData.event_date));
        }
        
        if (eventData.description !== undefined) {
            updates.push('description = @description');
            request.input('description', sql.NVarChar, eventData.description);
        }
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        const query = `
            UPDATE tbl_events 
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
            .input('modified_date', sql.DateTime, new Date())
            .query(`
                UPDATE tbl_events 
                SET status = 'deleted', modified_date = @modified_date
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async getUpcoming(limit = 5) {
        const pool = getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP(@limit) id, event_name, event_date, description
                FROM tbl_events
                WHERE status = 'active' AND event_date >= GETDATE()
                ORDER BY event_date ASC
            `);
        return result.recordset;
    }

    static async getCompleted(limit = 5) {
        const pool = getPool();
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP(@limit) id, event_name, event_date, description
                FROM tbl_events
                WHERE status = 'active' AND event_date < GETDATE()
                ORDER BY event_date DESC
            `);
        return result.recordset;
    }

    static async getByMonth(year, month) {
        const pool = getPool();
        const result = await pool.request()
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
                SELECT id, event_name, event_date, description
                FROM tbl_events
                WHERE status = 'active' 
                AND YEAR(event_date) = @year 
                AND MONTH(event_date) = @month
                ORDER BY event_date ASC
            `);
        return result.recordset;
    }
}

module.exports = Event;
