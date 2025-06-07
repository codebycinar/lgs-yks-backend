const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, adminAuthenticate } = require('../middleware/auth');

// Public routes (kimlik doğrulama gerektirmez)
// Konu bazında soruları listele
router.get('/topic/:topicId', questionController.getQuestionsByTopic);

// Belirli bir soruyu getir
router.get('/:id', questionController.getQuestionById);

// Konu bazlı soru sayılarını getir
router.get('/counts/by-topic', questionController.getQuestionCountsByTopic);

// Authenticated routes (kullanıcı girişi gerekir)
router.use(authenticate);

// Kullanıcıya özel konu bazlı soru sayıları
router.get('/my-counts/by-topic', questionController.getQuestionCountsByTopic);

// Admin routes (admin yetkisi gerekir)
// Not: Admin routes adminRoutes.js içinde tanımlanacak

module.exports = router;