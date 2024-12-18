const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Ad = require('../models/Ad');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { users, ads, bookings, transactions, hashPassword } = require('./seedData');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('MongoDB URI:', process.env.MONGODB_URI); // Debug line
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Ad.deleteMany({}),
      Booking.deleteMany({}),
      Transaction.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users with hashed passwords
    const createdUsers = await Promise.all(
      users.map(async (userData) => {
        const hashedPassword = await hashPassword(userData.password);
        return User.create({
          ...userData,
          password: hashedPassword
        });
      })
    );
    console.log('Created users');

    // Assign users to ads and create them
    const adsWithUsers = ads.map((ad, index) => ({
      ...ad,
      user: createdUsers[index % createdUsers.length]._id
    }));
    const createdAds = await Ad.create(adsWithUsers);
    console.log('Created ads');

    // Create bookings
    const bookingsWithRefs = bookings.map((booking, index) => ({
      ...booking,
      ad: createdAds[index % createdAds.length]._id,
      user: createdUsers[(index + 1) % createdUsers.length]._id
    }));
    await Booking.create(bookingsWithRefs);
    console.log('Created bookings');

    // Create transactions
    const transactionsWithUsers = transactions.map((transaction, index) => ({
      ...transaction,
      user: createdUsers[index % createdUsers.length]._id
    }));
    await Transaction.create(transactionsWithUsers);
    console.log('Created transactions');

    console.log('\nSample credentials:');
    console.log('Traveler: john@example.com / password123');
    console.log('Shopper: sarah@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
