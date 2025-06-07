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
      FROM programs 
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
      LEFT JOIN exams e ON u.current_exam_id = e.id
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

    if (!name || !minClassLevel || !maxClassLevel) {
      return res.status(400).json(errorResponse('Gerekli alanlar eksik', 400));
    }

    const result = await query(`
      INSERT INTO classes (name, min_class_level, max_class_level, exam_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, minClassLevel, maxClassLevel, examId]);

    res.status(201).json(successResponse(result.rows[0], 'Sınıf başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Sınıf oluşturma hatası:', error);
    res.status(500).json(errorResponse('Sınıf oluşturulamadı'));
  }
};

// Ders oluşturma
const createSubject = async (req, res) => {
  try {
    const { name, orderIndex } = req.body;

    if (!name) {
      return res.status(400).json(errorResponse('Ders adı gerekli', 400));
    }

    const result = await query(`
      INSERT INTO subjects (name, order_index)
      VALUES ($1, $2)
      RETURNING *
    `, [name, orderIndex || 0]);

    res.status(201).json(successResponse(result.rows[0], 'Ders başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    res.status(500).json(errorResponse('Ders oluşturulamadı'));
  }
};

// Konu oluşturma
const createTopic = async (req, res) => {
  try {
    const { name, subjectId, classId, parentId, orderIndex } = req.body;

    if (!name || !subjectId || !classId) {
      return res.status(400).json(errorResponse('Konu adı, ders ve sınıf gerekli', 400));
    }

    const result = await query(`
      INSERT INTO topics (name, subject_id, class_id, parent_id, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, subjectId, classId, parentId, orderIndex || 0]);

    res.status(201).json(successResponse(result.rows[0], 'Konu başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Konu oluşturma hatası:', error);
    res.status(500).json(errorResponse('Konu oluşturulamadı'));
  }
};

module.exports = {
  login,
  getDashboardStats,
  getAllUsers,
  getUserById,
  createExam,
  createClass,
  createSubject,
  createTopic,
  createQuestion,
  updateQuestion,
  deleteQuestion
};