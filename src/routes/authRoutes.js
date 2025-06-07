const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Telefon numarası ile kayıt başlatma
router.post('/register', authController.register);

// SMS doğrulama kodu kontrolü
router.post('/verify-sms', authController.verifySms);

// SMS kodunu tekrar gönderme
router.post('/resend-sms', authController.resendSms);

// Kullanıcı girişi
router.post('/login', authController.login);

// Token yenileme (ileride gerekirse)
router.post('/refresh-token', authController.refreshToken);

module.exports = router;