const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  departureCity: {
    type: String,
    required: true,
  },
  arrivalCity: {
    type: String,
    required: true,
  },
  departureDate: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  pricePerKg: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ['AUD', 'IDR', 'USD', 'SGD', 'KRW'],
    default: 'AUD',
    required: true,
  },
  availableWeight: {
    type: Number,
    required: true,
  },
  additionalNotes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'completed'],
    default: 'active',
  },
  bookings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

adSchema.pre('find', function() {
  this.populate({
    path: 'user',
    select: 'email username whatsappNumber rating totalReviews',
  });
});

adSchema.pre('findOne', function() {
  this.populate({
    path: 'user',
    select: 'email username whatsappNumber rating totalReviews',
  });
});

module.exports = mongoose.model('Ad', adSchema);