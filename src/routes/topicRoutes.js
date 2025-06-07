const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// Tüm konuları getir (admin paneli için)
router.get('/', topicController.getAllTopics);

// Belirli bir konuyu getir
router.get('/:id', topicController.getTopicById);

// Konuya ait alt konuları getir
router.get('/:id/subtopics', topicController.getSubtopics);

module.exports = router;