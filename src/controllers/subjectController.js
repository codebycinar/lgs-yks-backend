const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const getAllSubjects = async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, order_index, is_active
      FROM subjects 
      WHERE is_active = true
      ORDER BY order_index ASC
    `);

    res.status(200).json(successResponse(result.rows, 'Dersler başarıyla getirildi'));
  } catch (error) {
    console.error('Dersleri getirme hatası:', error);
    res.status(500).json(errorResponse('Dersler getirilemedi'));
  }
};

const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM subjects WHERE id = $1 AND is_active = true', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Ders bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Ders bilgisi getirildi'));
  } catch (error) {
    console.error('Ders getirme hatası:', error);
    res.status(500).json(errorResponse('Ders bilgisi getirilemedi'));
  }
};

module.exports = { getAllSubjects, getSubjectById };