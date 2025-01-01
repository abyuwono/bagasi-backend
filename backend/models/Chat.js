const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  shopperAd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopperAd',
    required: true
  },
  shopper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  traveler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update lastMessage timestamp
chatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessage = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

// Method to validate message content (no contact information)
chatSchema.methods.validateMessage = function(content) {
  // Regular expressions to detect contact information
  const patterns = [
    /\b\d{10,}\b/, // Phone numbers
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email addresses
    /\b(whatsapp|telegram|line|wechat|fb|facebook|instagram|ig)\b/i, // Social media mentions
  ];

  return !patterns.some(pattern => pattern.test(content));
};

// Static method to check for inactive chats
chatSchema.statics.findInactiveChats = async function(hourThreshold = 1) {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - hourThreshold);

  return this.find({
    status: 'active',
    lastMessage: { $lt: threshold }
  }).populate('shopper traveler shopperAd');
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
