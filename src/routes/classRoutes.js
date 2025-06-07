const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// Tüm sınıfları listele
router.get('/', classController.getAllClasses);

// Belirli bir sınıfı getir
router.get('/:id', classController.getClassById);

// Sınıfa ait konuları getir
router.get('/:id/topics', classController.getClassTopics);

module.exports = router;