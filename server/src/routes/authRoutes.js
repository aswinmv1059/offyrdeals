const express = require('express');
const rateLimit = require('express-rate-limit');
const validateMiddleware = require('../middleware/validateMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
});

router.post('/register', authController.registerValidators, validateMiddleware, authController.register);
router.post('/verify-otp', authController.verifyOtpValidators, validateMiddleware, authController.verifyOtp);
router.post('/resend-otp', authController.resendOtpValidators, validateMiddleware, authController.resendOtp);
router.post('/login', loginLimiter, authController.loginValidators, validateMiddleware, authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
