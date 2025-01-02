require('dotenv').config();
const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const { uploadImageFromUrl } = require('../services/cloudflareService');

const MONGODB_URI = process.env.MONGODB_URI;
const adId = '67760827acfd22a98f222776';
const imageUrl = 'https://static.chemistwarehouse.com.au/ams/media/pi/65960/2DF_800.jpg';

async function updateAdImage() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const ad = await ShopperAd.findById(adId);
    if (!ad) {
      console.error('Ad not found');
      process.exit(1);
    }

    console.log('Uploading image to Cloudflare...');
    const cloudflareResult = await uploadImageFromUrl(imageUrl);
    
    if (!cloudflareResult.success) {
      console.error('Failed to upload to Cloudflare:', cloudflareResult.error);
      process.exit(1);
    }

    ad.cloudflareImageUrl = cloudflareResult.imageUrl;
    ad.cloudflareImageId = cloudflareResult.imageId;
    
    await ad.save();
    console.log('Successfully updated ad with Cloudflare image:', cloudflareResult.imageUrl);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdImage();
