const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Review = require('../models/Review');

class AnalyticsService {
  async getOverviewStats(startDate, endDate) {
    try {
      const [
        totalAds,
        totalUsers,
        totalRevenue,
        completedOrders
      ] = await Promise.all([
        ShopperAd.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        User.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        ShopperAd.aggregate([
          {
            $match: {
              'payment.status': 'success',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$payment.amount' }
            }
          }
        ]),
        ShopperAd.countDocuments({
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        })
      ]);

      return {
        totalAds,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        completedOrders
      };
    } catch (error) {
      console.error('Error getting overview stats:', error);
      throw error;
    }
  }

  async getAdMetrics(startDate, endDate) {
    try {
      const adMetrics = await ShopperAd.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            totalAds: { $sum: 1 },
            pendingAds: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            activeAds: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedAds: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'success'] },
                  '$payment.amount',
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return adMetrics;
    } catch (error) {
      console.error('Error getting ad metrics:', error);
      throw error;
    }
  }

  async getUserMetrics(startDate, endDate) {
    try {
      const [userGrowth, userTypes] = await Promise.all([
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              newUsers: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return { userGrowth, userTypes };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      throw error;
    }
  }

  async getEngagementMetrics(startDate, endDate) {
    try {
      const [chatMetrics, reviewMetrics] = await Promise.all([
        Chat.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              totalMessages: { $sum: 1 },
              uniqueChats: { $addToSet: '$adId' }
            }
          },
          {
            $project: {
              _id: 1,
              totalMessages: 1,
              uniqueChats: { $size: '$uniqueChats' }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Review.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$rating' }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      return { chatMetrics, reviewMetrics };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  async getPopularDestinations(startDate, endDate) {
    try {
      const destinations = await ShopperAd.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$destinationCountry',
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'success'] },
                  '$payment.amount',
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return destinations;
    } catch (error) {
      console.error('Error getting popular destinations:', error);
      throw error;
    }
  }

  async getProductMetrics(startDate, endDate) {
    try {
      const products = await ShopperAd.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$productUrl',
            count: { $sum: 1 },
            totalValue: { $sum: '$productPrice.idr' },
            avgPrice: { $avg: '$productPrice.idr' },
            products: {
              $push: {
                name: '$productName',
                price: '$productPrice.idr'
              }
            }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 20
        }
      ]);

      return products;
    } catch (error) {
      console.error('Error getting product metrics:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(startDate, endDate) {
    try {
      const metrics = await ShopperAd.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgProcessingTime: {
              $avg: {
                $subtract: [
                  { $ifNull: ['$shippedAt', new Date()] },
                  '$createdAt'
                ]
              }
            },
            avgDeliveryTime: {
              $avg: {
                $subtract: [
                  { $ifNull: ['$completedAt', new Date()] },
                  { $ifNull: ['$shippedAt', new Date()] }
                ]
              }
            },
            successRate: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      return metrics[0] || {
        avgProcessingTime: 0,
        avgDeliveryTime: 0,
        successRate: 0
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
