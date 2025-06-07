const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// Kullanıcının haftalık programlarını listele
router.get('/', programController.getUserPrograms);

// Yeni haftalık program oluştur
router.post('/', programController.createProgram);

// Program detayını getir
router.get('/:id', programController.getProgramById);

// Program güncelle
router.put('/:id', programController.updateProgram);

// Program sil
router.delete('/:id', programController.deleteProgram);

// Program görevi ekleme
router.post('/:id/tasks', programController.addTask);

// Program görevini güncelle
router.put('/:id/tasks/:taskId', programController.updateTask);

// Program görevini tamamla
router.put('/:id/tasks/:taskId/complete', programController.completeTask);

// Program görevini sil
router.delete('/:id/tasks/:taskId', programController.deleteTask);

module.exports = router;