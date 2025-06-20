const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { successResponse, errorResponse, calculatePagination } = require('../utils/helpers');
const { createQuestion, updateQuestion, deleteQuestion } = require('./questionController');

// Admin girişi (basit email/password kontrolü)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email ve şifre gerekli', 400));
    }

    // Env'den admin bilgilerini kontrol et
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json(errorResponse('Geçersiz admin bilgileri', 401));
    }

    // Admin token oluştur
    const token = jwt.sign(
      { 
        email, 
        role: 'admin',
        loginTime: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json(successResponse({
      token,
      admin: { email, role: 'admin' }
    }, 'Admin girişi başarılı'));

  } catch (error) {
    console.error('Admin giriş hatası:', error);
    res.status(500).json(errorResponse('Giriş işlemi başarısız'));
  }
};

// Dashboard istatistikleri
const getDashboardStats = async (req, res) => {
  try {
    // Toplam kullanıcı sayısı
    const usersResult = await query('SELECT COUNT(*) as total FROM users');
    
    // Toplam soru sayısı
    const questionsResult = await query('SELECT COUNT(*) as total FROM questions');
    
    // Toplam konu sayısı
    const topicsResult = await query('SELECT COUNT(*) as total FROM topics WHERE is_active = true');
    
    // Aktif haftalık programlar
    const programsResult = await query(`
      SELECT COUNT(*) as total 
      FROM weekly_programs 
      WHERE is_active = true
    `);

    // Son kayıt olan kullanıcılar
    const recentUsersResult = await query(`
      SELECT id, first_name, last_name, phone, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Ders bazında konu dağılımı
    const subjectStatsResult = await query(`
      SELECT 
        s.name as subject_name,
        COUNT(t.id) as topic_count,
        COUNT(q.id) as question_count
      FROM subjects s
      LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
      LEFT JOIN questions q ON t.id = q.topic_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.order_index
      ORDER BY s.order_index
    `);

    const stats = {
      summary: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalQuestions: parseInt(questionsResult.rows[0].total),
        totalTopics: parseInt(topicsResult.rows[0].total),
        activePrograms: parseInt(programsResult.rows[0].total)
      },
      recentUsers: recentUsersResult.rows,
      subjectStats: subjectStatsResult.rows
    };

    res.status(200).json(successResponse(stats, 'Dashboard istatistikleri getirildi'));

  } catch (error) {
    console.error('Dashboard istatistikleri hatası:', error);
    res.status(500).json(errorResponse('İstatistikler getirilemedi'));
  }
};

// Tüm kullanıcıları listele
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { offset, limit: parsedLimit } = calculatePagination(page, limit);

    let whereClause = '';
    let params = [parsedLimit, offset];
    let searchParams = [];

    if (search) {
      whereClause = `WHERE (u.first_name ILIKE $3 OR u.last_name ILIKE $3 OR u.phone ILIKE $3)`;
      params.push(`%${search}%`);
      searchParams = [`%${search}%`];
    }

    const result = await query(`
      SELECT 
        u.id,
        u.phone,
        u.first_name,
        u.last_name,
        u.gender,
        u.created_at,
        c.name as class_name,
        e.name as exam_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN exams e ON c.exam_id = e.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    // Toplam kullanıcı sayısı
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM users u
      ${whereClause.replace('$3', '$1')}
    `, searchParams);

    const totalUsers = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalUsers / parsedLimit);

    const response = {
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    res.status(200).json(successResponse(response, 'Kullanıcılar getirildi'));

  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json(errorResponse('Kullanıcılar getirilemedi'));
  }
};

// Kullanıcı detayını getir
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        u.*,
        c.name as class_name,
        e.name as exam_name,
        e.exam_date
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN exams e ON c.exam_id = e.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Kullanıcı bulunamadı', 404));
    }

    // Kullanıcının hedeflerini getir
    const goalsResult = await query(`
      SELECT COUNT(*) as total_goals,
             COUNT(CASE WHEN is_completed THEN 1 END) as completed_goals
      FROM goals WHERE user_id = $1
    `, [id]);

    // Kullanıcının programlarını getir
    const programsResult = await query(`
      SELECT COUNT(*) as total_programs
      FROM weekly_programs WHERE user_id = $1
    `, [id]);

    const user = {
      ...result.rows[0],
      stats: {
        totalGoals: parseInt(goalsResult.rows[0].total_goals),
        completedGoals: parseInt(goalsResult.rows[0].completed_goals),
        totalPrograms: parseInt(programsResult.rows[0].total_programs)
      }
    };

    res.status(200).json(successResponse(user, 'Kullanıcı detayı getirildi'));

  } catch (error) {
    console.error('Kullanıcı detayı getirme hatası:', error);
    res.status(500).json(errorResponse('Kullanıcı detayı getirilemedi'));
  }
};

// Sınav oluşturma
const createExam = async (req, res) => {
  try {
    const { name, examDate, targetClassLevels, prepClassLevels, description } = req.body;

    if (!name || !examDate || !targetClassLevels || !prepClassLevels) {
      return res.status(400).json(errorResponse('Gerekli alanlar eksik', 400));
    }

    const result = await query(`
      INSERT INTO exams (name, exam_date, target_class_levels, prep_class_levels, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, examDate, targetClassLevels, prepClassLevels, description]);

    res.status(201).json(successResponse(result.rows[0], 'Sınav başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Sınav oluşturma hatası:', error);
    res.status(500).json(errorResponse('Sınav oluşturulamadı'));
  }
};

// Sınıf oluşturma
const createClass = async (req, res) => {
  try {
    const { name, minClassLevel, maxClassLevel, examId } = req.body;

    if (!name || !minClassLevel) {
      return res.status(400).json(errorResponse('Gerekli alanlar eksik', 400));
    }

    const result = await query(`
      INSERT INTO classes (name, min_class_level, max_class_level, exam_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, minClassLevel, maxClassLevel || minClassLevel, examId || null]);

    res.status(201).json(successResponse(result.rows[0], 'Sınıf başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Sınıf oluşturma hatası:', error);
    res.status(500).json(errorResponse('Sınıf oluşturulamadı'));
  }
};

// Ders oluşturma
const createSubject = async (req, res) => {
  try {
    const { name, description, min_class_level, max_class_level, orderIndex } = req.body;

    if (!name) {
      return res.status(400).json(errorResponse('Ders adı gerekli', 400));
    }

    const result = await query(`
      INSERT INTO subjects (name, description, min_class_level, max_class_level, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description || '', min_class_level || 6, max_class_level || 12, orderIndex || 0]);

    res.status(201).json(successResponse(result.rows[0], 'Ders başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    res.status(500).json(errorResponse('Ders oluşturulamadı'));
  }
};

// Konu oluşturma
const createTopic = async (req, res) => {
  try {
    const { name, subject_id, class_id, parent_id, orderIndex } = req.body;

    if (!name || !subject_id || !class_id) {
      return res.status(400).json(errorResponse('Konu adı, ders ve sınıf gerekli', 400));
    }

    const result = await query(`
      INSERT INTO topics (name, subject_id, class_id, parent_id, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, subject_id, class_id, parent_id || null, orderIndex || 0]);

    res.status(201).json(successResponse(result.rows[0], 'Konu başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Konu oluşturma hatası:', error);
    res.status(500).json(errorResponse('Konu oluşturulamadı'));
  }
};

// Konu güncelleme
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject_id, class_id, parent_id, orderIndex, is_active } = req.body;

    if (!name || !subject_id || !class_id) {
      return res.status(400).json(errorResponse('Konu adı, ders ve sınıf gerekli', 400));
    }

    const result = await query(`
      UPDATE topics SET 
        name = $1, 
        subject_id = $2, 
        class_id = $3, 
        parent_id = $4, 
        order_index = $5,
        is_active = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, subject_id, class_id, parent_id || null, orderIndex || 0, is_active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Konu bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Konu başarıyla güncellendi'));

  } catch (error) {
    console.error('Konu güncelleme hatası:', error);
    res.status(500).json(errorResponse('Konu güncellenemedi'));
  }
};

// Konu silme
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      DELETE FROM topics 
      WHERE id = $1 
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Konu bulunamadı', 404));
    }

    res.status(200).json(successResponse(null, 'Konu başarıyla silindi'));

  } catch (error) {
    console.error('Konu silme hatası:', error);
    res.status(500).json(errorResponse('Konu silinemedi'));
  }
};

// Soru listesi getirme (admin paneli için)
const getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, topic_id } = req.query;
    const { offset, limit: parsedLimit } = calculatePagination(page, limit);

    let whereClause = '';
    let params = [parsedLimit, offset];

    if (topic_id) {
      whereClause = 'WHERE q.topic_id = $3';
      params.push(topic_id);
    }

    const result = await query(`
      SELECT 
        q.id,
        q.question_text,
        q.question_image_url,
        q.question_pdf_url,
        q.solution_text,
        q.solution_image_url,
        q.solution_pdf_url,
        q.has_multiple_correct,
        q.explanation,
        q.estimated_time,
        q.difficulty_level,
        q.is_active,
        q.created_at,
        t.name as topic_name,
        s.name as subject_name,
        c.name as class_name,
        json_agg(
          json_build_object(
            'id', qa.id,
            'option_letter', qa.option_letter,
            'answer_text', qa.answer_text,
            'answer_image_url', qa.answer_image_url,
            'is_correct', qa.is_correct,
            'order_index', qa.order_index
          ) ORDER BY qa.order_index
        ) as answers
      FROM questions q
      INNER JOIN topics t ON q.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      LEFT JOIN question_answers qa ON q.id = qa.question_id
      ${whereClause}
      GROUP BY q.id, t.name, s.name, c.name
      ORDER BY q.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    // Toplam soru sayısı
    const countParams = topic_id ? [topic_id] : [];
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM questions q
      ${topic_id ? 'WHERE q.topic_id = $1' : ''}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parsedLimit);

    // Process the results
    const questions = result.rows.map(q => ({
      ...q,
      answers: q.answers[0] === null ? [] : q.answers // Handle case where there are no answers
    }));

    res.status(200).json(successResponse({
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalQuestions: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Sorular başarıyla getirildi'));

  } catch (error) {
    console.error('Soruları getirme hatası:', error);
    res.status(500).json(errorResponse('Sorular getirilemedi'));
  }
};

// İçerik listeleme metodları
const getAllExams = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        exam_date,
        target_class_levels,
        prep_class_levels,
        description,
        is_active,
        created_at
      FROM exams 
      ORDER BY created_at DESC
    `);

    res.status(200).json(successResponse(result.rows || [], 'Sınavlar getirildi'));
  } catch (error) {
    console.error('Sınavları getirme hatası:', error);
    res.status(500).json(errorResponse('Sınavlar getirilemedi'));
  }
};

const getAllClasses = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.min_class_level,
        c.max_class_level,
        c.is_active,
        c.created_at,
        e.name as exam_name,
        e.exam_date
      FROM classes c
      LEFT JOIN exams e ON c.exam_id = e.id
      ORDER BY c.created_at DESC
    `);

    res.status(200).json(successResponse(result.rows || [], 'Sınıflar getirildi'));
  } catch (error) {
    console.error('Sınıfları getirme hatası:', error);
    res.status(500).json(errorResponse('Sınıflar getirilemedi'));
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        min_class_level,
        max_class_level,
        order_index,
        is_active,
        created_at
      FROM subjects 
      ORDER BY order_index ASC, created_at DESC
    `);

    res.status(200).json(successResponse(result.rows || [], 'Dersler getirildi'));
  } catch (error) {
    console.error('Dersleri getirme hatası:', error);
    res.status(500).json(errorResponse('Dersler getirilemedi'));
  }
};

const getAllTopics = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.id,
        t.name,
        t.subject_id,
        t.class_id,
        t.parent_id,
        t.order_index,
        t.is_active,
        t.created_at,
        s.name as subject_name,
        c.name as class_name,
        pt.name as parent_name
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      LEFT JOIN topics pt ON t.parent_id = pt.id
      ORDER BY s.order_index, t.order_index
    `);

    res.status(200).json(successResponse(result.rows || [], 'Konular getirildi'));
  } catch (error) {
    console.error('Konuları getirme hatası:', error);
    res.status(500).json(errorResponse('Konular getirilemedi'));
  }
};

// Sınav güncelleme
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, exam_date, target_class_levels, prep_class_levels, description, is_active } = req.body;

    const result = await query(`
      UPDATE exams 
      SET name = $1, exam_date = $2, target_class_levels = $3, prep_class_levels = $4, 
          description = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 
      RETURNING *
    `, [name, exam_date, target_class_levels, prep_class_levels, description, is_active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınav bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Sınav başarıyla güncellendi'));
  } catch (error) {
    console.error('Sınav güncelleme hatası:', error);
    res.status(500).json(errorResponse('Sınav güncellenemedi'));
  }
};

// Sınav silme
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM exams WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınav bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Sınav başarıyla silindi'));
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    res.status(500).json(errorResponse('Sınav silinemedi'));
  }
};

// Sınıf güncelleme
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_class_level, max_class_level, exam_id, is_active } = req.body;

    const result = await query(`
      UPDATE classes 
      SET name = $1, min_class_level = $2, max_class_level = $3, exam_id = $4, 
          is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 
      RETURNING *
    `, [name, min_class_level, max_class_level, exam_id || null, is_active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınıf bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Sınıf başarıyla güncellendi'));
  } catch (error) {
    console.error('Sınıf güncelleme hatası:', error);
    res.status(500).json(errorResponse('Sınıf güncellenemedi'));
  }
};

// Sınıf silme
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM classes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınıf bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Sınıf başarıyla silindi'));
  } catch (error) {
    console.error('Sınıf silme hatası:', error);
    res.status(500).json(errorResponse('Sınıf silinemedi'));
  }
};

// Ders güncelleme
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, min_class_level, max_class_level, order_index, is_active } = req.body;

    const result = await query(`
      UPDATE subjects 
      SET name = $1, description = $2, min_class_level = $3, max_class_level = $4, 
          order_index = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 
      RETURNING *
    `, [name, description || '', min_class_level, max_class_level, order_index || 0, is_active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Ders bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Ders başarıyla güncellendi'));
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    res.status(500).json(errorResponse('Ders güncellenemedi'));
  }
};

// Ders silme
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Ders bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Ders başarıyla silindi'));
  } catch (error) {
    console.error('Ders silme hatası:', error);
    res.status(500).json(errorResponse('Ders silinemedi'));
  }
};


module.exports = {
  login,
  getDashboardStats,
  getAllUsers,
  getUserById,
  getAllQuestions,
  getAllExams,
  getAllClasses,
  getAllSubjects,
  getAllTopics,
  createExam,
  createClass,
  createSubject,
  createTopic,
  updateTopic,
  deleteTopic,
  updateExam,
  deleteExam,
  updateClass,
  deleteClass,
  updateSubject,
  deleteSubject,
  createQuestion,
  updateQuestion,
  deleteQuestion
};