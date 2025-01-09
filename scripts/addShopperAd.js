const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const { uploadImageFromUrl } = require('../services/cloudflareService');
const { crawlWoolworthsProduct } = require('./crawlProduct');
require('dotenv').config();

// Function to calculate commission based on product price
function calculateCommission(priceIDR) {
  // Base commission 110,000 IDR
  const baseCommissionIDR = 110000;
  
  // Additional commission 5% of product price if price > 2,000,000 IDR
  const additionalCommission = priceIDR > 2000000 ? priceIDR * 0.05 : 0;
  
  const totalCommissionIDR = baseCommissionIDR + additionalCommission;
  
  // Convert to AUD (approximate rate 1 AUD = 10,000 IDR)
  const commissionAUD = Math.ceil(totalCommissionIDR / 10000);
  
  return {
    idr: totalCommissionIDR,
    native: commissionAUD,
    currency: 'AUD'
  };
}

async function addShopperAd(adData) {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Find the master account
    const masterUser = await User.findOne({ email: 'pgj899@gmail.com' });
    if (!masterUser) {
      console.error('Master account not found');
      process.exit(1);
    }

    let productData = {};
    
    // If it's a Woolworths URL, crawl the data
    if (adData.productUrl.includes('woolworths.com.au')) {
      console.log('Crawling Woolworths product data...');
      productData = await crawlWoolworthsProduct(adData.productUrl);
    } else {
      productData = adData;
    }

    // Upload image to Cloudflare
    console.log('Uploading image to Cloudflare...');
    const cloudflareResult = await uploadImageFromUrl(productData.productImage);
    if (!cloudflareResult.success) {
      console.error('Failed to upload image:', cloudflareResult.error);
      process.exit(1);
    }

    // Calculate commission
    const commission = calculateCommission(productData.productPriceIDR);

    // Create the shopper ad
    const shopperAd = new ShopperAd({
      user: masterUser._id,
      ...adData,
      ...productData, // Merge crawled product data
      productImage: cloudflareResult.imageUrl,
      cloudflareImageId: cloudflareResult.imageId,
      cloudflareImageUrl: cloudflareResult.imageUrl,
      commission,
      status: adData.status || 'draft'
    });

    // Calculate fees
    await shopperAd.calculateFees();

    // Save the ad
    await shopperAd.save();

    console.log('Successfully added new Shopper ad:', {
      id: shopperAd._id,
      productName: shopperAd.productName,
      totalAmount: shopperAd.totalAmount,
      commission: shopperAd.commission,
      platformFee: shopperAd.platformFee
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Example usage with just URL and shipping info:
const sampleAd = {
  productUrl: 'https://www.woolworths.com.au/shop/productdetails/771858',
  shippingAddress: {
    fullAddress: 'Jl. Raya Kuta No. 88',
    city: 'Kuta',
    country: 'Indonesia'
  },
  localCourier: 'JNE',
  notes: 'Please buy the latest stock',
  status: 'active'
};

// Uncomment to run with sample data:
// addShopperAd(sampleAd);
