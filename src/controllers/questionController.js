const { query } = require('../config/database');
const { successResponse, errorResponse, calculatePagination } = require('../utils/helpers');

// Konu bazında soruları listele
const getQuestionsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { offset, limit: parsedLimit } = calculatePagination(page, limit);

    // Konunun var olup olmadığını kontrol et
    const topicCheck = await query(
      'SELECT id, name FROM topics WHERE id = $1 AND is_active = true',
      [topicId]
    );

    if (topicCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Konu bulunamadı', 404));
    }

    // Soruları getir
    const result = await query(`
      SELECT 
        q.id,
        q.question_text,
        q.question_image_url,
        q.question_pdf_url,
        q.solution_text,
        q.solution_image_url,
        q.solution_pdf_url,
        q.correct_answers,
        q.explanation,
        q.keywords,
        q.estimated_time,
        q.difficulty_level,
        q.is_active,
        q.created_at,
        t.name as topic_name,
        s.name as subject_name
      FROM questions q
      INNER JOIN topics t ON q.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      WHERE q.topic_id = $1
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3
    `, [topicId, parsedLimit, offset]);

    // Toplam soru sayısını getir
    const countResult = await query(
      'SELECT COUNT(*) as total FROM questions WHERE topic_id = $1',
      [topicId]
    );

    const totalQuestions = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalQuestions / parsedLimit);

    const response = {
      questions: result.rows,
      topic: topicCheck.rows[0],
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalQuestions,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    res.status(200).json(successResponse(response, 'Konu soruları getirildi'));

  } catch (error) {
    console.error('Soruları getirme hatası:', error);
    res.status(500).json(errorResponse('Sorular getirilemedi'));
  }
};

// Belirli bir soruyu getir
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        q.*,
        t.name as topic_name,
        s.name as subject_name,
        c.name as class_name
      FROM questions q
      INNER JOIN topics t ON q.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      WHERE q.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Soru detayı getirildi'));

  } catch (error) {
    console.error('Soru detayı getirme hatası:', error);
    res.status(500).json(errorResponse('Soru detayı getirilemedi'));
  }
};

// Soru oluşturma (admin için)
const createQuestion = async (req, res) => {
  try {
    const { 
      topicId, 
      difficultyLevel, 
      questionText, 
      questionImageUrl, 
      questionPdfUrl,
      solutionText,
      solutionImageUrl, 
      solutionPdfUrl,
      correctAnswers, 
      explanation, 
      keywords, 
      estimatedTime 
    } = req.body;

    if (!topicId || !difficultyLevel || !correctAnswers || correctAnswers.length === 0) {
      return res.status(400).json(errorResponse('Gerekli alanlar eksik: topicId, difficultyLevel, correctAnswers', 400));
    }

    // En az bir içerik türü olmalı (metin, görsel, ya da PDF)
    if (!questionText && !questionImageUrl && !questionPdfUrl) {
      return res.status(400).json(errorResponse('En az bir içerik türü gerekli: metin, görsel veya PDF', 400));
    }

    const result = await query(`
      INSERT INTO questions (
        topic_id,
        difficulty_level,
        question_text,
        question_image_url,
        question_pdf_url,
        solution_text,
        solution_image_url,
        solution_pdf_url,
        correct_answers,
        explanation,
        keywords,
        estimated_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      topicId, 
      difficultyLevel, 
      questionText || null, 
      questionImageUrl || null, 
      questionPdfUrl || null,
      solutionText || null,
      solutionImageUrl || null, 
      solutionPdfUrl || null,
      JSON.stringify(correctAnswers), 
      explanation || null, 
      JSON.stringify(keywords || []), 
      estimatedTime || null
    ]);

    res.status(201).json(successResponse(result.rows[0], 'Soru başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Soru oluşturma hatası:', error);
    res.status(500).json(errorResponse('Soru oluşturulamadı'));
  }
};

// Soru güncelleme (admin için)
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      topicId, 
      difficultyLevel, 
      questionText, 
      questionImageUrl, 
      questionPdfUrl,
      solutionText,
      solutionImageUrl, 
      solutionPdfUrl,
      correctAnswers, 
      explanation, 
      keywords, 
      estimatedTime 
    } = req.body;

    if (!topicId || !difficultyLevel || !correctAnswers || correctAnswers.length === 0) {
      return res.status(400).json(errorResponse('Gerekli alanlar eksik: topicId, difficultyLevel, correctAnswers', 400));
    }

    // En az bir içerik türü olmalı (metin, görsel, ya da PDF)
    if (!questionText && !questionImageUrl && !questionPdfUrl) {
      return res.status(400).json(errorResponse('En az bir içerik türü gerekli: metin, görsel veya PDF', 400));
    }

    const result = await query(`
      UPDATE questions SET
        topic_id = $1,
        difficulty_level = $2,
        question_text = $3,
        question_image_url = $4,
        question_pdf_url = $5,
        solution_text = $6,
        solution_image_url = $7,
        solution_pdf_url = $8,
        correct_answers = $9,
        explanation = $10,
        keywords = $11,
        estimated_time = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      topicId, 
      difficultyLevel, 
      questionText || null, 
      questionImageUrl || null, 
      questionPdfUrl || null,
      solutionText || null,
      solutionImageUrl || null, 
      solutionPdfUrl || null,
      JSON.stringify(correctAnswers), 
      explanation || null, 
      JSON.stringify(keywords || []), 
      estimatedTime || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Soru başarıyla güncellendi'));

  } catch (error) {
    console.error('Soru güncelleme hatası:', error);
    res.status(500).json(errorResponse('Soru güncellenemedi'));
  }
};

// Soru silme (admin için)
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      DELETE FROM questions 
      WHERE id = $1 
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    res.status(200).json(successResponse(null, 'Soru başarıyla silindi'));

  } catch (error) {
    console.error('Soru silme hatası:', error);
    res.status(500).json(errorResponse('Soru silinemedi'));
  }
};

// Konu bazında soru sayılarını getir
const getQuestionCountsByTopic = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.id as topic_id,
        t.name as topic_name,
        s.name as subject_name,
        c.name as class_name,
        COUNT(q.id) as question_count
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      LEFT JOIN questions q ON t.id = q.topic_id
      WHERE t.is_active = true
      GROUP BY t.id, t.name, s.name, c.name, s.order_index, c.level, t.order_index
      ORDER BY s.order_index, c.level, t.order_index
    `);

    res.status(200).json(successResponse(result.rows, 'Konu bazında soru sayıları getirildi'));

  } catch (error) {
    console.error('Soru sayıları getirme hatası:', error);
    res.status(500).json(errorResponse('Soru sayıları getirilemedi'));
  }
};

module.exports = {
  getQuestionsByTopic,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionCountsByTopic
};