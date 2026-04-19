const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');

// --- ADMIN ONLY FUNCTIONS ---

const getEmployees = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const employees = await UserModel.findAllByAgency(agencyId);
        
        return res.status(200).json({ success: true, data: employees });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching employees.' });
    }
};

const addEmployee = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        // Check if email already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email is already registered.' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = await UserModel.create(agencyId, { name, email }, hashedPassword);

        return res.status(201).json({ 
            success: true, 
            message: 'Employee added successfully.',
            data: { id: newUserId, name, email, role: 'employee' }
        });
    } catch (error) {
        console.error('Error adding employee:', error);
        return res.status(500).json({ success: false, message: 'Server error adding employee.' });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const employeeId = req.params.id;
        const { name, email } = req.body;

        const updatedRows = await UserModel.updateById(employeeId, agencyId, { name, email });

        if (updatedRows === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        return res.status(200).json({ success: true, message: 'Employee updated successfully.' });
    } catch (error) {
        console.error('Error updating employee:', error);
        return res.status(500).json({ success: false, message: 'Server error updating employee.' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const employeeId = req.params.id;

        // Prevent admin from deleting themselves
        if (parseInt(employeeId) === req.user.id) {
            return res.status(403).json({ success: false, message: 'You cannot delete your own admin account.' });
        }

        const deletedRows = await UserModel.deleteById(employeeId, agencyId);

        if (deletedRows === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        return res.status(200).json({ success: true, message: 'Employee deleted successfully.' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting employee.' });
    }
};

// --- AVAILABLE TO ALL LOGGED-IN USERS (Admins & Employees) ---

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id; // Get the ID of the person making the request
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Verify the old password matches what is in the DB
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect old password.' });
        }

        // Hash and save the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.updatePassword(userId, hashedPassword);

        return res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ success: false, message: 'Server error changing password.' });
    }
};

module.exports = {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    changePassword
};