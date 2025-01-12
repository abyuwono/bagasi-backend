const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    select: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  username: {
    type: String,
    default: function() {
      return this.email.split('@')[0];
    }
  },
  role: {
    type: String,
    enum: ['traveler', 'shopper'],
    required: true,
  },
  whatsappNumber: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
    select: true
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true,
    select: true
  },
  membership: {
    type: {
      type: String,
      enum: ['none', 'shopper'],
      default: 'none',
    },
    validUntil: {
      type: Date,
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  active: {
    type: Boolean,
    default: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    },
    virtuals: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);