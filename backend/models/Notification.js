const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'ad_status',
      'new_message',
      'new_review',
      'payment',
      'system',
      'reminder',
      'alert'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedType'
  },
  relatedType: {
    type: String,
    enum: ['ad', 'chat', 'review', 'payment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });

// Auto-expire notifications after 30 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

module.exports = mongoose.model('Notification', notificationSchema);
