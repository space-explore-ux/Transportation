const WhatsAppModel = require('../models/WhatsAppModel');
const axios = require('axios');

// Endpoint to check if the button should be disabled on the frontend
const getStatus = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const settings = await WhatsAppModel.getAgencySettings(agencyId);
        
        // Check if the last blast date is today (ISO format YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const alreadySentToday = settings.last_blast_date === today;

        return res.status(200).json({ success: true, alreadySentToday });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking WhatsApp status.' });
    }
};

const sendBulkWhatsApp = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        
        const settings = await WhatsAppModel.getAgencySettings(agencyId);

        const vehicles = await WhatsAppModel.getVehiclesToMessage(agencyId, settings);

        // Default config
        const defaultDaysConfig = [
            { day: 0, enabled: true },
            { day: 7, enabled: true }
        ];

        const defaultEnabledDays = defaultDaysConfig
            .filter(d => d.enabled)
            .map(d => d.day);

        const getDiff = (date) => {
            if (!date) return null;
            return Math.ceil(
                (new Date(date) - new Date()) / (1000 * 60 * 60 * 24)
            );
        };

        // ✅ GROUPING OBJECT
        const grouped = {};

        vehicles.forEach(vehicle => {

            const fcDiff = getDiff(vehicle.fc_expiry_date);
            const npDiff = getDiff(vehicle.np);
            const permitDiff = getDiff(vehicle.permit);

            const fcValid = fcDiff !== null && (
                defaultEnabledDays.includes(fcDiff) ||
                fcDiff === (parseInt(settings.fc_alert_days) || 30)
            );

            const npValid = npDiff !== null && (
                defaultEnabledDays.includes(npDiff) ||
                npDiff === (parseInt(settings.np_alert_days) || 10)
            );

            const permitValid = permitDiff !== null && (
                defaultEnabledDays.includes(permitDiff) ||
                permitDiff === (parseInt(settings.permit_alert_days) || 7)
            );

            if (!(fcValid || npValid || permitValid)) return;

            // ✅ Detect type + day label
            let types = [];
            let dayLabel = '';

            if (fcValid) {
                types.push('FC');
                dayLabel = fcDiff === 0 ? 'Today' : `${fcDiff} days`;
            }
            if (npValid) {
                types.push('NP');
                dayLabel = npDiff === 0 ? 'Today' : `${npDiff} days`;
            }
            if (permitValid) {
                types.push('Permit');
                dayLabel = permitDiff === 0 ? 'Today' : `${permitDiff} days`;
            }

            // ✅ Group by phone
            if (!grouped[vehicle.phone]) {
                grouped[vehicle.phone] = {
                    client_name: vehicle.client_name,
                    vehicles: [],
                    dayLabel: dayLabel
                };
            }

            grouped[vehicle.phone].vehicles.push({
                id: vehicle.id,
                text: `${vehicle.vehicle_number} (${types.join(', ')})`
            });
        });

        if (Object.keys(grouped).length === 0) {
            await WhatsAppModel.updateLastBlastDate(agencyId);
            return res.status(200).json({
                success: true,
                message: 'No vehicles require reminders today.'
            });
        }

        const TOKEN = process.env.META_ACCESS_TOKEN;
        const PHONE_ID = process.env.META_PHONE_ID;
        const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;

        // ✅ SEND ONE MESSAGE PER PHONE
        const apiPromises = Object.entries(grouped).map(async ([phone, data]) => {

            const vehicleList = data.vehicles
                .map((v, i) => `${i + 1}. ${v.text}`)
                .join('\n');

            // 👉 Template parameters
            const customerName = data.client_name;
            const vehicleText = vehicleList;
            const dateText = data.dayLabel;

            const payload = {
                messaging_product: 'whatsapp',
                to: `91${phone}`,
                type: 'template',
                template: {
                    name: 'your_expiry_template_name',
                    language: { code: 'en_US' },
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: customerName },   // {{1}}
                            { type: 'text', text: vehicleText },    // {{2}}
                            { type: 'text', text: dateText }        // {{3}}
                        ]
                    }]
                }
            };

            try {
                // await axios.post(url, payload, {
                //     headers: { Authorization: `Bearer ${TOKEN}` }
                // });

                console.log(`\n📩 Sending to ${phone}`);
                console.log(`Name: ${customerName}`);
                console.log(`Vehicles:\n${vehicleText}`);
                console.log(`When: ${dateText}`);

                // mark all vehicles
                for (const v of data.vehicles) {
                    await WhatsAppModel.markVehicleAsSent(v.id);
                }

                return { success: true };

            } catch (err) {
                console.error(`Failed to send to ${phone}`);
                return { success: false };
            }
        });

        await Promise.all(apiPromises);

        await WhatsAppModel.updateLastBlastDate(agencyId);

        return res.status(200).json({
            success: true,
            message: `Successfully sent grouped WhatsApp reminders to ${Object.keys(grouped).length} users.`
        });

    } catch (error) {
        console.error('WhatsApp Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during broadcast.'
        });
    }
};

module.exports = { getStatus, sendBulkWhatsApp };