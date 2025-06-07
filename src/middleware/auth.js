const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token bulunamadı.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, phone_number, name, surname, class_id, gender FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token. Kullanıcı bulunamadı.'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token.'
    });
  }
};

const adminAuthenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token bulunamadı.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Erişim reddedildi. Admin yetkisi gerekli.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token.'
    });
  }
};

module.exports = {
  authenticate,
  adminAuthenticate
};