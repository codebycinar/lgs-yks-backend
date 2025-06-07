const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Kullanıcının hedeflerini getir
const getUserGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // 'completed', 'active' veya tümü

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];

    if (status === 'completed') {
      whereClause += ' AND is_completed = true';
    } else if (status === 'active') {
      whereClause += ' AND is_completed = false';
    }

    const result = await query(`
      SELECT 
        id,
        description,
        target_date,
        is_completed,
        completed_at,
        created_at
      FROM goals
      ${whereClause}
      ORDER BY 
        CASE WHEN is_completed THEN 1 ELSE 0 END,
        target_date ASC NULLS LAST,
        created_at DESC
    `, params);

    // Hedefleri kategorize et
    const goals = result.rows.map(goal => ({
      ...goal,
      isOverdue: goal.target_date && new Date(goal.target_date) < new Date() && !goal.is_completed,
      daysRemaining: goal.target_date && !goal.is_completed 
        ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.status(200).json(successResponse(goals, 'Hedefler başarıyla getirildi'));

  } catch (error) {
    console.error('Hedefleri getirme hatası:', error);
    res.status(500).json(errorResponse('Hedefler getirilemedi'));
  }
};

// Yeni hedef oluştur
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, targetDate } = req.body;

    // Gerekli alanları kontrol et
    if (!description || description.trim().length === 0) {
      return res.status(400).json(errorResponse('Hedef açıklaması gerekli', 400));
    }

    if (description.trim().length > 500) {
      return res.status(400).json(errorResponse('Hedef açıklaması çok uzun (max 500 karakter)', 400));
    }

    // Tarih kontrolü
    let parsedTargetDate = null;
    if (targetDate) {
      parsedTargetDate = new Date(targetDate);
      if (isNaN(parsedTargetDate.getTime())) {
        return res.status(400).json(errorResponse('Geçersiz hedef tarihi', 400));
      }
      if (parsedTargetDate < new Date()) {
        return res.status(400).json(errorResponse('Hedef tarihi geçmişte olamaz', 400));
      }
    }

    const result = await query(`
      INSERT INTO goals (user_id, description, target_date)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, description.trim(), parsedTargetDate]);

    res.status(201).json(successResponse(result.rows[0], 'Hedef başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Hedef oluşturma hatası:', error);
    res.status(500).json(errorResponse('Hedef oluşturulamadı'));
  }
};

// Hedef güncelle
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, targetDate } = req.body;

    // Hedefin kullanıcıya ait olduğunu kontrol et
    const goalCheck = await query(
      'SELECT id, is_completed FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (goalCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Hedef bulunamadı', 404));
    }

    if (goalCheck.rows[0].is_completed) {
      return res.status(400).json(errorResponse('Tamamlanmış hedefler düzenlenemez', 400));
    }

    // Güncelleme verilerini hazırla
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        return res.status(400).json(errorResponse('Hedef açıklaması gerekli', 400));
      }
      if (description.trim().length > 500) {
        return res.status(400).json(errorResponse('Hedef açıklaması çok uzun (max 500 karakter)', 400));
      }
      updates.push(`description = $${paramIndex}`);
      params.push(description.trim());
      paramIndex++;
    }

    if (targetDate !== undefined) {
      if (targetDate === null) {
        updates.push(`target_date = NULL`);
      } else {
        const parsedTargetDate = new Date(targetDate);
        if (isNaN(parsedTargetDate.getTime())) {
          return res.status(400).json(errorResponse('Geçersiz hedef tarihi', 400));
        }
        if (parsedTargetDate < new Date()) {
          return res.status(400).json(errorResponse('Hedef tarihi geçmişte olamaz', 400));
        }
        updates.push(`target_date = $${paramIndex}`);
        params.push(parsedTargetDate);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json(errorResponse('Güncellenecek alan bulunamadı', 400));
    }

    params.push(id, userId);

    const result = await query(`
      UPDATE goals 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `, params);

    res.status(200).json(successResponse(result.rows[0], 'Hedef başarıyla güncellendi'));

  } catch (error) {
    console.error('Hedef güncelleme hatası:', error);
    res.status(500).json(errorResponse('Hedef güncellenemedi'));
  }
};

// Hedefi tamamla
const completeGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(`
      UPDATE goals 
      SET 
        is_completed = true, 
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND is_completed = false
      RETURNING *
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Hedef bulunamadı veya zaten tamamlanmış', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Hedef başarıyla tamamlandı'));

  } catch (error) {
    console.error('Hedef tamamlama hatası:', error);
    res.status(500).json(errorResponse('Hedef tamamlanamadı'));
  }
};

// Hedef sil
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Hedef bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Hedef başarıyla silindi'));

  } catch (error) {
    console.error('Hedef silme hatası:', error);
    res.status(500).json(errorResponse('Hedef silinemedi'));
  }
};

module.exports = {
  getUserGoals,
  createGoal,
  updateGoal,
  completeGoal,
  deleteGoal
};