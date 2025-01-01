const midtransClient = require('midtrans-client');
const { v4: uuidv4 } = require('uuid');
const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

class PaymentService {
  static async createPaymentToken(adId, userId) {
    try {
      const ad = await ShopperAd.findById(adId);
      const user = await User.findById(userId);

      if (!ad || !user) {
        throw new Error('Ad or user not found');
      }

      // Calculate total amount
      const totalAmount = ad.getTotalAmount();

      // Create transaction details
      const transactionDetails = {
        transaction_details: {
          order_id: `JASTIP-${uuidv4()}`,
          gross_amount: totalAmount
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: user.username,
          email: user.email,
          phone: user.phone || ''
        },
        item_details: [
          {
            id: ad._id,
            price: ad.productPriceIDR,
            quantity: 1,
            name: `Product from ${new URL(ad.productUrl).hostname}`,
            category: 'Jastip'
          },
          {
            id: 'commission',
            price: ad.commission.idr,
            quantity: 1,
            name: 'Jastip Commission',
            category: 'Fee'
          }
        ],
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/shopper-ads/${ad._id}`,
          error: `${process.env.FRONTEND_URL}/shopper-ads/${ad._id}?error=true`,
          pending: `${process.env.FRONTEND_URL}/shopper-ads/${ad._id}?pending=true`
        }
      };

      // Create Snap token
      const token = await snap.createTransaction(transactionDetails);

      // Update ad with payment details
      ad.payment = {
        orderId: transactionDetails.transaction_details.order_id,
        amount: totalAmount,
        status: 'pending'
      };
      await ad.save();

      return token;
    } catch (error) {
      console.error('Error creating payment token:', error);
      throw error;
    }
  }

  static async handleCallback(notification) {
    try {
      // Verify notification from Midtrans
      const statusResponse = await snap.transaction.notification(notification);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      console.log(`Payment notification received. Order ID: ${orderId}`);
      console.log(`Transaction status: ${transactionStatus}`);
      console.log(`Fraud status: ${fraudStatus}`);

      // Find the ad by order ID
      const ad = await ShopperAd.findOne({ 'payment.orderId': orderId });
      if (!ad) {
        throw new Error('Ad not found for order ID: ' + orderId);
      }

      let paymentStatus;
      if (transactionStatus === 'capture') {
        if (fraudStatus === 'challenge') {
          paymentStatus = 'challenge';
        } else if (fraudStatus === 'accept') {
          paymentStatus = 'success';
        }
      } else if (transactionStatus === 'settlement') {
        paymentStatus = 'success';
      } else if (transactionStatus === 'cancel' ||
                 transactionStatus === 'deny' ||
                 transactionStatus === 'expire') {
        paymentStatus = 'failed';
      } else if (transactionStatus === 'pending') {
        paymentStatus = 'pending';
      }

      // Update ad payment status
      ad.payment.status = paymentStatus;
      if (paymentStatus === 'success') {
        ad.status = 'active';
      }
      await ad.save();

      // Send email notification
      const user = await User.findById(ad.user);
      if (user) {
        let emailTemplate;
        let emailSubject;

        switch (paymentStatus) {
          case 'success':
            emailTemplate = 'payment-success';
            emailSubject = 'Payment Successful - Your Jastip Request is Now Active';
            break;
          case 'failed':
            emailTemplate = 'payment-failed';
            emailSubject = 'Payment Failed - Action Required';
            break;
          case 'pending':
            emailTemplate = 'payment-pending';
            emailSubject = 'Complete Your Payment - Jastip Request';
            break;
          default:
            emailTemplate = 'payment-update';
            emailSubject = 'Payment Status Update - Jastip Request';
        }

        await sendEmail({
          to: user.email,
          subject: emailSubject,
          template: emailTemplate,
          context: {
            username: user.username,
            orderId: orderId,
            amount: ad.payment.amount,
            productUrl: ad.productUrl,
            status: paymentStatus,
            adId: ad._id
          }
        });
      }

      return { success: true, message: 'Payment status updated' };
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error;
    }
  }

  static async getPaymentStatus(adId) {
    try {
      const ad = await ShopperAd.findById(adId);
      if (!ad || !ad.payment) {
        throw new Error('Ad or payment details not found');
      }

      // If payment is pending, check status from Midtrans
      if (ad.payment.status === 'pending') {
        const statusResponse = await snap.transaction.status(ad.payment.orderId);
        
        // Update local payment status if it has changed
        if (statusResponse.transaction_status !== ad.payment.status) {
          await this.handleCallback(statusResponse);
          // Refresh ad data
          return (await ShopperAd.findById(adId)).payment;
        }
      }

      return ad.payment;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;
