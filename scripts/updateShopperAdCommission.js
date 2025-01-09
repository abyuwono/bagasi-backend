const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User'); // Added User model import

const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

async function main() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Find the ad and show current state
        const ad = await ShopperAd.findById('6778f15fb57bb6b3b50a38b1');

        if (!ad) {
            console.log('Ad not found');
            return;
        }

        console.log('Before Update:');
        console.log('Commission:', ad.commission);

        // Update commission
        await ShopperAd.updateOne(
            { _id: '6778f15fb57bb6b3b50a38b1' },
            { 
                $set: { 
                    'commission.idr': 110000,
                    'commission.native': 110000 / 10000, // Assuming 1 AUD = 15000 IDR
                }
            }
        );

        // Verify the update
        const updatedAd = await ShopperAd.findById('6778f15fb57bb6b3b50a38b1');
        console.log('\nAfter Update:');
        console.log('Commission:', updatedAd.commission);

        console.log('\nUpdate completed successfully');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
