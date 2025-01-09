const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Set Cloudflare credentials directly
process.env.CLOUDFLARE_API_TOKEN = 'oUqcSM5wS20WvVJNz070N1dHuzY7KX4g_P72od_m';
process.env.CLOUDFLARE_ACCOUNT_ID = 'f515e268b7a98324a18a2d5240534c4b';

// Cloudflare configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function uploadToCloudflare(imageUrl) {
  try {
    // Download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Create form data
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'product-image.jpg',
      contentType: 'image/jpeg'
    });

    // Upload to Cloudflare Images
    const uploadResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );

    if (uploadResponse.data.success) {
      return {
        id: uploadResponse.data.result.id,
        url: uploadResponse.data.result.variants[0]
      };
    }
    throw new Error('Failed to upload image to Cloudflare');
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error.message);
    return null;
  }
}

async function addShopperAdSimple() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Find the master account
    const masterUser = await User.findOne({ email: 'pgj899@gmail.com' });
    if (!masterUser) {
      console.error('Master account not found');
      process.exit(1);
    }

    // Product data
    const productData = {
      productUrl: "https://www.woolworths.com.au/shop/productdetails/771858",
      productName: "Blackmores Vitamin D3 1000IU Bone Health Immunity Capsules 200 pack",
      productImage: "https://cdn0.woolworths.media/content/wowproductimages/large/771858.jpg",
      productPrice: 15.5,
      productWeight: 0.2,
      productPriceIDR: 163000,
      website: "woolworths.com.au",
      merchantName: "Woolworths" // This is both the merchant and shop name
    };

    // Upload image to Cloudflare
    console.log('Uploading image to Cloudflare...');
    const cloudflareImage = await uploadToCloudflare(productData.productImage);
    console.log('Cloudflare upload result:', cloudflareImage);
    
    // Calculate commission in native currency (AUD)
    const commissionIDR = 150000;
    const commissionAUD = Math.ceil(commissionIDR / productData.productPriceIDR * productData.productPrice);

    // Create the shopper ad
    const shopperAd = new ShopperAd({
      user: masterUser._id,
      ...productData,
      cloudflareImageId: cloudflareImage?.id,
      cloudflareImageUrl: cloudflareImage?.url,
      quantity: 2,
      status: 'active',
      shippingAddress: {
        fullAddress: 'Jalan Griya Agung No 15',
        city: 'Jakarta',
        country: 'Indonesia'
      },
      localCourier: 'Lion Parcel COD',
      commission: {
        idr: commissionIDR,
        native: commissionAUD,
        currency: 'AUD'
      },
      notes: 'Tolong dibeliin dari woolworths dan disimpen receipt nya yah dari woolworths. terima kasih',
      totalAmount: {
        idr: productData.productPriceIDR * 2, // price * quantity
        native: productData.productPrice * 2,
        currency: 'AUD'
      }
    });

    // Calculate platform fee
    await shopperAd.calculateFees();

    // Save the ad
    await shopperAd.save();

    console.log('Successfully added new Shopper ad:', {
      id: shopperAd._id,
      productName: shopperAd.productName,
      merchantName: shopperAd.merchantName,
      productImage: shopperAd.productImage,
      cloudflareImageId: shopperAd.cloudflareImageId,
      cloudflareImageUrl: shopperAd.cloudflareImageUrl,
      totalAmount: shopperAd.totalAmount,
      commission: shopperAd.commission,
      platformFee: shopperAd.platformFee,
      quantity: shopperAd.quantity,
      status: shopperAd.status
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addShopperAdSimple();
