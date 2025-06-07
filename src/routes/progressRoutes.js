const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

// Kullanıcının tüm konu ilerlemelerini getir
router.get('/', progressController.getUserProgress);

// Belirli bir konunun ilerleme durumunu getir
router.get('/topic/:topicId', progressController.getTopicProgress);

// Konu ilerleme durumunu güncelle
router.put('/topic/:topicId', progressController.updateTopicProgress);

// Birden fazla konunun ilerlemesini toplu güncelle
router.put('/bulk', progressController.bulkUpdateProgress);

module.exports = router;