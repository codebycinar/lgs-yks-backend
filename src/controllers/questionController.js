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
        qc.id,
        qc.question_image_url,
        qc.question_pdf_url,
        qc.solution_image_url,
        qc.solution_pdf_url,
        qc.source_name,
        qc.created_at,
        t.name as topic_name,
        s.name as subject_name
      FROM question_contents qc
      INNER JOIN topics t ON qc.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      WHERE qc.topic_id = $1
      ORDER BY qc.created_at DESC
      LIMIT $2 OFFSET $3
    `, [topicId, parsedLimit, offset]);

    // Toplam soru sayısını getir
    const countResult = await query(
      'SELECT COUNT(*) as total FROM question_contents WHERE topic_id = $1',
      [topicId]
    );

    const totalQuestions = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalQuestions / parsedLimit);

    const response = {
      questions: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalQuestions,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      topic: topicCheck.rows[0]
    };

    res.status(200).json(successResponse(response, 'Sorular başarıyla getirildi'));

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
        qc.id,
        qc.question_image_url,
        qc.question_pdf_url,
        qc.solution_image_url,
        qc.solution_pdf_url,
        qc.source_name,
        qc.created_at,
        qc.updated_at,
        t.id as topic_id,
        t.name as topic_name,
        s.id as subject_id,
        s.name as subject_name,
        c.id as class_id,
        c.name as class_name
      FROM question_contents qc
      INNER JOIN topics t ON qc.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      WHERE qc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    const question = {
      ...result.rows[0],
      hasImages: !!(result.rows[0].question_image_url || result.rows[0].solution_image_url),
      hasPdfs: !!(result.rows[0].question_pdf_url || result.rows[0].solution_pdf_url)
    };

    res.status(200).json(successResponse(question, 'Soru detayı getirildi'));

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
      questionImageUrl, 
      questionPdfUrl, 
      solutionImageUrl, 
      solutionPdfUrl, 
      sourceName 
    } = req.body;

    // Gerekli alanları kontrol et
    if (!topicId) {
      return res.status(400).json(errorResponse('Konu ID gerekli', 400));
    }

    // En az bir soru içeriği olmalı
    if (!questionImageUrl && !questionPdfUrl) {
      return res.status(400).json(errorResponse('En az bir soru içeriği (resim veya PDF) gerekli', 400));
    }

    // Konunun var olup olmadığını kontrol et
    const topicCheck = await query(
      'SELECT id FROM topics WHERE id = $1 AND is_active = true',
      [topicId]
    );

    if (topicCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Geçersiz konu seçimi', 404));
    }

    const result = await query(`
      INSERT INTO question_contents (
        topic_id, 
        question_image_url, 
        question_pdf_url, 
        solution_image_url, 
        solution_pdf_url, 
        source_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      topicId, 
      questionImageUrl || null, 
      questionPdfUrl || null, 
      solutionImageUrl || null, 
      solutionPdfUrl || null, 
      sourceName || null
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
      questionImageUrl, 
      questionPdfUrl, 
      solutionImageUrl, 
      solutionPdfUrl, 
      sourceName 
    } = req.body;

    // Sorunun var olup olmadığını kontrol et
    const questionCheck = await query('SELECT id FROM question_contents WHERE id = $1', [id]);
    if (questionCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    // Güncelleme verilerini hazırla
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (topicId !== undefined) {
      const topicCheck = await query(
        'SELECT id FROM topics WHERE id = $1 AND is_active = true',
        [topicId]
      );
      if (topicCheck.rows.length === 0) {
        return res.status(404).json(errorResponse('Geçersiz konu seçimi', 404));
      }
      updates.push(`topic_id = $${paramIndex}`);
      params.push(topicId);
      paramIndex++;
    }

    if (questionImageUrl !== undefined) {
      updates.push(`question_image_url = $${paramIndex}`);
      params.push(questionImageUrl || null);
      paramIndex++;
    }

    if (questionPdfUrl !== undefined) {
      updates.push(`question_pdf_url = $${paramIndex}`);
      params.push(questionPdfUrl || null);
      paramIndex++;
    }

    if (solutionImageUrl !== undefined) {
      updates.push(`solution_image_url = $${paramIndex}`);
      params.push(solutionImageUrl || null);
      paramIndex++;
    }

    if (solutionPdfUrl !== undefined) {
      updates.push(`solution_pdf_url = $${paramIndex}`);
      params.push(solutionPdfUrl || null);
      paramIndex++;
    }

    if (sourceName !== undefined) {
      updates.push(`source_name = $${paramIndex}`);
      params.push(sourceName || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json(errorResponse('Güncellenecek alan bulunamadı', 400));
    }

    params.push(id);

    const result = await query(`
      UPDATE question_contents 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

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

    const result = await query(
      'DELETE FROM question_contents WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Soru bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Soru başarıyla silindi'));

  } catch (error) {
    console.error('Soru silme hatası:', error);
    res.status(500).json(errorResponse('Soru silinemedi'));
  }
};

// Konu bazlı soru sayısını getir
const getQuestionCountsByTopic = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    let baseQuery = `
      SELECT 
        t.id as topic_id,
        t.name as topic_name,
        s.name as subject_name,
        COUNT(qc.id) as question_count
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN question_contents qc ON t.id = qc.topic_id
      WHERE t.is_active = true AND s.is_active = true
    `;

    // Eğer kullanıcı varsa, sadece kendi sınıfına ait konuları getir
    if (userId) {
      baseQuery += `
        AND t.class_id IN (
          SELECT class_id FROM users WHERE id = $1
        )
      `;
    }

    baseQuery += `
      GROUP BY t.id, t.name, s.name, s.order_index, t.order_index
      ORDER BY s.order_index, t.order_index
    `;

    const params = userId ? [userId] : [];
    const result = await query(baseQuery, params);

    res.status(200).json(successResponse(result.rows, 'Konu bazlı soru sayıları getirildi'));

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