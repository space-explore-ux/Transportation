const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// POST /api/reports/generate
router.post('/generate', reportController.generateReport);

module.exports = router;