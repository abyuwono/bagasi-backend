const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');

const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

const queryAd = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const ad = await ShopperAd.findById('67760827acfd22a98f222776').lean();
        if (ad) {
            console.log('Found ad:');
            console.log('```json');
            console.log(JSON.stringify({
                success: true,
                data: {
                    ad
                }
            }, null, 2));
            console.log('```');
        } else {
            console.log('Ad not found');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
};

queryAd();
