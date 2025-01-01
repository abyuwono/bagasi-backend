const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Configure Handlebars
    this.transporter.use('compile', hbs({
      viewEngine: {
        extname: '.hbs',
        layoutsDir: path.resolve('./templates/emails/'),
        defaultLayout: false,
        partialsDir: path.resolve('./templates/emails/partials/')
      },
      viewPath: path.resolve('./templates/emails/'),
      extName: '.hbs'
    }));
  }

  async sendOTPEmail(email, otp) {
    try {
      const response = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Kode OTP Verifikasi Email Bagasi',
        html: `
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
              <p> ${new Date().getFullYear()} Bagasi. Hak Cipta Dilindungi.</p>
            </div>
          </div>
        `,
      });
      return response;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  }

  async sendAdCreatedEmail(user, ad, paymentUrl) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Your Jastip Request is Created - Bagasi',
        template: 'ad-created',
        context: {
          username: user.username,
          productUrl: ad.productUrl,
          amount: ad.getTotalAmount(),
          orderId: ad.payment.orderId,
          paymentUrl,
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending ad created email:', error);
      throw error;
    }
  }

  async sendTravelerRequestEmail(user, ad, traveler) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'New Traveler Request - Bagasi',
        template: 'traveler-request',
        context: {
          username: user.username,
          travelerName: traveler.username,
          travelerRating: traveler.rating || 'N/A',
          travelerOrders: traveler.completedOrders || 0,
          productUrl: ad.productUrl,
          commission: ad.commission.idr,
          adUrl: `${process.env.FRONTEND_URL}/shopper-ads/${ad._id}`,
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending traveler request email:', error);
      throw error;
    }
  }

  async sendOrderShippedEmail(user, ad) {
    try {
      const trackingUrl = this.getTrackingUrl(ad.localCourier, ad.trackingNumber);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Your Order Has Been Shipped - Bagasi',
        template: 'order-shipped',
        context: {
          username: user.username,
          courier: ad.localCourier,
          trackingNumber: ad.trackingNumber,
          trackingUrl,
          productUrl: ad.productUrl,
          shippingAddress: ad.shippingAddress.fullAddress,
          orderId: ad.payment.orderId,
          adUrl: `${process.env.FRONTEND_URL}/shopper-ads/${ad._id}`,
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending order shipped email:', error);
      throw error;
    }
  }

  async sendOrderCompletedEmail(user, ad) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Order Completed Successfully - Bagasi',
        template: 'order-completed',
        context: {
          username: user.username,
          productUrl: ad.productUrl,
          orderId: ad.payment.orderId,
          amount: ad.getTotalAmount(),
          ratingUrl: `${process.env.FRONTEND_URL}/rate/${ad._id}`,
          createNewUrl: `${process.env.FRONTEND_URL}/shopper-ads/new`,
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending order completed email:', error);
      throw error;
    }
  }

  getTrackingUrl(courier, trackingNumber) {
    const courierUrls = {
      'JNE': `https://www.jne.co.id/id/tracking/trace/${trackingNumber}`,
      'J&T Express': `https://www.jet.co.id/track/${trackingNumber}`,
      'SiCepat': `https://www.sicepat.com/checkAwb/${trackingNumber}`,
      'AnterAja': `https://anteraja.id/tracking/${trackingNumber}`,
      'ID Express': `https://idexpress.com/tracking?awb=${trackingNumber}`,
      'Ninja Express': `https://www.ninjaxpress.co/id-id/tracking?tracking_id=${trackingNumber}`
    };

    return courierUrls[courier] || null;
  }
}

module.exports = new EmailService();
