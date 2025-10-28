const { getPool, sql } = require('../config/database');

class HeroSection {
    // Get active hero section (for public display)
    static async getActive() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT h.*, u.username as created_by_username
                FROM hero_section h
                LEFT JOIN tbl_users u ON h.created_by = u.id
                WHERE h.is_active = 1
            `);
        return result.recordset[0];
    }

    // Get all hero sections (for admin management)
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT h.*, u.username as created_by_username
                FROM hero_section h
                LEFT JOIN tbl_users u ON h.created_by = u.id
                ORDER BY h.is_active DESC, h.created_date DESC
            `);
        return result.recordset;
    }

    // Get single hero section by ID
    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT h.*, u.username as created_by_username
                FROM hero_section h
                LEFT JOIN tbl_users u ON h.created_by = u.id
                WHERE h.id = @id
            `);
        return result.recordset[0];
    }

    // Create new hero section
    static async create(heroData) {
        const pool = getPool();
        
        // Deactivate all other hero sections first
        await pool.request()
            .query(`UPDATE hero_section SET is_active = 0`);
        
        const result = await pool.request()
            .input('title', sql.NVarChar, heroData.title)
            .input('image', sql.NVarChar, heroData.image || null)
            .input('is_active', sql.Bit, 1)
            .input('created_by', sql.Int, heroData.created_by)
            .query(`
                INSERT INTO hero_section (title, image, is_active, created_by)
                OUTPUT INSERTED.*
                VALUES (@title, @image, @is_active, @created_by)
            `);
        return result.recordset[0];
    }

    // Update hero section
    static async update(id, heroData) {
        const pool = getPool();
        
        // If setting this as active, deactivate all others first
        if (heroData.is_active) {
            await pool.request()
                .query(`UPDATE hero_section SET is_active = 0`);
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, heroData.title)
            .input('image', sql.NVarChar, heroData.image)
            .input('is_active', sql.Bit, heroData.is_active ? 1 : 0)
            .query(`
                UPDATE hero_section 
                SET title = @title,
                    image = @image,
                    is_active = @is_active,
                    modified_date = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    // Delete hero section
    static async delete(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM hero_section 
                OUTPUT DELETED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }

    // Set active hero section
    static async setActive(id) {
        const pool = getPool();
        
        // Deactivate all
        await pool.request()
            .query(`UPDATE hero_section SET is_active = 0`);
        
        // Activate the selected one
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE hero_section 
                SET is_active = 1, modified_date = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        return result.recordset[0];
    }
}

module.exports = HeroSection;
