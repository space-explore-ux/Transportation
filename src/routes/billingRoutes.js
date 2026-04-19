const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', billingController.addBill);
router.get('/', billingController.getBills); // Supports ?status=Pending&start_date=...
router.put('/:id', billingController.updateBill);
router.delete('/:id', billingController.deleteBill);

module.exports = router;