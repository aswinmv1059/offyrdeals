const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('ADMIN'));
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/role', adminController.updateRoleValidators, validateMiddleware, adminController.setRole);
router.patch('/users/:userId/approve-vendor', adminController.approveVendorValidators, validateMiddleware, adminController.approveVendor);
router.patch('/users/:userId/block', adminController.blockUserValidators, validateMiddleware, adminController.blockUser);
router.get('/offers', adminController.getOffers);
router.get('/redemptions', adminController.getRedemptionLogs);
router.get('/system-logs', adminController.getSystemLogs);
router.get('/export/csv', adminController.exportCsv);

module.exports = router;
