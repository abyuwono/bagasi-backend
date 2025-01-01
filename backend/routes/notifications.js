const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await NotificationService.getNotifications(
      req.user.id,
      req.query
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get unread count
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark notifications as read
router.post('/read', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    const result = await NotificationService.markAsRead(
      notificationIds,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete notifications
router.delete('/', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    const result = await NotificationService.deleteNotifications(
      notificationIds,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Save push subscription
router.post('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ message: 'Subscription is required' });
    }

    const result = await NotificationService.savePushSubscription(
      req.user.id,
      subscription
    );
    res.json(result);
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
