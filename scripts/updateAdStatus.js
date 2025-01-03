const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');

const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

async function updateAdStatus() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update the specific ad
        const result = await ShopperAd.findByIdAndUpdate(
            '67760827acfd22a98f222776',
            { 
                $set: { status: 'active' },
                $unset: { selectedTraveler: 1 }
            },
            { new: true }
        );

        if (result) {
            console.log('Successfully updated ad:');
            console.log('ID:', result._id);
            console.log('New Status:', result.status);
            console.log('Shopper ID:', result.user);
        } else {
            console.log('Ad not found');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

updateAdStatus();
