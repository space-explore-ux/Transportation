const db = require('../config/db');

const NotificationModel = {
    getExpiringDocuments: async (agencyId, tab, sortOrder, thresholdDays) => {
        let query = '';
        const values = [agencyId];
        
        // We use DATE_ADD to calculate the future threshold
        // We do NOT use a lower bound, because we want ALL expired documents too!
        const thresholdClause = `<= DATE_ADD(CURRENT_DATE(), INTERVAL ? DAY)`;
        values.push(thresholdDays);

        // Helper function to build the SELECT statement for a specific document type
        const buildSelect = (docType, columnName) => `
            SELECT 
                id, client_name, vehicle_number, company, phone, 
                '${docType}' as doc_type, 
                ${columnName} as expiry_date,
                DATEDIFF(${columnName}, CURRENT_DATE()) as days_left
            FROM vehicle_records 
            WHERE agency_id = ? AND ${columnName} IS NOT NULL AND ${columnName} ${thresholdClause}
        `;

        if (tab === 'all') {
            // If 'all', we UNION the queries together so the user gets one massive list
            query = `
                ${buildSelect('FC', 'fc_expiry_date')}
                UNION ALL
                ${buildSelect('NP', 'np')}
                UNION ALL
                ${buildSelect('Permit', 'permit')}
                UNION ALL
                ${buildSelect('Road Tax', 'road_tax')}
            `;
            // Because we have 4 queries in the UNION, we need to duplicate the parameters
            values.push(agencyId, thresholdDays, agencyId, thresholdDays, agencyId, thresholdDays);
        } else {
            // If a specific tab is clicked
            let columnMap = {
                'fc': 'fc_expiry_date',
                'np': 'np',
                'permit': 'permit',
                'road_tax': 'road_tax'
            };
            const column = columnMap[tab.toLowerCase()];
            if (!column) throw new Error('Invalid tab parameter');
            
            query = buildSelect(tab.toUpperCase(), column);
        }

        // Apply sorting (asc = Oldest/Expired first, desc = Furthest upcoming first)
        const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY expiry_date ${order}`;

        const [rows] = await db.execute(query, values);
        return rows;
    }
};

module.exports = NotificationModel;