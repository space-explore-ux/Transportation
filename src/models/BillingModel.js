const db = require('../config/db');

const BillingModel = {
    create: async (agencyId, data) => {
        const query = `
            INSERT INTO billing_records (agency_id, vehicle_id, work_description, total_amount, paid_amount, billing_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        let status = 'Pending';
        if (parseFloat(data.paid_amount) >= parseFloat(data.total_amount)) status = 'Paid';
        else if (parseFloat(data.paid_amount) > 0) status = 'Partial';

        const values = [agencyId, data.vehicle_id, data.work_description, data.total_amount, data.paid_amount, data.billing_date, status];
        const [result] = await db.execute(query, values);
        return result.insertId;
    },

    // Dynamic Filter: status, start_date, end_date
    getAllFiltered: async (agencyId, filters = {}) => {
        let query = `
            SELECT b.*, v.vehicle_number, v.client_name 
            FROM billing_records b
            JOIN vehicle_records v ON b.vehicle_id = v.id
            WHERE b.agency_id = ?
        `;
        const values = [agencyId];

        if (filters.status && filters.status !== 'All') {
            query += ` AND b.status = ?`;
            values.push(filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query += ` AND b.billing_date BETWEEN ? AND ?`;
            values.push(filters.start_date, filters.end_date);
        }

        query += ` ORDER BY b.billing_date DESC`;
        const [rows] = await db.execute(query, values);
        return rows;
    },

    update: async (id, agencyId, data) => {
        // Recalculate status based on new numbers
        let status = 'Pending';
        if (parseFloat(data.paid_amount) >= parseFloat(data.total_amount)) status = 'Paid';
        else if (parseFloat(data.paid_amount) > 0) status = 'Partial';

        const query = `
            UPDATE billing_records 
            SET work_description = ?, total_amount = ?, paid_amount = ?, billing_date = ?, status = ?
            WHERE id = ? AND agency_id = ?
        `;
        const [result] = await db.execute(query, [
            data.work_description, data.total_amount, data.paid_amount, data.billing_date, status, id, agencyId
        ]);
        return result.affectedRows;
    },

    delete: async (id, agencyId) => {
        const query = `DELETE FROM billing_records WHERE id = ? AND agency_id = ?`;
        const [result] = await db.execute(query, [id, agencyId]);
        return result.affectedRows;
    }
};

module.exports = BillingModel;