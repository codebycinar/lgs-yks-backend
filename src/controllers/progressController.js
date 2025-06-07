const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Kullanıcının genel ilerlemesini getir
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        t.id as topic_id,
        t.name as topic_name,
        s.name as subject_name,
        COALESCE(utp.status, 'not_started') as status,
        utp.updated_at as progress_updated_at
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      INNER JOIN users u ON u.class_id = c.id
      LEFT JOIN user_topic_progress utp ON (t.id = utp.topic_id AND utp.user_id = u.id)
      WHERE u.id = $1 AND t.is_active = true
      ORDER BY s.order_index, t.order_index
    `, [userId]);

    res.status(200).json(successResponse(result.rows, 'Kullanıcı ilerlemesi getirildi'));
  } catch (error) {
    console.error('İlerleme getirme hatası:', error);
    res.status(500).json(errorResponse('İlerleme bilgileri getirilemedi'));
  }
};

// Belirli bir konunun ilerleme durumunu getir
const getTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;

    const result = await query(`
      SELECT 
        utp.status,
        utp.updated_at,
        t.name as topic_name,
        s.name as subject_name
      FROM user_topic_progress utp
      INNER JOIN topics t ON utp.topic_id = t.id
      INNER JOIN subjects s ON t.subject_id = s.id
      WHERE utp.user_id = $1 AND utp.topic_id = $2
    `, [userId, topicId]);

    if (result.rows.length === 0) {
      return res.status(200).json(successResponse({
        status: 'not_started',
        updated_at: null,
        topic_name: null,
        subject_name: null
      }, 'Konu henüz başlatılmamış'));
    }

    res.status(200).json(successResponse(result.rows[0], 'Konu ilerlemesi getirildi'));
  } catch (error) {
    console.error('Konu ilerlemesi getirme hatası:', error);
    res.status(500).json(errorResponse('Konu ilerlemesi getirilemedi'));
  }
};

// Konu ilerleme durumunu güncelle
const updateTopicProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    const { status } = req.body;

    // Status kontrolü
    const validStatuses = ['not_started', 'in_progress', 'learned', 'needs_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(errorResponse('Geçersiz durum değeri', 400));
    }

    // Konunun var olup olmadığını ve kullanıcının sınıfına ait olup olmadığını kontrol et
    const topicCheck = await query(`
      SELECT t.id
      FROM topics t
      INNER JOIN classes c ON t.class_id = c.id
      INNER JOIN users u ON u.class_id = c.id
      WHERE t.id = $1 AND u.id = $2 AND t.is_active = true
    `, [topicId, userId]);

    if (topicCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Konu bulunamadı veya erişim yetkiniz yok', 404));
    }

    // İlerleme kaydını güncelle veya oluştur
    const result = await query(`
      INSERT INTO user_topic_progress (user_id, topic_id, status, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, topicId, status]);

    res.status(200).json(successResponse(result.rows[0], 'Konu ilerlemesi güncellendi'));
  } catch (error) {
    console.error('İlerleme güncelleme hatası:', error);
    res.status(500).json(errorResponse('İlerleme güncellenemedi'));
  }
};

// Birden fazla konunun ilerlemesini toplu güncelle
const bulkUpdateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json(errorResponse('Güncelleme verisi gerekli', 400));
    }

    const validStatuses = ['not_started', 'in_progress', 'learned', 'needs_review'];
    
    // Güncellemeleri işle
    const results = [];
    for (const update of updates) {
      const { topicId, status } = update;
      
      if (!validStatuses.includes(status)) {
        continue; // Geçersiz durum değerlerini atla
      }

      // Konunun kontrolü ve güncelleme
      const topicCheck = await query(`
        SELECT t.id
        FROM topics t
        INNER JOIN classes c ON t.class_id = c.id
        INNER JOIN users u ON u.class_id = c.id
        WHERE t.id = $1 AND u.id = $2 AND t.is_active = true
      `, [topicId, userId]);

      if (topicCheck.rows.length > 0) {
        const result = await query(`
          INSERT INTO user_topic_progress (user_id, topic_id, status, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, topic_id)
          DO UPDATE SET 
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [userId, topicId, status]);
        
        results.push(result.rows[0]);
      }
    }

    res.status(200).json(successResponse(results, `${results.length} konu ilerlemesi güncellendi`));
  } catch (error) {
    console.error('Toplu ilerleme güncelleme hatası:', error);
    res.status(500).json(errorResponse('Toplu güncelleme başarısız'));
  }
};

module.exports = {
  getUserProgress,
  getTopicProgress,
  updateTopicProgress,
  bulkUpdateProgress
};