require('dotenv').config();
const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const axios = require('axios');

// Hardcode values for testing
process.env.CLOUDFLARE_API_TOKEN = 'oUqcSM5wS20WvVJNz070N1dHuzY7KX4g_P72od_m';
process.env.CLOUDFLARE_ACCOUNT_ID = '5b82bb1773f2cf3656b035bb';

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

    // Verify the image URL is accessible
    try {
      const response = await axios.head(imageUrl);
      if (response.status === 200) {
        ad.productImage = imageUrl;
        await ad.save();
        console.log('Successfully updated ad with new image URL');
      } else {
        console.error('Image URL is not accessible');
      }
    } catch (error) {
      console.error('Error checking image URL:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdImage();
