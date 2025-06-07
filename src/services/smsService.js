const twilio = require('twilio');

// Twilio client oluşturma - geliştirme ortamında sadece geçerli kimlik bilgileri varsa
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    process.env.NODE_ENV === 'production') {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// SMS gönderme fonksiyonu
const sendSms = async (phoneNumber, message) => {
  try {
    // Geliştirme ortamında gerçek SMS göndermeyelim
    if (process.env.NODE_ENV === 'development' || !client) {
      console.log(`📱 SMS Gönderildi (${phoneNumber}): ${message}`);
      return { success: true, mock: true };
    }

    // Production'da gerçek SMS gönder
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`✅ SMS başarıyla gönderildi: ${result.sid}`);
    return { success: true, sid: result.sid };

  } catch (error) {
    console.error('❌ SMS gönderim hatası:', error);
    throw new Error('SMS gönderilemedi: ' + error.message);
  }
};

// Doğrulama SMS'i formatı
const sendVerificationSms = async (phoneNumber, code) => {
  const message = `LGS Platform doğrulama kodunuz: ${code}

Bu kodu kimse ile paylaşmayın.
Kod 10 dakika geçerlidir.`;

  return await sendSms(phoneNumber, message);
};

// Hoş geldin SMS'i
const sendWelcomeSms = async (phoneNumber, name) => {
  const message = `Merhaba ${name}! 

LGS Platform'a hoş geldin. Başarılarının devamını dileriz! 🎯📚`;

  return await sendSms(phoneNumber, message);
};

module.exports = {
  sendSms,
  sendVerificationSms,
  sendWelcomeSms
};