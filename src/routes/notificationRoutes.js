const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// GET /api/notifications
router.get('/', notificationController.getNotifications);

module.exports = router;