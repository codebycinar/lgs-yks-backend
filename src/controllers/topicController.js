const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Tüm konuları getir (admin paneli için)
const getAllTopics = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.id,
        t.name,
        t.order_index,
        t.parent_id,
        s.name as subject_name,
        c.name as class_name,
        c.level as class_level
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      WHERE t.is_active = true
      ORDER BY s.order_index, c.level, t.order_index
    `);

    res.status(200).json(successResponse(result.rows, 'Tüm konular getirildi'));
  } catch (error) {
    console.error('Konuları getirme hatası:', error);
    res.status(500).json(errorResponse('Konular getirilemedi'));
  }
};

const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        t.id,
        t.name,
        t.order_index,
        t.parent_id,
        s.name as subject_name,
        c.name as class_name
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      INNER JOIN classes c ON t.class_id = c.id
      WHERE t.id = $1 AND t.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Konu bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Konu bilgisi getirildi'));
  } catch (error) {
    console.error('Konu getirme hatası:', error);
    res.status(500).json(errorResponse('Konu bilgisi getirilemedi'));
  }
};

const getSubtopics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT id, name, order_index
      FROM topics
      WHERE parent_id = $1 AND is_active = true
      ORDER BY order_index ASC
    `, [id]);

    res.status(200).json(successResponse(result.rows, 'Alt konular getirildi'));
  } catch (error) {
    console.error('Alt konuları getirme hatası:', error);
    res.status(500).json(errorResponse('Alt konular getirilemedi'));
  }
};

module.exports = { getAllTopics, getTopicById, getSubtopics };