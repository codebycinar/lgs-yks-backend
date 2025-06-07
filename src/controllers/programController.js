const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Kullanıcının haftalık programlarını getir
const getUserPrograms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT 
        wp.id,
        wp.title,
        wp.start_date,
        wp.end_date,
        wp.created_at,
        COUNT(pt.id) as total_tasks,
        COUNT(CASE WHEN pt.is_completed THEN 1 END) as completed_tasks
      FROM weekly_programs wp
      LEFT JOIN program_tasks pt ON wp.id = pt.weekly_program_id
      WHERE wp.user_id = $1
      GROUP BY wp.id, wp.title, wp.start_date, wp.end_date, wp.created_at
      ORDER BY wp.start_date DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // İlerleme yüzdesini hesapla
    const programs = result.rows.map(program => ({
      ...program,
      completionPercentage: program.total_tasks > 0 
        ? Math.round((program.completed_tasks / program.total_tasks) * 100)
        : 0,
      isCurrentWeek: isCurrentWeek(program.start_date, program.end_date)
    }));

    res.status(200).json(successResponse(programs, 'Haftalık programlar getirildi'));

  } catch (error) {
    console.error('Programları getirme hatası:', error);
    res.status(500).json(errorResponse('Programlar getirilemedi'));
  }
};

// Yeni haftalık program oluştur
const createProgram = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, startDate, endDate } = req.body;

    // Gerekli alanları kontrol et
    if (!title || !startDate || !endDate) {
      return res.status(400).json(errorResponse('Başlık, başlangıç ve bitiş tarihi gerekli', 400));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json(errorResponse('Geçersiz tarih formatı', 400));
    }

    if (start >= end) {
      return res.status(400).json(errorResponse('Bitiş tarihi başlangıç tarihinden sonra olmalı', 400));
    }

    // Haftalık program süresi kontrolü (max 14 gün)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
      return res.status(400).json(errorResponse('Program süresi 14 günü geçemez', 400));
    }

    // Çakışan program kontrolü
    const conflictCheck = await query(`
      SELECT id FROM weekly_programs 
      WHERE user_id = $1 
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [userId, start, end]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json(errorResponse('Bu tarih aralığında zaten bir program var', 409));
    }

    const result = await query(`
      INSERT INTO weekly_programs (user_id, title, start_date, end_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, title.trim(), start, end]);

    res.status(201).json(successResponse(result.rows[0], 'Haftalık program başarıyla oluşturuldu'));

  } catch (error) {
    console.error('Program oluşturma hatası:', error);
    res.status(500).json(errorResponse('Program oluşturulamadı'));
  }
};

// Program detayını getir
const getProgramById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const programResult = await query(`
      SELECT * FROM weekly_programs
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (programResult.rows.length === 0) {
      return res.status(404).json(errorResponse('Program bulunamadı', 404));
    }

    const tasksResult = await query(`
      SELECT 
        pt.*,
        t.name as topic_name,
        s.name as subject_name
      FROM program_tasks pt
      LEFT JOIN topics t ON pt.topic_id = t.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE pt.weekly_program_id = $1
      ORDER BY pt.task_date ASC, pt.created_at ASC
    `, [id]);

    const program = {
      ...programResult.rows[0],
      tasks: tasksResult.rows,
      totalTasks: tasksResult.rows.length,
      completedTasks: tasksResult.rows.filter(task => task.is_completed).length
    };

    program.completionPercentage = program.totalTasks > 0 
      ? Math.round((program.completedTasks / program.totalTasks) * 100)
      : 0;

    res.status(200).json(successResponse(program, 'Program detayı getirildi'));

  } catch (error) {
    console.error('Program detayı getirme hatası:', error);
    res.status(500).json(errorResponse('Program detayı getirilemedi'));
  }
};

// Program güncelle
const updateProgram = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, startDate, endDate } = req.body;

    // Program kontrolü
    const programCheck = await query(
      'SELECT * FROM weekly_programs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (programCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Program bulunamadı', 404));
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json(errorResponse('Başlık boş olamaz', 400));
      }
      updates.push(`title = $${paramIndex}`);
      params.push(title.trim());
      paramIndex++;
    }

    if (startDate !== undefined && endDate !== undefined) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json(errorResponse('Geçersiz tarih formatı', 400));
      }

      if (start >= end) {
        return res.status(400).json(errorResponse('Bitiş tarihi başlangıç tarihinden sonra olmalı', 400));
      }

      updates.push(`start_date = $${paramIndex}`);
      params.push(start);
      paramIndex++;

      updates.push(`end_date = $${paramIndex}`);
      params.push(end);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json(errorResponse('Güncellenecek alan bulunamadı', 400));
    }

    params.push(id, userId);

    const result = await query(`
      UPDATE weekly_programs 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `, params);

    res.status(200).json(successResponse(result.rows[0], 'Program başarıyla güncellendi'));

  } catch (error) {
    console.error('Program güncelleme hatası:', error);
    res.status(500).json(errorResponse('Program güncellenemedi'));
  }
};

// Program sil
const deleteProgram = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM weekly_programs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Program bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id }, 'Program başarıyla silindi'));

  } catch (error) {
    console.error('Program silme hatası:', error);
    res.status(500).json(errorResponse('Program silinemedi'));
  }
};

// Program görevi ekleme
const addTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, taskDate, topicId } = req.body;

    // Program kontrolü
    const programCheck = await query(
      'SELECT * FROM weekly_programs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (programCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Program bulunamadı', 404));
    }

    if (!description || !taskDate) {
      return res.status(400).json(errorResponse('Açıklama ve tarih gerekli', 400));
    }

    const task_date = new Date(taskDate);
    if (isNaN(task_date.getTime())) {
      return res.status(400).json(errorResponse('Geçersiz tarih formatı', 400));
    }

    // Görev tarihinin program aralığında olduğunu kontrol et
    const program = programCheck.rows[0];
    if (task_date < new Date(program.start_date) || task_date > new Date(program.end_date)) {
      return res.status(400).json(errorResponse('Görev tarihi program aralığında olmalı', 400));
    }

    // Konu kontrolü (opsiyonel)
    if (topicId) {
      const topicCheck = await query(
        'SELECT id FROM topics WHERE id = $1 AND is_active = true',
        [topicId]
      );
      if (topicCheck.rows.length === 0) {
        return res.status(404).json(errorResponse('Geçersiz konu seçimi', 404));
      }
    }

    const result = await query(`
      INSERT INTO program_tasks (weekly_program_id, description, task_date, topic_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, description.trim(), task_date, topicId || null]);

    res.status(201).json(successResponse(result.rows[0], 'Görev başarıyla eklendi'));

  } catch (error) {
    console.error('Görev ekleme hatası:', error);
    res.status(500).json(errorResponse('Görev eklenemedi'));
  }
};

// Program görevini güncelle
const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, taskId } = req.params;
    const { description, taskDate, topicId } = req.body;

    // Görevin kullanıcıya ait olduğunu kontrol et
    const taskCheck = await query(`
      SELECT pt.*, wp.user_id 
      FROM program_tasks pt
      JOIN weekly_programs wp ON pt.weekly_program_id = wp.id
      WHERE pt.id = $1 AND wp.id = $2 AND wp.user_id = $3
    `, [taskId, id, userId]);

    if (taskCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Görev bulunamadı', 404));
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json(errorResponse('Açıklama boş olamaz', 400));
      }
      updates.push(`description = $${paramIndex}`);
      params.push(description.trim());
      paramIndex++;
    }

    if (taskDate !== undefined) {
      const task_date = new Date(taskDate);
      if (isNaN(task_date.getTime())) {
        return res.status(400).json(errorResponse('Geçersiz tarih formatı', 400));
      }
      updates.push(`task_date = $${paramIndex}`);
      params.push(task_date);
      paramIndex++;
    }

    if (topicId !== undefined) {
      if (topicId === null) {
        updates.push(`topic_id = NULL`);
      } else {
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
    }

    if (updates.length === 0) {
      return res.status(400).json(errorResponse('Güncellenecek alan bulunamadı', 400));
    }

    params.push(taskId);

    const result = await query(`
      UPDATE program_tasks 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    res.status(200).json(successResponse(result.rows[0], 'Görev başarıyla güncellendi'));

  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    res.status(500).json(errorResponse('Görev güncellenemedi'));
  }
};

// Program görevini tamamla
const completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, taskId } = req.params;

    const result = await query(`
      UPDATE program_tasks 
      SET 
        is_completed = true, 
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      FROM weekly_programs wp
      WHERE program_tasks.id = $1 
        AND program_tasks.weekly_program_id = wp.id
        AND wp.id = $2 
        AND wp.user_id = $3
        AND program_tasks.is_completed = false
      RETURNING program_tasks.*
    `, [taskId, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Görev bulunamadı veya zaten tamamlanmış', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Görev başarıyla tamamlandı'));

  } catch (error) {
    console.error('Görev tamamlama hatası:', error);
    res.status(500).json(errorResponse('Görev tamamlanamadı'));
  }
};

// Program görevini sil
const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, taskId } = req.params;

    const result = await query(`
      DELETE FROM program_tasks 
      USING weekly_programs wp
      WHERE program_tasks.id = $1 
        AND program_tasks.weekly_program_id = wp.id
        AND wp.id = $2 
        AND wp.user_id = $3
      RETURNING program_tasks.id
    `, [taskId, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Görev bulunamadı', 404));
    }

    res.status(200).json(successResponse({ id: taskId }, 'Görev başarıyla silindi'));

  } catch (error) {
    console.error('Görev silme hatası:', error);
    res.status(500).json(errorResponse('Görev silinemedi'));
  }
};

// Yardımcı fonksiyon: Mevcut hafta kontrolü
const isCurrentWeek = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

module.exports = {
  getUserPrograms,
  createProgram,
  getProgramById,
  updateProgram,
  deleteProgram,
  addTask,
  updateTask,
  completeTask,
  deleteTask
};