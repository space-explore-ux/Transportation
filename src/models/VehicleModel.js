const db = require('../config/db');

const VehicleModel = {
    // Get vehicles with dynamic backend filtering
    getAllByAgency: async (agencyId, filters = {}) => {
        let query = `SELECT * FROM vehicle_records WHERE agency_id = ?`;
        const values = [agencyId];

        // --- 1. Text Filters (Exact & Partial Matches) ---
        if (filters.vehicle_number) {
            query += ` AND vehicle_number LIKE ?`;
            values.push(`%${filters.vehicle_number}%`);
        }
        if (filters.client_name) {
            query += ` AND client_name LIKE ?`;
            values.push(`%${filters.client_name}%`);
        }
        if (filters.phone) {
            query += ` AND phone LIKE ?`;
            values.push(`%${filters.phone}%`);
        }
        if (filters.company) {
            query += ` AND company LIKE ?`;
            values.push(`%${filters.company}%`);
        }
        if (filters.vehicle_type) {
            query += ` AND vehicle_type = ?`;
            values.push(filters.vehicle_type);
        }

        // --- 2. Date Range Filters ---

        // FC Expiry Range
        if (filters.fc_start && filters.fc_end) {
            query += ` AND fc_expiry_date BETWEEN ? AND ?`;
            values.push(filters.fc_start, filters.fc_end);
        } else if (filters.fc_start) {
            query += ` AND fc_expiry_date >= ?`;
            values.push(filters.fc_start);
        } else if (filters.fc_end) {
            query += ` AND fc_expiry_date <= ?`;
            values.push(filters.fc_end);
        }

        // NP Range
        if (filters.np_start && filters.np_end) {
            query += ` AND np BETWEEN ? AND ?`;
            values.push(filters.np_start, filters.np_end);
        } else if (filters.np_start) {
            query += ` AND np >= ?`;
            values.push(filters.np_start);
        } else if (filters.np_end) {
            query += ` AND np <= ?`;
            values.push(filters.np_end);
        }

        // Permit Range
        if (filters.permit_start && filters.permit_end) {
            query += ` AND permit BETWEEN ? AND ?`;
            values.push(filters.permit_start, filters.permit_end);
        } else if (filters.permit_start) {
            query += ` AND permit >= ?`;
            values.push(filters.permit_start);
        } else if (filters.permit_end) {
            query += ` AND permit <= ?`;
            values.push(filters.permit_end);
        }

        // Road Tax Range
        if (filters.road_tax_start && filters.road_tax_end) {
            query += ` AND road_tax BETWEEN ? AND ?`;
            values.push(filters.road_tax_start, filters.road_tax_end);
        } else if (filters.road_tax_start) {
            query += ` AND road_tax >= ?`;
            values.push(filters.road_tax_start);
        } else if (filters.road_tax_end) {
            query += ` AND road_tax <= ?`;
            values.push(filters.road_tax_end);
        }

        // Created At Range
        if (filters.created_start && filters.created_end) {
            // Adding time to ensure it captures the full end day
            query += ` AND created_at >= ? AND created_at <= ?`;
            values.push(`${filters.created_start} 00:00:00`, `${filters.created_end} 23:59:59`);
        }

        // Modified At Range
        if (filters.modified_start && filters.modified_end) {
            query += ` AND modified_at >= ? AND modified_at <= ?`;
            values.push(`${filters.modified_start} 00:00:00`, `${filters.modified_end} 23:59:59`);
        }

        // 3. Always order by most recently modified
        query += ` ORDER BY modified_at DESC`;

        const [rows] = await db.execute(query, values);
        return rows;
    },

    // Checks if a vehicle number already exists for this agency
    findByVehicleNumber: async (agencyId, vehicleNumber) => {
        const query = `SELECT id FROM vehicle_records WHERE vehicle_number = ? AND agency_id = ? LIMIT 1`;
        const [rows] = await db.execute(query, [vehicleNumber, agencyId]);
        return rows.length > 0 ? rows[0] : null; // Returns the vehicle if found, otherwise null
    },

    // Create a new vehicle record tied to an agency
    create: async (agencyId, data) => {
        const query = `
            INSERT INTO vehicle_records 
            (agency_id, client_name, phone, company, vehicle_number, vehicle_type, fc_expiry_date, np, permit, road_tax, road_tax_amount, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            agencyId, data.client_name, data.phone, data.company,
            data.vehicle_number, data.vehicle_type, data.fc_expiry_date,
            data.np, data.permit, data.road_tax, data.road_tax_amount, data.notes
        ];

        const [result] = await db.execute(query, values);
        return result.insertId; // Returns the new ID
    },

    // Add this right below your create() function

    updateById: async (id, agencyId, data) => {
        // We only update the fields that are allowed to change
        const query = `
            UPDATE vehicle_records 
            SET client_name = ?, phone = ?, company = ?, vehicle_number = ?, 
                vehicle_type = ?, fc_expiry_date = ?, np = ?, permit = ?, 
                road_tax = ?, road_tax_amount = ?, notes = ?
            WHERE id = ? AND agency_id = ?
        `;

        const values = [
            data.client_name, data.phone, data.company, data.vehicle_number,
            data.vehicle_type, data.fc_expiry_date, data.np, data.permit,
            data.road_tax, data.road_tax_amount, data.notes,
            id, agencyId // The WHERE clause parameters
        ];

        const [result] = await db.execute(query, values);
        return result.affectedRows; // Returns 1 if successful, 0 if not found/unauthorized
    },

    deleteById: async (id, agencyId) => {
        const query = `DELETE FROM vehicle_records WHERE id = ? AND agency_id = ?`;
        const [result] = await db.execute(query, [id, agencyId]);
        return result.affectedRows;
    }

};

module.exports = VehicleModel;