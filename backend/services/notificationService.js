const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const webpush = require('web-push');
const mongoose = require('mongoose');

class NotificationService {
  constructor() {
    // Configure web-push
    webpush.setVapidDetails(
      'mailto:support@mule-marketplace.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async createNotification(data) {
    try {
      const {
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        priority = 'normal'
      } = data;

      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        priority,
        createdAt: new Date()
      });

      await notification.save();

      // Get user's notification preferences
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Send notifications based on user preferences
      await this.sendNotifications(user, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendNotifications(user, notification) {
    const promises = [];

    // Email notification
    if (user.preferences?.notifications?.email) {
      promises.push(
        emailService.sendNotificationEmail(user.email, {
          title: notification.title,
          message: notification.message,
          type: notification.type
        })
      );
    }

    // Push notification
    if (user.preferences?.notifications?.push && user.pushSubscription) {
      promises.push(
        this.sendPushNotification(user.pushSubscription, {
          title: notification.title,
          body: notification.message,
          icon: '/logo192.png',
          badge: '/badge.png',
          data: {
            type: notification.type,
            relatedId: notification.relatedId,
            relatedType: notification.relatedType
          }
        })
      );
    }

    await Promise.all(promises);
  }

  async sendPushNotification(subscription, payload) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        await User.updateOne(
          { 'pushSubscription.endpoint': subscription.endpoint },
          { $unset: { pushSubscription: 1 } }
        );
      }
      throw error;
    }
  }

  async getNotifications(userId, query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        read,
        priority,
        startDate,
        endDate
      } = query;

      const filter = { user: userId };

      if (type) {
        filter.type = type;
      }

      if (read !== undefined) {
        filter.read = read;
      }

      if (priority) {
        filter.priority = priority;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(endDate);
        }
      }

      const [notifications, total] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Notification.countDocuments(filter)
      ]);

      return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationIds, userId) {
    try {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          user: userId
        },
        {
          $set: { read: true, readAt: new Date() }
        }
      );

      return result;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  async deleteNotifications(notificationIds, userId) {
    try {
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        user: userId
      });

      return result;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async savePushSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        pushSubscription: subscription
      });

      return { message: 'Push subscription saved successfully' };
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  // Helper methods for creating specific types of notifications
  async notifyAdStatusChange(adId, userId, status) {
    const messages = {
      accepted: 'Your ad has been accepted by a traveler',
      rejected: 'Your ad has been rejected by a traveler',
      completed: 'Your ad has been marked as completed',
      cancelled: 'Your ad has been cancelled',
      inProgress: 'Your ad is now in progress'
    };

    await this.createNotification({
      userId,
      type: 'ad_status',
      title: 'Ad Status Update',
      message: messages[status],
      relatedId: adId,
      relatedType: 'ad',
      priority: status === 'completed' ? 'high' : 'normal'
    });
  }

  async notifyNewMessage(chatId, senderId, receiverId, message) {
    await this.createNotification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message: ${message.substring(0, 50)}...`,
      relatedId: chatId,
      relatedType: 'chat'
    });
  }

  async notifyNewReview(reviewId, reviewerId, revieweeId) {
    await this.createNotification({
      userId: revieweeId,
      type: 'new_review',
      title: 'New Review',
      message: 'Someone has left you a review',
      relatedId: reviewId,
      relatedType: 'review'
    });
  }

  async notifyPaymentReceived(userId, amount, currency) {
    await this.createNotification({
      userId,
      type: 'payment',
      title: 'Payment Received',
      message: `You have received a payment of ${amount} ${currency}`,
      priority: 'high'
    });
  }

  async notifySystemUpdate(userId, title, message) {
    await this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      priority: 'low'
    });
  }
}

module.exports = new NotificationService();
