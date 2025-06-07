const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

// Tüm aktif dersleri listele
router.get('/', subjectController.getAllSubjects);

// Belirli bir dersi getir
router.get('/:id', subjectController.getSubjectById);

module.exports = router;