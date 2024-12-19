const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.eu/";
const token = "Zoho-enczapikey yA6KbHsLvwTxxW0GSURp3ZHZ+toxrKE/3n6zsyznfcQheYTi3aE6gRZsItu5J2TT0dDS6K4HbtkZL9q5vY1XfsM1MYRRKJTGTuv4P2uV48xh8ciEYNYjgpmuArgXFKNJdRIkDCk5QfkjWA==";

const client = new SendMailClient({ url, token });

const sendOTPEmail = async (email, otp) => {
  try {
    const response = await client.sendMail({
      "from": {
        "address": "noreply-otp@bagasi.id",
        "name": "OTP Bagasi"
      },
      "to": [{
        "email_address": {
          "address": email,
          "name": email.split('@')[0]
        }
      }],
      "subject": "Kode OTP Verifikasi Email Bagasi",
      "htmlbody": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #34D399;">Bagasi</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verifikasi Email Anda</h2>
            
            <p style="color: #666; margin-bottom: 20px;">
              Gunakan kode OTP berikut untuk menyelesaikan proses pendaftaran Anda:
            </p>
            
            <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 24px; text-align: center; letter-spacing: 5px; margin-bottom: 20px;">
              ${otp}
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Kode OTP ini akan kadaluarsa dalam 5 menit.
              Jangan bagikan kode ini kepada siapapun.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p>© ${new Date().getFullYear()} Bagasi. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      `,
    });
    return response;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail
};
