const express = require('express');
const router = express.Router();
const { uploadQuestionFiles, uploadSingle, getFileUrl } = require('../services/fileUploadService');
const { adminAuthenticate } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

// Admin yetkisi gerekli
router.use(adminAuthenticate);

// Soru dosyaları yükleme (çoklu dosya)
router.post('/question-files', (req, res) => {
  uploadQuestionFiles(req, res, (err) => {
    if (err) {
      console.error('Dosya yükleme hatası:', err);
      return res.status(400).json(errorResponse(err.message, 400));
    }

    const files = req.files;
    const uploadedFiles = {};

    // Yüklenen dosyaları organize et
    if (files.questionImage) {
      uploadedFiles.questionImageUrl = getFileUrl(req, `questions/${files.questionImage[0].filename}`);
    }
    
    if (files.questionPdf) {
      uploadedFiles.questionPdfUrl = getFileUrl(req, `questions/${files.questionPdf[0].filename}`);
    }
    
    if (files.solutionImage) {
      uploadedFiles.solutionImageUrl = getFileUrl(req, `solutions/${files.solutionImage[0].filename}`);
    }
    
    if (files.solutionPdf) {
      uploadedFiles.solutionPdfUrl = getFileUrl(req, `solutions/${files.solutionPdf[0].filename}`);
    }

    if (Object.keys(uploadedFiles).length === 0) {
      return res.status(400).json(errorResponse('En az bir dosya yüklenmeli', 400));
    }

    res.status(200).json(successResponse(uploadedFiles, 'Dosyalar başarıyla yüklendi'));
  });
});

// Tek dosya yükleme
router.post('/single', (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('Dosya yükleme hatası:', err);
      return res.status(400).json(errorResponse(err.message, 400));
    }

    if (!req.file) {
      return res.status(400).json(errorResponse('Dosya seçilmedi', 400));
    }

    const fileUrl = getFileUrl(req, req.file.filename);

    res.status(200).json(successResponse({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl
    }, 'Dosya başarıyla yüklendi'));
  });
});

module.exports = router;