const BillingModel = require('../models/BillingModel');

const addBill = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const newBillId = await BillingModel.create(agencyId, req.body);
        return res.status(201).json({ success: true, message: 'Bill created.' });
    } catch (error) {
        console.error('Error in addBill:', error);
        return res.status(500).json({ success: false, message: 'Error adding bill.' });
    }
};

const getBills = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const filters = {
            status: req.query.status, // Paid, Partial, Pending
            start_date: req.query.start_date,
            end_date: req.query.end_date
        };

        const bills = await BillingModel.getAllFiltered(agencyId, filters);
        return res.status(200).json({ success: true, data: bills });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching bills.' });
    }
};

const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const agencyId = req.user.agency_id;
        const affected = await BillingModel.update(id, agencyId, req.body);
        
        if (affected === 0) return res.status(404).json({ success: false, message: 'Bill not found.' });
        return res.status(200).json({ success: true, message: 'Bill updated successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating bill.' });
    }
};

const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        const agencyId = req.user.agency_id;
        await BillingModel.delete(id, agencyId);
        return res.status(200).json({ success: true, message: 'Bill deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting bill.' });
    }
};

module.exports = { addBill, getBills, updateBill, deleteBill };