const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuthenticate } = require('../middleware/auth');

// Admin girişi (token gerektirmez)
router.post('/login', adminController.login);

// Aşağıdaki tüm route'lar admin authentication gerektirir
router.use(adminAuthenticate);

// Dashboard istatistikleri
router.get('/dashboard', adminController.getDashboardStats);

// Kullanıcı yönetimi
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);

// İçerik yönetimi
router.post('/exams', adminController.createExam);
router.post('/classes', adminController.createClass);
router.post('/subjects', adminController.createSubject);
router.post('/topics', adminController.createTopic);

// Soru yönetimi - Admin paneli için
router.get('/questions', adminController.getAllQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

module.exports = router;