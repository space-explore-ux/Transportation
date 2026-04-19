const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/status', whatsappController.getStatus); // Frontend calls this on page load
router.post('/send', whatsappController.sendBulkWhatsApp); // Frontend calls this on button click

module.exports = router;