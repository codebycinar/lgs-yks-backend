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
router.get('/exams', adminController.getAllExams);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);
router.get('/classes', adminController.getAllClasses);
router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);
router.get('/subjects', adminController.getAllSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);
router.get('/topics', adminController.getAllTopics);
router.post('/topics', adminController.createTopic);
router.put('/topics/:id', adminController.updateTopic);
router.delete('/topics/:id', adminController.deleteTopic);

// Soru yönetimi - Admin paneli için
router.get('/questions', adminController.getAllQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

module.exports = router;