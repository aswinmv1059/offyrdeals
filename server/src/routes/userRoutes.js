const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateMiddleware = require('../middleware/validateMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('USER', 'ADMIN', 'VENDOR'));
router.get('/offers', userController.listOffersValidators, validateMiddleware, userController.listOffers);
router.post('/redeem', userController.redeemOfferValidators, validateMiddleware, userController.redeemOffer);
router.get('/coupons', userController.getMyCoupons);
router.get('/logs', userController.getLogs);

module.exports = router;
