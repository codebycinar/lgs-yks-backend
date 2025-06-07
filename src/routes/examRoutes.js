const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Aktif sınavları listele
router.get('/', examController.getAllActiveExams);

// Belirli bir sınavı getir
router.get('/:id', examController.getExamById);

// Sınava ait sınıfları getir
router.get('/:id/classes', examController.getExamClasses);

module.exports = router;