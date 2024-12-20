const axios = require('axios');

const sendWhatsAppOTP = async (phoneNumber, otp) => {
  try {
    const userkey = process.env.ZENZIVA_USERKEY;
    const passkey = process.env.ZENZIVA_PASSKEY;
    const message = `Mau Dapet uang dari jual bagasi? Kode OTP Bagasi: ${otp}\n\nMasukkan kode OTP ini untuk verifikasi nomor WhatsApp Anda.\nKode OTP berlaku selama 5 menit.\n\nJangan bagikan kode ini kepada siapapun.`;

    const response = await axios.post('https://console.zenziva.net/wareguler/api/sendWA/', 
      {
        userkey,
        passkey,
        to: phoneNumber,
        message
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    throw new Error('Failed to send WhatsApp OTP');
  }
};

module.exports = {
  sendWhatsAppOTP
};
