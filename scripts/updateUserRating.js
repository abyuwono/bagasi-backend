require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority';

async function updateUserRating() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update user rating
        const result = await User.updateOne(
            { username: 'pgj899' },
            { 
                $set: { 
                    rating: 4.9,
                    totalReviews: 5 // Adding a review count since we're setting a rating
                }
            }
        );

        if (result.matchedCount === 0) {
            console.log('User not found');
        } else if (result.modifiedCount === 0) {
            console.log('User found but no changes were needed');
        } else {
            console.log('Successfully updated user rating');
        }

        // Verify the update
        const updatedUser = await User.findOne({ username: 'pgj899' });
        if (updatedUser) {
            console.log('Updated user details:', {
                username: updatedUser.username,
                rating: updatedUser.rating,
                totalReviews: updatedUser.totalReviews
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateUserRating();
