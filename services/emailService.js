const { SendMailClient } = require("zeptomail");
const path = require('path');

if (!process.env.ZEPTOMAIL_TOKEN) {
  throw new Error('ZEPTOMAIL_TOKEN environment variable is required');
}

const client = new SendMailClient({
  url: "api.zeptomail.eu/",
  token: process.env.ZEPTOMAIL_TOKEN
});

class EmailService {
  async sendOTPEmail(email, otp, type = 'verification') {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: email,
              name: email.split('@')[0]
            }
          }
        ],
        subject: type === 'reset' ? "Kode OTP Reset Password Bagasi" : "Kode OTP Verifikasi Email Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">
                ${type === 'reset' ? 'Reset Password' : 'Verifikasi Email Anda'}
              </h2>
              <p style="color: #666; line-height: 1.6;">
                ${type === 'reset' 
                  ? 'Anda telah meminta untuk mereset password akun Bagasi Anda. Gunakan kode OTP berikut untuk melanjutkan proses reset password:'
                  : 'Terima kasih telah mendaftar di Bagasi. Gunakan kode OTP berikut untuk memverifikasi email Anda:'}
              </p>
              <div style="background-color: #fff; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
                <h3 style="color: #34D399; font-size: 24px; letter-spacing: 5px; margin: 0;">
                  ${otp}
                </h3>
              </div>
              <p style="color: #666; line-height: 1.6;">
                Kode OTP ini akan kadaluarsa dalam 10 menit.
                ${type === 'reset'
                  ? 'Jika Anda tidak meminta reset password, abaikan email ini.'
                  : 'Jika Anda tidak mendaftar di Bagasi, abaikan email ini.'}
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; 2024 Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      console.log('Email sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendAdCreatedEmail(ad) {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: ad.user.email,
              name: ad.user.username
            }
          }
        ],
        subject: "Iklan Jastip Anda Telah Dibuat - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Iklan Jastip Anda Telah Dibuat</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Iklan jastip Anda telah berhasil dibuat.
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Silakan tunggu traveller yang tertarik untuk membantu Anda.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendNewTravelerNotification({ to, shopperName, travelerName, productUrl, adId }) {
    try {
      const emailData = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: to,
              name: to.split('@')[0]
            }
          }
        ],
        subject: `Ada request baru dari traveller ${travelerName}`,
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Request Baru untuk Iklan Jastip Anda</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Hai ${shopperName},
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                ${travelerName} tertarik untuk membantu Anda membeli barang ini:
                <br><br>
                ${productUrl}
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Anda bisa langsung chat dengan ${travelerName} untuk mendiskusikan detail pembelian.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://market.bagasi.id/shopper-ads/${adId}" 
                   style="background-color: #34D399; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Klik di sini untuk Chat Sekarang
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Segera respon request ini agar ${travelerName} bisa membantu Anda mendapatkan barang yang diinginkan.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>
          </div>
        `
      };

      await client.sendMail(emailData);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTravelerRequestEmail(user, ad, traveler) {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: user.email,
              name: user.username
            }
          }
        ],
        subject: "New Traveler Request - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">New Traveler Request</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                You have a new traveler request from ${traveler.username}.
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Please click the link below to view the request details.
              </p>
              
              <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 18px; text-align: center; margin-bottom: 20px;">
                <a href="${process.env.FRONTEND_URL}/shopper-ads/${ad._id}" style="color: white; text-decoration: none;">View Request Details</a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendEmail({ to, subject, template, context }) {
    try {
      const templateContent = await this.getEmailTemplate(template, context);
      
      const emailData = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: to,
              name: to.split('@')[0]
            }
          }
        ],
        subject: subject,
        htmlbody: templateContent
      };

      await client.sendMail(emailData);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async getEmailTemplate(template, context) {
    let content = '';
    switch (template) {
      case 'traveler-request':
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">New Request for Your Shopping Ad</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Hi ${context.shopperName},
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                ${context.travelerName} has requested to help you with your shopping request for:
                <br><br>
                ${context.productUrl}
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Please check your Bagasi account to review the request and chat with the traveler.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `;
        break;
      // Add more templates as needed
      default:
        throw new Error(`Email template '${template}' not found`);
    }
    return content;
  }

  getTrackingUrl(courier, trackingNumber) {
    const courierMap = {
      'jne': `https://www.jne.co.id/id/tracking/trace/${trackingNumber}`,
      'jnt': `https://www.jet.co.id/track/${trackingNumber}`,
      'sicepat': `https://www.sicepat.com/tracking/${trackingNumber}`,
      'anteraja': `https://anteraja.id/tracking/${trackingNumber}`,
      'pos': `https://www.posindonesia.co.id/tracking/${trackingNumber}`
    };
    return courierMap[courier.toLowerCase()] || '#';
  }

  async sendOrderShippedEmail(user, ad) {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: user.email,
              name: user.username
            }
          }
        ],
        subject: "Your Order Has Been Shipped - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Order Shipped</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Your order has been shipped successfully.
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Please click the link below to track your order.
              </p>
              
              <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 18px; text-align: center; margin-bottom: 20px;">
                <a href="${this.getTrackingUrl(ad.localCourier, ad.trackingNumber)}" style="color: white; text-decoration: none;">Track Your Order</a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendOrderCompletedEmail(user, ad) {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: user.email,
              name: user.username
            }
          }
        ],
        subject: "Order Completed Successfully - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Order Completed</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Your order has been completed successfully.
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Please click the link below to rate your experience.
              </p>
              
              <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 18px; text-align: center; margin-bottom: 20px;">
                <a href="${process.env.FRONTEND_URL}/rate/${ad._id}" style="color: white; text-decoration: none;">Rate Your Experience</a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendNewMessageEmail(recipient, sender, adTitle) {
    try {
      const template = {
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: recipient.email,
              name: recipient.username
            }
          }
        ],
        subject: "New Message in Your Chat - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">New Message Received</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                You have received a new message from ${sender.username} regarding the item: ${adTitle}
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Login to Bagasi to view and respond to your messages.
              </p>
              
              <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 18px; text-align: center; margin-bottom: 20px;">
                <a href="https://market.bagasi.id" style="color: white; text-decoration: none;">View Messages</a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Bagasi. All rights reserved.</p>
            </div>
          </div>
        `
      };

      const response = await client.sendMail(template);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendOrderCancelledEmailToShopper(user, ad) {
    try {
      await client.sendMail({
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: user.email,
              name: user.username
            }
          }
        ],
        subject: "Pesanan Jastip Dibatalkan - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Pesanan Jastip Dibatalkan</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Halo ${user.username},
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Pesanan jastip Anda untuk produk <strong>${ad.productUrl}</strong> telah dibatalkan.
              </p>
              
              <p style="color: #666;">
                Jika Anda masih membutuhkan produk ini, silakan buat pesanan baru atau cari jastiper lain yang tersedia.
              </p>
              
              <p style="color: #666;">
                Terima kasih telah menggunakan layanan Bagasi.
              </p>
            </div>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending order cancelled email to shopper:', error);
      throw error;
    }
  }

  async sendOrderCancelledEmailToTraveler(user, ad) {
    try {
      await client.sendMail({
        from: {
          address: process.env.EMAIL_FROM || "noreply@bagasi.id",
          name: "Bagasi"
        },
        to: [
          {
            email_address: {
              address: user.email,
              name: user.username
            }
          }
        ],
        subject: "Pesanan Jastip Dibatalkan - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Pesanan Jastip Dibatalkan</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Halo ${user.username},
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Pesanan jastip untuk produk <strong>${ad.productUrl}</strong> telah dibatalkan.
              </p>
              
              <p style="color: #666;">
                Anda dapat mencari pesanan jastip lain yang tersedia di platform kami.
              </p>
              
              <p style="color: #666;">
                Terima kasih telah menggunakan layanan Bagasi.
              </p>
            </div>
          </div>
        `
      });
    } catch (error) {
      console.error('Error sending order cancelled email to traveler:', error);
      throw error;
    }
  }
};

module.exports = new EmailService();
