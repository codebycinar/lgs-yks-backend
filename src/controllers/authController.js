const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const smsService = require('../services/smsService');
const { generateSmsCode } = require('../utils/helpers');

// Telefon numarası ile kayıt işlemi
const register = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Telefon numarası formatını kontrol et
    if (!phoneNumber || !/^(\+90|0)?[5][0-9]{9}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli bir telefon numarası giriniz' 
      });
    }

    // Telefon numarasını standart formata getir
    const formattedPhone = phoneNumber.replace(/^(\+90|0)/, '+90');

    // Kullanıcının daha önce kayıt olup olmadığını kontrol et
    const existingUser = await query(
      'SELECT id FROM users WHERE phone_number = $1',
      [formattedPhone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Bu telefon numarası ile zaten kayıt oluşturulmuş'
      });
    }

    // SMS doğrulama kodu oluştur
    const verificationCode = generateSmsCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    // Eski doğrulama kodlarını sil
    await query(
      'DELETE FROM sms_verifications WHERE phone_number = $1',
      [formattedPhone]
    );

    // Yeni doğrulama kodu kaydet
    await query(
      'INSERT INTO sms_verifications (phone_number, verification_code, expires_at) VALUES ($1, $2, $3)',
      [formattedPhone, verificationCode, expiresAt]
    );

    // SMS gönder (şimdilik console'a yazdırıyoruz)
    console.log(`SMS Kodu (${formattedPhone}): ${verificationCode}`);
    // await smsService.sendSms(formattedPhone, `LGS Platform doğrulama kodunuz: ${verificationCode}`);

    res.status(200).json({
      success: true,
      message: 'Doğrulama kodu telefon numaranıza gönderildi',
      data: { phoneNumber: formattedPhone }
    });

  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt işlemi sırasında bir hata oluştu'
    });
  }
};

// SMS doğrulama
const verifySms = async (req, res) => {
  try {
    const { phoneNumber, verificationCode, name, surname, classId, gender } = req.body;

    // Gerekli alanları kontrol et
    if (!phoneNumber || !verificationCode || !name || !surname || !classId || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanları doldurunuz'
      });
    }

    const formattedPhone = phoneNumber.replace(/^(\+90|0)/, '+90');

    // Doğrulama kodunu kontrol et
    const verification = await query(
      'SELECT * FROM sms_verifications WHERE phone_number = $1 AND verification_code = $2 AND expires_at > NOW() AND is_verified = false',
      [formattedPhone, verificationCode]
    );

    if (verification.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş doğrulama kodu'
      });
    }

    // Sınıf bilgisini kontrol et
    const classInfo = await query('SELECT id, exam_id FROM classes WHERE id = $1', [classId]);
    if (classInfo.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sınıf seçimi'
      });
    }

    // Kullanıcıyı oluştur
    const newUser = await query(
      'INSERT INTO users (phone_number, name, surname, class_id, current_exam_id, gender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [formattedPhone, name, surname, classId, classInfo.rows[0].exam_id, gender]
    );

    // Doğrulamayı işaretle
    await query(
      'UPDATE sms_verifications SET is_verified = true WHERE id = $1',
      [verification.rows[0].id]
    );

    // JWT token oluştur
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Kayıt başarıyla tamamlandı',
      data: {
        user: {
          id: newUser.rows[0].id,
          phoneNumber: newUser.rows[0].phone_number,
          name: newUser.rows[0].name,
          surname: newUser.rows[0].surname,
          classId: newUser.rows[0].class_id,
          gender: newUser.rows[0].gender
        },
        token
      }
    });

  } catch (error) {
    console.error('SMS doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Doğrulama işlemi sırasında bir hata oluştu'
    });
  }
};

// SMS kodunu tekrar gönderme
const resendSms = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası gerekli'
      });
    }

    const formattedPhone = phoneNumber.replace(/^(\+90|0)/, '+90');

    // Son gönderilen kodu kontrol et (spam önleme için)
    const lastSms = await query(
      'SELECT created_at FROM sms_verifications WHERE phone_number = $1 ORDER BY created_at DESC LIMIT 1',
      [formattedPhone]
    );

    if (lastSms.rows.length > 0) {
      const timeDiff = Date.now() - new Date(lastSms.rows[0].created_at).getTime();
      if (timeDiff < 60000) { // 1 dakika
        return res.status(429).json({
          success: false,
          message: 'Yeni kod gönderebilmek için 1 dakika bekleyiniz'
        });
      }
    }

    // Yeni kod oluştur
    const verificationCode = generateSmsCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Eski kodları sil ve yeni kod kaydet
    await query('DELETE FROM sms_verifications WHERE phone_number = $1', [formattedPhone]);
    await query(
      'INSERT INTO sms_verifications (phone_number, verification_code, expires_at) VALUES ($1, $2, $3)',
      [formattedPhone, verificationCode, expiresAt]
    );

    console.log(`SMS Kodu (${formattedPhone}): ${verificationCode}`);

    res.status(200).json({
      success: true,
      message: 'Yeni doğrulama kodu gönderildi'
    });

  } catch (error) {
    console.error('SMS tekrar gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'SMS gönderim hatası'
    });
  }
};

// Kullanıcı girişi
const login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası gerekli'
      });
    }

    const formattedPhone = phoneNumber.replace(/^(\+90|0)/, '+90');

    // Kullanıcıyı bul
    const user = await query(
      'SELECT * FROM users WHERE phone_number = $1',
      [formattedPhone]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı'
      });
    }

    // SMS kodu gönder
    const verificationCode = generateSmsCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query('DELETE FROM sms_verifications WHERE phone_number = $1', [formattedPhone]);
    await query(
      'INSERT INTO sms_verifications (phone_number, verification_code, expires_at) VALUES ($1, $2, $3)',
      [formattedPhone, verificationCode, expiresAt]
    );

    console.log(`Giriş SMS Kodu (${formattedPhone}): ${verificationCode}`);

    res.status(200).json({
      success: true,
      message: 'Giriş doğrulama kodu telefon numaranıza gönderildi',
      data: { phoneNumber: formattedPhone }
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş işlemi sırasında bir hata oluştu'
    });
  }
};

// Token yenileme (placeholder)
const refreshToken = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Token yenileme henüz implementasyonu yapılmadı'
  });
};

module.exports = {
  register,
  verifySms,
  resendSms,
  login,
  refreshToken
};