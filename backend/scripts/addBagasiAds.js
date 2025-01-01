const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');

async function addBagasiAds() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Find the master account
    const masterUser = await User.findOne({ email: 'pgj899@gmail.com' });
    if (!masterUser) {
      console.error('Master account not found');
      process.exit(1);
    }

    // Common notes for both ads
    const commonNotes = `📝 NOTE:
✅ Barang bersedia di unpack / dibuka dan diperiksa
✅ Bs request dikirim via kurir JNE atau mau dipick up lgsg juga boleh
✅ Harga bs nego utk jastip diatas 3kg
❌ NO electronic, bulky items, liquids, obat terlarang, atau segala item berbahaya

*Bs request utk dikirim ke JKT or semua daerah Indo juga bisa, namun ongkir ditanggung masing2 ya`;

    // Generate random rating with 1 decimal place between 4 and 5
    const randomRating = Number((4 + Math.random()).toFixed(1));

    // Create Sydney to KNO ad
    const sydneyKnoAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Fanny Fanny',
      customRating: randomRating,
      customWhatsapp: '+62818550557',
      departureCity: 'Sydney',
      arrivalCity: 'Medan',
      departureDate: new Date('2025-01-07T00:00:00+11:00'), // Ready in KNO date
      expiresAt: new Date('2025-01-03T23:59:59+11:00'), // Last drop date
      pricePerKg: 18,
      currency: 'AUD',
      availableWeight: 30,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Create Melbourne to KNO ad
    const melbourneKnoAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Fanny Fanny',
      customRating: randomRating, // Same rating as they're from same person
      customWhatsapp: '+62818550557',
      departureCity: 'Melbourne',
      arrivalCity: 'Medan',
      departureDate: new Date('2025-01-07T00:00:00+11:00'), // Ready in KNO date
      expiresAt: new Date('2025-01-05T23:59:59+11:00'), // Last drop date
      pricePerKg: 18,
      currency: 'AUD',
      availableWeight: 30,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Save both ads
    await sydneyKnoAd.save();
    await melbourneKnoAd.save();

    console.log('Ads created successfully with rating:', randomRating);
    process.exit(0);
  } catch (error) {
    console.error('Error creating ads:', error);
    process.exit(1);
  }
}

addBagasiAds();
