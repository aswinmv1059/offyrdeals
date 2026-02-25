const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('USER', 'ADMIN', 'VENDOR'));
router.get('/offers', userController.listOffersValidators, validateMiddleware, userController.listOffers);
router.post('/create-payment-order', userController.createPaymentOrderValidators, validateMiddleware, userController.createPaymentOrder);
router.post('/verify-payment', userController.verifyPaymentValidators, validateMiddleware, userController.verifyPaymentAndIssueCoupon);
router.post('/redeem', userController.redeemOfferValidators, validateMiddleware, userController.redeemOffer);
router.get('/coupons', userController.getMyCoupons);
router.get('/logs', userController.getLogs);

module.exports = router;
