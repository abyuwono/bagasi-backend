const mongoose = require('mongoose');

// Production database connection
const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

const User = require('../models/User');
const Ad = require('../models/Ad');

const createDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const addJastipAd = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Production');

    const shopperEmail = 'pgjj899@gmail.com';
    const shopper = await User.findOne({ email: shopperEmail });
    if (!shopper) {
      throw new Error(`User with email ${shopperEmail} not found`);
    }
    console.log(`Found shopper: ${shopper.username}`);

    // Create single Jastip ad
    const jastipAd = {
      title: 'Jastip Titipan - Gadget dari Singapore',
      type: 'jastip_titipan',
      user: shopper._id,
      shopperUserId: shopper._id,
      departureCity: 'Jakarta',
      arrivalCity: 'Singapore',
      departureDate: createDate(5),
      returnDate: createDate(7),
      availableWeight: 15,
      pricePerKg: 150000,
      additionalNotes: 'Bisa titip gadget dan elektronik dari Singapore. Pengiriman aman dan terpercaya.',
      status: 'active',
      currency: 'IDR',
      airline: 'Singapore Airlines',
      flightNumber: 'SQ953',
      departureTime: '08:00',
      expiresAt: createDate(4),
      itemCategories: ['Electronics', 'Gadgets'],
      estimatedPrice: 5000000,
      commission: 250000,
      maxItems: 5,
      pickupLocation: 'Plaza Indonesia, Jakarta',
      deliveryMethod: 'meetup'
    };

    const createdAd = await Ad.create(jastipAd);
    console.log('\nCreated Jastip Titipan ad');
    console.log('Created ad ID:', createdAd._id);
    console.log('View at: https://bagasi.id/shopper-ads/' + createdAd._id);

    process.exit(0);
  } catch (error) {
    console.error('Error adding Jastip ad:', error);
    process.exit(1);
  }
};

addJastipAd();
