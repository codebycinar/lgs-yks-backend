const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// Tüm aktif sınıfları getir
const getAllClasses = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.min_class_level,
        c.max_class_level,
        c.is_active,
        e.name as exam_name,
        e.exam_date
      FROM classes c
      LEFT JOIN exams e ON c.exam_id = e.id
      WHERE c.is_active = true
      ORDER BY c.min_class_level ASC
    `);

    res.status(200).json(successResponse(result.rows, 'Sınıflar başarıyla getirildi'));

  } catch (error) {
    console.error('Sınıfları getirme hatası:', error);
    res.status(500).json(errorResponse('Sınıflar getirilemedi'));
  }
};

// ID'ye göre sınıf getir
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.min_class_level,
        c.max_class_level,
        c.is_active,
        e.id as exam_id,
        e.name as exam_name,
        e.exam_date,
        e.description as exam_description
      FROM classes c
      LEFT JOIN exams e ON c.exam_id = e.id
      WHERE c.id = $1 AND c.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınıf bulunamadı', 404));
    }

    res.status(200).json(successResponse(result.rows[0], 'Sınıf bilgisi getirildi'));

  } catch (error) {
    console.error('Sınıf getirme hatası:', error);
    res.status(500).json(errorResponse('Sınıf bilgisi getirilemedi'));
  }
};

// Sınıfa ait konuları getir (hiyerarşik yapıda)
const getClassTopics = async (req, res) => {
  try {
    const { id } = req.params;

    // Önce sınıfın var olup olmadığını kontrol et
    const classCheck = await query('SELECT id FROM classes WHERE id = $1', [id]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json(errorResponse('Sınıf bulunamadı', 404));
    }

    // Dersleri ve ana konuları getir
    const subjectsResult = await query(`
      SELECT DISTINCT
        s.id as subject_id,
        s.name as subject_name,
        s.order_index as subject_order
      FROM subjects s
      INNER JOIN topics t ON s.id = t.subject_id
      WHERE t.class_id = $1 AND s.is_active = true
      ORDER BY s.order_index ASC
    `, [id]);

    // Her ders için konuları getir
    const topicsData = [];
    
    for (const subject of subjectsResult.rows) {
      // Ana konuları getir (parent_id null olanlar)
      const mainTopics = await query(`
        SELECT 
          id,
          name,
          order_index,
          parent_id
        FROM topics
        WHERE subject_id = $1 AND class_id = $2 AND parent_id IS NULL AND is_active = true
        ORDER BY order_index ASC
      `, [subject.subject_id, id]);

      // Her ana konu için alt konuları getir
      const topicsWithSubtopics = [];
      
      for (const mainTopic of mainTopics.rows) {
        const subtopics = await query(`
          SELECT 
            id,
            name,
            order_index,
            parent_id
          FROM topics
          WHERE parent_id = $1 AND is_active = true
          ORDER BY order_index ASC
        `, [mainTopic.id]);

        topicsWithSubtopics.push({
          ...mainTopic,
          subtopics: subtopics.rows
        });
      }

      topicsData.push({
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        subject_order: subject.subject_order,
        topics: topicsWithSubtopics
      });
    }

    res.status(200).json(successResponse(topicsData, 'Sınıf konuları başarıyla getirildi'));

  } catch (error) {
    console.error('Sınıf konularını getirme hatası:', error);
    res.status(500).json(errorResponse('Sınıf konuları getirilemedi'));
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  getClassTopics
};