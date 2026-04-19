const VehicleModel = require('../models/VehicleModel');

const getAllVehicles = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        
        // Express automatically parses URL parameters like ?phone=987 into req.query
        const filters = req.query; 

        // Pass the filters directly to the model
        const vehicles = await VehicleModel.getAllByAgency(agencyId, filters);

        return res.status(200).json({
            success: true,
            count: vehicles.length, // Helpful for the frontend to know how many results came back
            data: vehicles,
            message: 'Vehicles retrieved successfully.'
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching vehicles.' });
    }
};

const addVehicle = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const vehicleData = req.body;

        // 1. Basic validation: ensure the crucial fields exist
        if (!vehicleData.client_name || !vehicleData.vehicle_number) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client Name and Vehicle Number are required.' 
            });
        }

        // 2. NEW: Check for duplicate vehicle number
        const existingVehicle = await VehicleModel.findByVehicleNumber(agencyId, vehicleData.vehicle_number);
        
        if (existingVehicle) {
            return res.status(409).json({ 
                success: false, 
                message: `The vehicle number ${vehicleData.vehicle_number} is already registered in your system.` 
            });
        }

        // 3. If no duplicate is found, proceed to create
        const newVehicleId = await VehicleModel.create(agencyId, vehicleData);

        return res.status(201).json({
            success: true,
            data: { id: newVehicleId, ...vehicleData },
            message: 'Vehicle added successfully.'
        });
    } catch (error) {
        console.error('Error adding vehicle:', error);
        return res.status(500).json({ success: false, message: 'Server error adding vehicle.' });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const vehicleId = req.params.id; // Gets the ID from the URL (e.g., /api/vehicles/5)
        const vehicleData = req.body;

        const updatedRows = await VehicleModel.updateById(vehicleId, agencyId, vehicleData);

        if (updatedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vehicle not found or you do not have permission to edit it.' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully.'
        });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        return res.status(500).json({ success: false, message: 'Server error updating vehicle.' });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        const agencyId = req.user.agency_id;
        const vehicleId = req.params.id;

        const deletedRows = await VehicleModel.deleteById(vehicleId, agencyId);

        if (deletedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vehicle not found or you do not have permission to delete it.' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Vehicle deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return res.status(500).json({ success: false, message: 'Server error deleting vehicle.' });
    }
};

// Don't forget to export them!
module.exports = {
    getAllVehicles,
    addVehicle,
    updateVehicle,  
    deleteVehicle  
};

