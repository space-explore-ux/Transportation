const db = require('../config/db');
const crypto = require('crypto');

const UserModel = {
    // Used for login
    findByEmail: async (email) => {
        const query = `SELECT * FROM users WHERE email = ? LIMIT 1`;
        const [rows] = await db.execute(query, [email]);
        return rows.length > 0 ? rows[0] : null;
    },

    // Used to verify old password during a password change
    findById: async (id) => {
        const query = `SELECT * FROM users WHERE id = ? LIMIT 1`;
        const [rows] = await db.execute(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    },

    // Fetch all staff for an agency (Notice we DO NOT select the password column here for security)
    findAllByAgency: async (agencyId) => {
        const query = `SELECT id, uuid, name, email, role, created_at FROM users WHERE agency_id = ? ORDER BY created_at DESC`;
        const [rows] = await db.execute(query, [agencyId]);
        return rows;
    },

    // Admin adds a new employee
    create: async (agencyId, data, hashedPassword) => {
        const uuid = crypto.randomUUID();
        const query = `
            INSERT INTO users (uuid, agency_id, name, email, password, role) 
            VALUES (?, ?, ?, ?, ?, 'employee')
        `;
        const values = [uuid, agencyId, data.name, data.email, hashedPassword];
        const [result] = await db.execute(query, values);
        return result.insertId;
    },

    // Admin updates an employee's details
    updateById: async (id, agencyId, data) => {
        const query = `UPDATE users SET name = ?, email = ? WHERE id = ? AND agency_id = ?`;
        const [result] = await db.execute(query, [data.name, data.email, id, agencyId]);
        return result.affectedRows;
    },

    // Admin deletes an employee
    deleteById: async (id, agencyId) => {
        const query = `DELETE FROM users WHERE id = ? AND agency_id = ?`;
        const [result] = await db.execute(query, [id, agencyId]);
        return result.affectedRows;
    },

    // Change password (Used by both Admins and Employees)
    updatePassword: async (id, hashedPassword) => {
        const query = `UPDATE users SET password = ? WHERE id = ?`;
        const [result] = await db.execute(query, [hashedPassword, id]);
        return result.affectedRows;
    }
};

module.exports = UserModel;