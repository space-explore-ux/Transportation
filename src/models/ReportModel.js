const db = require('../config/db');

const ReportModel = {
    generateCustomReport: async (agencyId, filterColumn, fromDate, toDate) => {
        // 1. Security: Whitelist allowed columns to prevent SQL injection
        const allowedColumns = ['fc_expiry_date', 'np', 'permit', 'road_tax', 'created_at'];
        
        if (!allowedColumns.includes(filterColumn)) {
            throw new Error('Invalid filter column');
        }

        // 2. Build the query. We select all columns and let the frontend decide which ones to show.
        const query = `
            SELECT * FROM vehicle_records 
            WHERE agency_id = ? 
              AND \`${filterColumn}\` BETWEEN ? AND ?
            ORDER BY \`${filterColumn}\` ASC
        `;

        const values = [agencyId, fromDate, toDate];
        const [rows] = await db.execute(query, values);
        
        return rows;
    }
};

module.exports = ReportModel;