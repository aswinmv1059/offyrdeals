const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const vendorController = require('../controllers/vendorController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('VENDOR', 'ADMIN'));
router.get('/offers', vendorController.getVendorOffers);
router.post('/offers', vendorController.offerValidators, validateMiddleware, vendorController.createOffer);
router.put('/offers/:offerId', vendorController.updateOfferValidators, validateMiddleware, vendorController.updateOffer);
router.post('/confirm-redemption', vendorController.confirmRedemptionValidators, validateMiddleware, vendorController.confirmRedemption);

module.exports = router;
