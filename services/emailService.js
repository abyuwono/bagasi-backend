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
  async sendOTPEmail(email, otp) {
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
        subject: "Kode OTP Verifikasi Email Bagasi",
        htmlbody: `
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
              
              <p style="color: #666; margin-bottom: 10px;">
                Kode OTP ini akan kadaluarsa dalam 5 menit.
              </p>
              
              <p style="color: #666;">
                Jika Anda tidak merasa melakukan pendaftaran di Bagasi, abaikan email ini.
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

  async sendAdCreatedEmail(user, ad, paymentUrl) {
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
        subject: "Your Jastip Request is Created - Bagasi",
        htmlbody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #34D399;">Bagasi</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Jastip Request Created</h2>
              
              <p style="color: #666; margin-bottom: 20px;">
                Your jastip request has been created successfully.
              </p>
              
              <p style="color: #666; margin-bottom: 20px;">
                Please click the link below to proceed with the payment.
              </p>
              
              <div style="background-color: #34D399; color: white; padding: 15px; border-radius: 4px; font-size: 18px; text-align: center; margin-bottom: 20px;">
                <a href="${paymentUrl}" style="color: white; text-decoration: none;">Proceed with Payment</a>
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
