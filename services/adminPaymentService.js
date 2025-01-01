const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const PaymentService = require('./paymentService');
const emailService = require('./emailService');

class AdminPaymentService {
  async getPaymentOverview(startDate, endDate) {
    try {
      const payments = await ShopperAd.aggregate([
        {
          $match: {
            'payment.status': { $exists: true },
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: '$payment.status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$payment.amount' }
          }
        }
      ]);

      const totalRevenue = await ShopperAd.aggregate([
        {
          $match: {
            'payment.status': 'success',
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$commission.idr' }
          }
        }
      ]);

      return {
        overview: payments,
        totalRevenue: totalRevenue[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting payment overview:', error);
      throw error;
    }
  }

  async getPaymentDetails(filters, page = 1, limit = 10) {
    try {
      const query = this.buildPaymentQuery(filters);
      
      const [payments, total] = await Promise.all([
        ShopperAd.find(query)
          .populate('user', 'username email')
          .populate('selectedTraveler', 'username email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        ShopperAd.countDocuments(query)
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  buildPaymentQuery(filters) {
    const query = {};

    if (filters.status) {
      query['payment.status'] = filters.status;
    }

    if (filters.dateRange) {
      query.createdAt = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      };
    }

    if (filters.minAmount) {
      query['payment.amount'] = { $gte: filters.minAmount };
    }

    if (filters.maxAmount) {
      query['payment.amount'] = {
        ...query['payment.amount'],
        $lte: filters.maxAmount
      };
    }

    if (filters.search) {
      query.$or = [
        { 'payment.orderId': { $regex: filters.search, $options: 'i' } },
        { productUrl: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return query;
  }

  async refundPayment(adId, reason) {
    try {
      const ad = await ShopperAd.findById(adId)
        .populate('user')
        .populate('selectedTraveler');

      if (!ad) {
        throw new Error('Ad not found');
      }

      if (ad.payment.status !== 'success') {
        throw new Error('Payment is not in a refundable state');
      }

      // Process refund through Midtrans
      await PaymentService.processRefund(ad.payment.orderId);

      // Update payment status
      ad.payment.status = 'refunded';
      ad.payment.refundReason = reason;
      ad.payment.refundDate = new Date();
      ad.status = 'cancelled';

      await ad.save();

      // Send email notifications
      await Promise.all([
        emailService.sendRefundNotification(ad.user, ad, reason),
        ad.selectedTraveler && 
          emailService.sendRefundNotificationTraveler(ad.selectedTraveler, ad, reason)
      ]);

      return ad;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async getPaymentStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const stats = await ShopperAd.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              status: '$payment.status',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 },
            amount: { $sum: '$payment.amount' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            stats: {
              $push: {
                status: '$_id.status',
                count: '$count',
                amount: '$amount'
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  async getPaymentIssues() {
    try {
      const issues = await ShopperAd.find({
        $or: [
          { 'payment.status': 'failed' },
          { 'payment.status': 'expired' },
          {
            'payment.status': 'pending',
            createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        ]
      })
        .populate('user', 'username email')
        .sort({ createdAt: -1 });

      return issues;
    } catch (error) {
      console.error('Error getting payment issues:', error);
      throw error;
    }
  }

  async resolvePaymentIssue(adId, resolution) {
    try {
      const ad = await ShopperAd.findById(adId).populate('user');
      if (!ad) {
        throw new Error('Ad not found');
      }

      ad.payment.issueResolution = resolution;
      ad.payment.issueResolvedAt = new Date();

      await ad.save();

      // Send email notification
      await emailService.sendPaymentResolutionEmail(ad.user, ad, resolution);

      return ad;
    } catch (error) {
      console.error('Error resolving payment issue:', error);
      throw error;
    }
  }
}

module.exports = new AdminPaymentService();
