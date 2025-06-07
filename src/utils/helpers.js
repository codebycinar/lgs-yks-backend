// SMS doğrulama kodu üretme
const generateSmsCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Telefon numarası formatını standardize etme
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Türkiye telefon numarası için
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('90')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('5') && cleaned.length === 10) {
    return '+90' + cleaned;
  } else if (cleaned.startsWith('05') && cleaned.length === 11) {
    return '+90' + cleaned.substring(1);
  }
  
  return phoneNumber;
};

// Başarılı response formatı
const successResponse = (data, message = 'İşlem başarılı') => {
  return {
    success: true,
    message,
    data
  };
};

// Hata response formatı
const errorResponse = (message = 'Bir hata oluştu', statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

// Sayfalama hesaplama
const calculatePagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit: parseInt(limit) };
};

// Güvenli string çevirme
const sanitizeString = (str) => {
  if (!str) return '';
  return str.toString().trim();
};

module.exports = {
  generateSmsCode,
  formatPhoneNumber,
  successResponse,
  errorResponse,
  calculatePagination,
  sanitizeString
};