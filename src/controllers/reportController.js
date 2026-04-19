const ReportModel = require('../models/ReportModel');

const generateReport = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const { filter_column, from_date, to_date } = req.body;

        // Validation
        if (!filter_column || !from_date || !to_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'filter_column, from_date, and to_date are required.' 
            });
        }

        const reportData = await ReportModel.generateCustomReport(
            agencyId, 
            filter_column, 
            from_date, 
            to_date
        );

        return res.status(200).json({
            success: true,
            count: reportData.length,
            data: reportData,
            message: 'Report data generated successfully.'
        });

    } catch (error) {
        if (error.message === 'Invalid filter column') {
            return res.status(400).json({ success: false, message: 'Invalid column selected for filtering.' });
        }
        console.error('Error generating report:', error);
        return res.status(500).json({ success: false, message: 'Server error generating report.' });
    }
};

module.exports = {
    generateReport
};