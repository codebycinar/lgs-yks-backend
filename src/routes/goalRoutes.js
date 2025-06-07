const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

// Kullanıcının hedeflerini listele
router.get('/', goalController.getUserGoals);

// Yeni hedef oluştur
router.post('/', goalController.createGoal);

// Hedef güncelle
router.put('/:id', goalController.updateGoal);

// Hedefi tamamla
router.put('/:id/complete', goalController.completeGoal);

// Hedef sil
router.delete('/:id', goalController.deleteGoal);

module.exports = router;