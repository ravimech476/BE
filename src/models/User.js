const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findById(id) {
        const pool = getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, username, email_id, first_name, last_name, 
                       role, status, phone, last_login_datetime, created_date
                FROM tbl_users 
                WHERE id = @id
            `);
        return result.recordset[0];
    }
    
    static async findByUsername(username) {
        const pool = getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id, username, password, email_id, first_name, last_name, 
                       role, status, phone, last_login_datetime, created_date
                FROM tbl_users 
                WHERE username = @username
            `);
        return result.recordset[0];
    }
    
    static async findByEmail(email) {
        const pool = getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id, username, password, email_id, first_name, last_name, 
                       role, status, phone, last_login_datetime, created_date
                FROM tbl_users 
                WHERE email_id = @email
            `);
        return result.recordset[0];
    }
    
    static async create(userData) {
        const pool = getPool();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const result = await pool.request()
            .input('username', sql.NVarChar, userData.username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email_id', sql.NVarChar, userData.email_id)
            .input('first_name', sql.NVarChar, userData.first_name)
            .input('last_name', sql.NVarChar, userData.last_name)
            .input('phone', sql.NVarChar, userData.phone || null)
            .input('role', sql.NVarChar, userData.role || 'employee')
            .input('status', sql.NVarChar, 'active')
            .query(`
                INSERT INTO tbl_users (username, password, email_id, first_name, last_name, phone, role, status)
                OUTPUT INSERTED.*
                VALUES (@username, @password, @email_id, @first_name, @last_name, @phone, @role, @status)
            `);
        
        const user = result.recordset[0];
        delete user.password;
        return user;
    }
    
    static async updateLastLogin(userId) {
        const pool = getPool();
        await pool.request()
            .input('id', sql.Int, userId)
            .input('lastLogin', sql.DateTime, new Date())
            .query(`
                UPDATE tbl_users 
                SET last_login_datetime = @lastLogin 
                WHERE id = @id
            `);
    }
    
    static async update(userId, updateData) {
        const pool = getPool();
        const allowedFields = ['first_name', 'last_name', 'phone', 'email_id'];
        const updates = [];
        const request = pool.request();
        
        request.input('id', sql.Int, userId);
        request.input('modified_date', sql.DateTime, new Date());
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = @${field}`);
                request.input(field, sql.NVarChar, updateData[field]);
            }
        }
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        const query = `
            UPDATE tbl_users 
            SET ${updates.join(', ')}, modified_date = @modified_date
            OUTPUT INSERTED.*
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        const user = result.recordset[0];
        delete user.password;
        return user;
    }
    
    static async changePassword(userId, oldPassword, newPassword) {
        const pool = getPool();
        
        // First, get the current password
        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT password FROM tbl_users WHERE id = @id');
        
        if (userResult.recordset.length === 0) {
            throw new Error('User not found');
        }
        
        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, userResult.recordset[0].password);
        if (!isValid) {
            throw new Error('Invalid current password');
        }
        
        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input('id', sql.Int, userId)
            .input('password', sql.NVarChar, hashedPassword)
            .input('modified_date', sql.DateTime, new Date())
            .query(`
                UPDATE tbl_users 
                SET password = @password, modified_date = @modified_date
                WHERE id = @id
            `);
        
        return { message: 'Password changed successfully' };
    }
    
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    static async findAll() {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT id, username, email_id, first_name, last_name, 
                       role, status, phone, last_login_datetime, created_date
                FROM tbl_users 
                WHERE status = 'active'
                ORDER BY first_name, last_name
            `);
        return result.recordset;
    }
    
    static async getAll(filters = {}) {
        const pool = getPool();
        let query = `
            SELECT id, username, email_id, first_name, last_name, 
                   role, status, phone, last_login_datetime, created_date
            FROM tbl_users 
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (filters.status) {
            query += ' AND status = @status';
            request.input('status', sql.NVarChar, filters.status);
        }
        
        if (filters.role) {
            query += ' AND role = @role';
            request.input('role', sql.NVarChar, filters.role);
        }
        
        query += ' ORDER BY created_date DESC';
        
        const result = await request.query(query);
        return result.recordset;
    }
}

module.exports = User;
