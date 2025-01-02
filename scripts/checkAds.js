const mongoose = require('mongoose');
const path = require('path');

// Production database connection
const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

// Get absolute path to models directory
const modelsPath = path.join(__dirname, '..', 'models');
console.log('Models path:', modelsPath);

// Load models
const ShopperAd = require(path.join(modelsPath, 'ShopperAd'));
const User = require(path.join(modelsPath, 'User'));

const createSampleAd = async (userId) => {
  const sampleAd = new ShopperAd({
    user: userId,
    productUrl: 'https://www.chemistwarehouse.com.au/buy/89180/blackmores-omega-triple-concentrated-fish-oil-150-capsules',
    productImage: 'https://static.chemistwarehouse.com.au/ams/media/pi/89180/2DF_800.jpg',
    productPrice: 39.99,
    productWeight: 0.5,
    productPriceIDR: 450000,
    commission: {
      idr: 50000,
      native: 4.50,
      currency: 'AUD'
    },
    shippingAddress: {
      fullAddress: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      country: 'Indonesia'
    },
    localCourier: 'JNE',
    notes: 'Please buy from Chemist Warehouse only',
    status: 'active',
    paymentStatus: 'pending',
    website: 'chemistwarehouse.com.au',
    totalAmount: 550000,
    platformFee: 50000
  });

  return await sampleAd.save();
};

const checkAds = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Add mongoose debug logging
    mongoose.set('debug', true);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Production');

    // First, let's check if the model is properly loaded
    console.log('\nChecking ShopperAd model...');
    console.log('Model name:', ShopperAd.modelName);
    console.log('Collection name:', ShopperAd.collection.name);
    console.log('Schema paths:', Object.keys(ShopperAd.schema.paths).join(', '));

    // Check all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:', collections.map(c => c.name).join(', '));

    // Check all ads with minimal fields first
    console.log('\nFetching ads...');
    const count = await ShopperAd.countDocuments();
    console.log('Total documents in collection:', count);

    if (count === 0) {
      console.log('\nNo ads found. Creating a sample ad...');
      
      // Find a user to associate with the ad
      const user = await User.findOne({ email: 'pgj899@gmail.com' });
      if (!user) {
        throw new Error('User not found');
      }
      
      const newAd = await createSampleAd(user._id);
      console.log('Created sample ad:', newAd._id);
    }

    const allAds = await ShopperAd.find()
                          .populate('user', 'email username')
                          .lean();
    
    console.log('\nAll ads:', allAds.length ? allAds.length + ' found' : 'No ads found');
    if (allAds.length === 0) {
      console.log('No ads found in the database');
    } else {
      allAds.forEach(ad => {
        console.log(`\nAd ID: ${ad._id}`);
        console.log(`Status: ${ad.status}`);
        console.log(`Product: ${ad.productUrl}`);
        console.log(`Price: ${ad.productPrice} ${ad.commission.currency} (${ad.productPriceIDR} IDR)`);
        console.log(`User: ${ad.user ? ad.user.email : 'No user'} (${ad.user ? ad.user.username : 'N/A'})`);
      });
    }

    // Check specifically active ads
    const activeAds = await ShopperAd.find({
      status: 'active'
    }).lean();

    console.log('\nNumber of active Shopper ads:', activeAds.length);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB due to error');
    }
    process.exit(1);
  }
};

// Add error handlers
process.on('unhandledRejection', async (error) => {
  console.error('\nUnhandled rejection:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB due to unhandled rejection');
  }
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  console.error('\nUncaught exception:', error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB due to uncaught exception');
  }
  process.exit(1);
});

checkAds();