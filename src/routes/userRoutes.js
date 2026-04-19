const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// All routes in this file require the user to be logged in
router.use(verifyToken);

// --- Admin Only Routes ---
// The requireAdmin middleware blocks standard employees from accessing these
router.get('/', requireAdmin, userController.getEmployees);
router.post('/', requireAdmin, userController.addEmployee);
router.put('/:id', requireAdmin, userController.updateEmployee);
router.delete('/:id', requireAdmin, userController.deleteEmployee);

// --- Universal Routes ---
// Any logged-in user can change their own password
router.put('/password/change', userController.changePassword);

module.exports = router;