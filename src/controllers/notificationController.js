const NotificationModel = require('../models/NotificationModel');

const getNotifications = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        
        // Defaults: 'all' tabs, 'asc' order (Expired first), 30 days threshold
        const tab = req.query.tab || 'all'; 
        const sort = req.query.sort || 'asc';
        const threshold = parseInt(req.query.threshold) || 30;

        const notifications = await NotificationModel.getExpiringDocuments(agencyId, tab, sort, threshold);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications,
            message: `Retrieved ${tab} notifications within ${threshold} days.`
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
    }
};

module.exports = {
    getNotifications
};