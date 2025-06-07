const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Kullanıcı profil bilgilerini getir
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        u.id,
        u.phone_number,
        u.name,
        u.surname,
        u.gender,
        u.created_at,
        c.id as class_id,
        c.name as class_name,
        c.min_class_level,
        c.max_class_level,
        e.id as exam_id,
        e.name as exam_name,
        e.exam_date
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN exams e ON u.current_exam_id = e.id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Kullanıcı bulunamadı', 404));
    }

    const user = result.rows[0];
    
    // Sınava kalan süreyi hesapla
    let daysToExam = null;
    if (user.exam_date) {
      const examDate = new Date(user.exam_date);
      const today = new Date();
      daysToExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
      if (daysToExam < 0) daysToExam = 0;
    }

    const profileData = {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name,
      surname: user.surname,
      fullName: `${user.name} ${user.surname}`,
      gender: user.gender,
      joinedAt: user.created_at,
      class: {
        id: user.class_id,
        name: user.class_name,
        minLevel: user.min_class_level,
        maxLevel: user.max_class_level
      },
      exam: user.exam_id ? {
        id: user.exam_id,
        name: user.exam_name,
        date: user.exam_date,
        daysRemaining: daysToExam
      } : null
    };

    res.status(200).json(successResponse(profileData, 'Profil bilgileri getirildi'));

  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json(errorResponse('Profil bilgileri getirilemedi'));
  }
};

// Kullanıcı profil güncelleme
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, surname, gender } = req.body;

    // Gerekli alanları kontrol et
    if (!name || !surname || !gender) {
      return res.status(400).json(errorResponse('Ad, soyad ve cinsiyet alanları gerekli', 400));
    }

    // Cinsiyet kontrolü
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json(errorResponse('Geçersiz cinsiyet değeri', 400));
    }

    const result = await query(`
      UPDATE users 
      SET name = $1, surname = $2, gender = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, surname, gender
    `, [name.trim(), surname.trim(), gender, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Kullanıcı bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Profil başarıyla güncellendi'));

  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json(errorResponse('Profil güncellenemedi'));
  }
};

// Kullanıcının sınıfını güncelle
const updateClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json(errorResponse('Sınıf ID gerekli', 400));
    }

    // Sınıfın var olup olmadığını kontrol et
    const classCheck = await query(
      'SELECT id, exam_id FROM classes WHERE id = $1 AND is_active = true',
      [classId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Geçersiz sınıf seçimi', 404));
    }

    // Kullanıcının sınıfını ve sınavını güncelle
    const result = await query(`
      UPDATE users 
      SET class_id = $1, current_exam_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, class_id, current_exam_id
    `, [classId, classCheck.rows[0].exam_id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Kullanıcı bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Sınıf başarıyla güncellendi'));

  } catch (error) {
    console.error('Sınıf güncelleme hatası:', error);
    res.status(500).json(errorResponse('Sınıf güncellenemedi'));
  }
};

// Kullanıcının genel istatistiklerini getir
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Toplam konu sayısını getir
    const totalTopicsResult = await query(`
      SELECT COUNT(*) as total_topics
      FROM topics t
      INNER JOIN classes c ON t.class_id = c.id
      INNER JOIN users u ON u.class_id = c.id
      WHERE u.id = $1 AND t.is_active = true
    `, [userId]);

    // Öğrenilen konu sayısını getir
    const learnedTopicsResult = await query(`
      SELECT COUNT(*) as learned_topics
      FROM user_topic_progress utp
      WHERE utp.user_id = $1 AND utp.status = 'learned'
    `, [userId]);

    // Devam eden konu sayısını getir
    const inProgressTopicsResult = await query(`
      SELECT COUNT(*) as in_progress_topics
      FROM user_topic_progress utp
      WHERE utp.user_id = $1 AND utp.status = 'in_progress'
    `, [userId]);

    // Ders bazında ilerleme getir
    const subjectProgressResult = await query(`
      SELECT 
        s.name as subject_name,
        COUNT(t.id) as total_topics,
        COUNT(CASE WHEN utp.status = 'learned' THEN 1 END) as learned_topics,
        COUNT(CASE WHEN utp.status = 'in_progress' THEN 1 END) as in_progress_topics
      FROM subjects s
      INNER JOIN topics t ON s.id = t.subject_id
      INNER JOIN classes c ON t.class_id = c.id
      INNER JOIN users u ON u.class_id = c.id
      LEFT JOIN user_topic_progress utp ON (t.id = utp.topic_id AND utp.user_id = u.id)
      WHERE u.id = $1 AND s.is_active = true AND t.is_active = true
      GROUP BY s.id, s.name, s.order_index
      ORDER BY s.order_index
    `, [userId]);

    const totalTopics = parseInt(totalTopicsResult.rows[0].total_topics);
    const learnedTopics = parseInt(learnedTopicsResult.rows[0].learned_topics);
    const inProgressTopics = parseInt(inProgressTopicsResult.rows[0].in_progress_topics);

    // Genel ilerleme yüzdesini hesapla
    const overallProgress = totalTopics > 0 ? Math.round((learnedTopics / totalTopics) * 100) : 0;

    // Ders bazında ilerleme yüzdelerini hesapla
    const subjectProgress = subjectProgressResult.rows.map(subject => ({
      subjectName: subject.subject_name,
      totalTopics: parseInt(subject.total_topics),
      learnedTopics: parseInt(subject.learned_topics),
      inProgressTopics: parseInt(subject.in_progress_topics),
      progressPercentage: subject.total_topics > 0 
        ? Math.round((subject.learned_topics / subject.total_topics) * 100) 
        : 0
    }));

    const stats = {
      overall: {
        totalTopics,
        learnedTopics,
        inProgressTopics,
        notStartedTopics: totalTopics - learnedTopics - inProgressTopics,
        progressPercentage: overallProgress
      },
      subjects: subjectProgress
    };

    res.status(200).json(successResponse(stats, 'Kullanıcı istatistikleri getirildi'));

  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    res.status(500).json(errorResponse('İstatistikler getirilemedi'));
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateClass,
  getUserStats
};