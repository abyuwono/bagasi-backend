const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const { crawlWoolworthsProduct } = require('./crawlProduct');
require('dotenv').config();

async function addNewShopperAd() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Find the master account (you might want to change this to accept user ID as parameter)
    const masterUser = await User.findOne({ email: 'pgj899@gmail.com' });
    if (!masterUser) {
      console.error('Master account not found');
      process.exit(1);
    }

    // Product data
    const productUrl = 'https://www.woolworths.com.au/shop/productdetails/771858';
    
    // Get product data from crawler
    console.log('Fetching product data...');
    const productData = await crawlWoolworthsProduct(productUrl);

    // Create the shopper ad
    const shopperAd = new ShopperAd({
      user: masterUser._id,
      productUrl: productData.productUrl,
      productName: productData.productName,
      productImage: productData.productImage,
      productPrice: productData.productPrice,
      productWeight: productData.productWeight,
      productPriceIDR: productData.productPriceIDR,
      website: productData.website,
      merchantName: productData.merchantName,
      shopName: productData.shopName,
      quantity: 2,
      status: 'active',
      shippingAddress: {
        fullAddress: 'Jalan Griya Agung No 15',
        city: 'Jakarta',
        country: 'Indonesia'
      },
      localCourier: 'Lion Parcel COD',
      commission: {
        idr: 150000,
        native: Math.ceil(150000 / productData.productPriceIDR * productData.productPrice),
        currency: 'AUD'
      },
      notes: 'Tolong dibeliin dari woolworths dan disimpen receipt nya yah dari woolworths. terima kasih',
      totalAmount: {
        idr: productData.productPriceIDR * 2, // price * quantity
        native: productData.productPrice * 2,
        currency: 'AUD'
      }
    });

    // Calculate platform fee (if needed)
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

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addNewShopperAd();
