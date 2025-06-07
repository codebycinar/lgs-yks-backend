const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Kullanıcının kendi profil bilgilerini getir
router.get('/me', userController.getProfile);

// Kullanıcı profil bilgilerini güncelle
router.put('/me', userController.updateProfile);

// Kullanıcının sınıf değiştirme
router.put('/me/class', userController.updateClass);

// Kullanıcının genel istatistiklerini getir
router.get('/me/stats', userController.getUserStats);

module.exports = router;