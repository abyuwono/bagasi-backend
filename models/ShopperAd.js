const mongoose = require('mongoose');

const shopperAdSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productUrl: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  cloudflareImageId: {
    type: String
  },
  cloudflareImageUrl: {
    type: String
  },
  productPrice: {
    type: Number,
    required: true
  },
  productWeight: {
    type: Number,
    required: true
  },
  productPriceIDR: {
    type: Number,
    required: true
  },
  commission: {
    idr: {
      type: Number,
      required: true
    },
    native: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    }
  },
  shippingAddress: {
    fullAddress: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  localCourier: {
    type: String,
    enum: ['Grab', 'Gojek', 'JNE', 'Lion Parcel COD'],
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'in_discussion', 'accepted', 'shipped', 'completed', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  selectedTraveler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  interestedTravelers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  trackingNumber: String,
  website: {
    type: String,
    enum: [
      'amazon.com.au',
      'chemistwarehouse.com.au',
      'ebay.com.au',
      'coles.com.au',
      'woolworths.com.au'
    ],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt timestamp
shopperAdSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to calculate fees and total amount
shopperAdSchema.methods.calculateFees = async function() {
  const COMMISSION_IDR = 110000;
  const MAX_PLATFORM_FEE = 300000;
  
  // Calculate platform fee (10% of product price in IDR, max 300000)
  this.platformFee = Math.min(this.productPriceIDR * 0.1, MAX_PLATFORM_FEE);
  
  // Add commission
  this.commission.idr = COMMISSION_IDR;
  
  // Calculate total amount
  this.totalAmount = this.productPriceIDR + this.platformFee + COMMISSION_IDR;
  
  return this.totalAmount;
};

// Static method to validate website URL
shopperAdSchema.statics.isValidWebsite = function(url) {
  const validDomains = [
    'amazon.com.au',
    'chemistwarehouse.com.au',
    'ebay.com.au',
    'coles.com.au',
    'woolworths.com.au'
  ];
  
  return validDomains.some(domain => url.includes(domain));
};

const ShopperAd = mongoose.model('ShopperAd', shopperAdSchema);

module.exports = ShopperAd;
