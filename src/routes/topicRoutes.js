const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// Belirli bir konuyu getir
router.get('/:id', topicController.getTopicById);

// Konuya ait alt konuları getir
router.get('/:id/subtopics', topicController.getSubtopics);

module.exports = router;