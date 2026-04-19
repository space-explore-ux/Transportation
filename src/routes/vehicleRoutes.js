const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 🔒 CRITICAL: Protect ALL routes in this file with JWT verification
router.use(verifyToken);

// GET /api/vehicles (Fetches all vehicles for the logged-in agency)
router.get('/', vehicleController.getAllVehicles);

// POST /api/vehicles (Adds a new vehicle to the logged-in agency)
router.post('/', vehicleController.addVehicle);

// PUT /api/vehicles/:id (Replaces your old /edit and /Nedit)
router.put('/:id', vehicleController.updateVehicle);

// DELETE /api/vehicles/:id (Replaces your old /delete)
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;