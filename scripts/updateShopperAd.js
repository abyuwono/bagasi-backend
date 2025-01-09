const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

// AUD to IDR conversion rate (as of January 2025)
const AUD_TO_IDR_RATE = 10500;

async function updateShopperAd() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adId = '67760827acfd22a98f222776';
    const productPrice = 53.99;
    const productUrl = 'https://www.chemistwarehouse.com.au/buy/65960/blackmores-omega-triple-super-strength-fish-oil-150-capsules';

    // Use the rounded IDR price
    const productPriceIDR = 567000;

    // Update the ad
    const updatedAd = await ShopperAd.findByIdAndUpdate(
      adId,
      {
        $set: {
          productUrl,
          productPrice,
          productPriceIDR,
          currency: 'AUD',
          'commission.native': 5
        }
      },
      { new: true }
    );

    if (!updatedAd) {
      console.error('Ad not found');
      process.exit(1);
    }

    console.log('Successfully updated shopper ad:');
    console.log({
      id: updatedAd._id,
      productUrl: updatedAd.productUrl,
      productPrice: updatedAd.productPrice,
      productPriceIDR: updatedAd.productPriceIDR,
      currency: updatedAd.currency
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateShopperAd();
