const db = require('../config/db');

const WhatsAppModel = {
    // 1. Fetch all settings for the agency
    getAgencySettings: async (agencyId) => {
        const query = `SELECT setting_key, setting_value FROM agency_settings WHERE agency_id = ?`;
        const [rows] = await db.execute(query, [agencyId]);
        
        // Convert the array of rows into a simple object: { fc_alert_days: 30, ... }
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        return settings;
    },

    // 2. Fetch vehicles that match the custom thresholds
    getVehiclesToMessage: async (agencyId, limits) => {
        const query = `
            SELECT id, client_name, phone, vehicle_number, fc_expiry_date, np, permit
            FROM vehicle_records 
            WHERE agency_id = ? 
            AND (last_whatsapp_sent IS NULL OR last_whatsapp_sent < CURRENT_DATE())
            AND (
                DATEDIFF(fc_expiry_date, CURRENT_DATE()) IN (0, 7, ?) OR
                DATEDIFF(np, CURRENT_DATE()) IN (0, 7, ?) OR
                DATEDIFF(permit, CURRENT_DATE()) IN (0, 7, ?)
            )
        `;
        const [rows] = await db.execute(query, [
            agencyId, 
            parseInt(limits.fc_alert_days) || 30, 
            parseInt(limits.np_alert_days) || 10, 
            parseInt(limits.permit_alert_days) || 7
        ]);
        return rows;
    },

    // 3. Update the overall agency blast date (so the frontend button disables)
    updateLastBlastDate: async (agencyId) => {
        const query = `
            INSERT INTO agency_settings (agency_id, setting_key, setting_value) 
            VALUES (?, 'last_blast_date', CURRENT_DATE())
            ON DUPLICATE KEY UPDATE setting_value = CURRENT_DATE()
        `;
        await db.execute(query, [agencyId]);
    },

    // 4. Mark the specific vehicle as messaged today
    markVehicleAsSent: async (vehicleId) => {
        const query = `UPDATE vehicle_records SET last_whatsapp_sent = CURRENT_DATE() WHERE id = ?`;
        await db.execute(query, [vehicleId]);
    }
};

module.exports = WhatsAppModel;