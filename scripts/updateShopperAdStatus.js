const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
require('dotenv').config();

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find the ad and show current state
        const ad = await ShopperAd.findById('67760827acfd22a98f222776')
            .populate('user', 'username')
            .populate('selectedTraveler', 'username');

        if (!ad) {
            console.log('Ad not found');
            return;
        }

        console.log('Before Update:');
        console.log('Status:', ad.status);
        console.log('Shopper:', ad.user._id);
        console.log('Traveler:', ad.selectedTraveler ? ad.selectedTraveler._id : 'None');

        // Update to active
        await ShopperAd.updateOne(
            { _id: '67760827acfd22a98f222776' },
            { 
                $set: { status: 'active' },
                $unset: { selectedTraveler: "" }
            }
        );

        console.log('\nUpdated to active status');

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
