const User = require('../models/User');
const ShopperAd = require('../models/ShopperAd');
const Review = require('../models/Review');
const emailService = require('./emailService');
const bcrypt = require('bcryptjs');

class UserManagementService {
  async getUserDetails(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      const [ads, reviews, stats] = await Promise.all([
        ShopperAd.find({ $or: [{ user: userId }, { selectedTraveler: userId }] })
          .sort({ createdAt: -1 })
          .limit(5),
        Review.find({ $or: [{ reviewer: userId }, { reviewee: userId }] })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('reviewer', 'username avatar')
          .populate('reviewee', 'username avatar'),
        this.getUserStats(userId)
      ]);

      return {
        user,
        recentActivity: {
          ads,
          reviews
        },
        stats
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const [adsStats, reviewsStats] = await Promise.all([
        ShopperAd.aggregate([
          {
            $match: {
              $or: [
                { user: userId },
                { selectedTraveler: userId }
              ]
            }
          },
          {
            $group: {
              _id: null,
              totalAds: { $sum: 1 },
              completedAds: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              totalEarnings: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', 'completed'] },
                    '$payment.amount',
                    0
                  ]
                }
              }
            }
          }
        ]),
        Review.aggregate([
          {
            $match: { reviewee: userId }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        ads: adsStats[0] || { totalAds: 0, completedAds: 0, totalEarnings: 0 },
        reviews: reviewsStats[0] || { averageRating: 0, totalReviews: 0 }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const allowedUpdates = [
        'username',
        'email',
        'phone',
        'avatar',
        'preferences',
        'notificationSettings'
      ];

      const updateData = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = updates[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      // Send email notification
      await emailService.sendPasswordChangeNotification(user);

      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async manageUserStatus(userId, action, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      switch (action) {
        case 'suspend':
          user.status = 'suspended';
          user.suspensionReason = reason;
          user.suspendedAt = new Date();
          break;
        case 'activate':
          user.status = 'active';
          user.suspensionReason = null;
          user.suspendedAt = null;
          break;
        case 'verify':
          user.isVerified = true;
          user.verifiedAt = new Date();
          break;
        default:
          throw new Error('Invalid action');
      }

      await user.save();

      // Send email notification
      if (action === 'suspend') {
        await emailService.sendAccountSuspensionEmail(user, reason);
      } else if (action === 'activate') {
        await emailService.sendAccountActivationEmail(user);
      } else if (action === 'verify') {
        await emailService.sendAccountVerificationEmail(user);
      }

      return user;
    } catch (error) {
      console.error('Error managing user status:', error);
      throw error;
    }
  }

  async getUserList(filters = {}, page = 1, limit = 10) {
    try {
      const query = this.buildUserQuery(filters);
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(query)
      ]);

      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const stats = await this.getUserStats(user._id);
          return {
            ...user.toObject(),
            stats
          };
        })
      );

      return {
        users: usersWithStats,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting user list:', error);
      throw error;
    }
  }

  buildUserQuery(filters) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.dateRange) {
      query.createdAt = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      };
    }

    return query;
  }

  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Archive user data
      user.status = 'deleted';
      user.deletedAt = new Date();
      await user.save();

      // Send email notification
      await emailService.sendAccountDeletionEmail(user);

      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = new UserManagementService();
