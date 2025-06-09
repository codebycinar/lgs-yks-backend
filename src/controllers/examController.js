const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Aktif sınavları getir
const getAllActiveExams = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        exam_date,
        target_class_levels,
        prep_class_levels,
        description,
        is_active
      FROM exams 
      WHERE is_active = true
      ORDER BY exam_date ASC
    `);

    res.status(200).json(successResponse(result.rows || [], 'Sınavlar getirildi'));
  } catch (error) {
    console.error('Sınavları getirme hatası:', error);
    res.status(500).json(errorResponse('Sınavlar getirilemedi'));
  }
};

// ID'ye göre sınav getir
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        id,
        name,
        exam_date,
        target_class_level,
        preparation_class_level,
        description,
        is_active,
        created_at
      FROM exams 
      WHERE id = $1 AND is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınav bulunamadı', 404));
    }

    const exam = result.rows[0];
    const examDate = new Date(exam.exam_date);
    const today = new Date();
    const daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    const examWithCountdown = {
      ...exam,
      days_remaining: daysRemaining > 0 ? daysRemaining : 0,
      is_exam_passed: daysRemaining <= 0
    };

    res.status(200).json(successResponse(examWithCountdown, 'Sınav bilgisi getirildi'));

  } catch (error) {
    console.error('Sınav getirme hatası:', error);
    res.status(500).json(errorResponse('Sınav bilgisi getirilemedi'));
  }
};

// Sınava ait sınıfları getir
const getExamClasses = async (req, res) => {
  try {
    const { id } = req.params;

    // Önce sınavın var olup olmadığını kontrol et
    const examCheck = await query('SELECT id FROM exams WHERE id = $1 AND is_active = true', [id]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınav bulunamadı', 404));
    }

    const result = await query(`
      SELECT 
        id,
        name,
        level,
        is_active
      FROM classes 
      WHERE exam_id = $1 AND is_active = true
      ORDER BY level ASC
    `, [id]);

    res.status(200).json(successResponse(result.rows, 'Sınava ait sınıflar getirildi'));

  } catch (error) {
    console.error('Sınav sınıflarını getirme hatası:', error);
    res.status(500).json(errorResponse('Sınav sınıfları getirilemedi'));
  }
};

module.exports = {
  getAllActiveExams,
  getExamById,
  getExamClasses
};