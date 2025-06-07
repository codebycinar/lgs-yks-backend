const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendSMS = async (phoneNumber, message) => {
  try {
    if (!client) {
      console.log('SMS Service not configured. Would send:', { phoneNumber, message });
      return { success: true, mock: true };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendSMS,
  generateVerificationCode
};