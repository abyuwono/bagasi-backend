const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update user's average rating when a review is saved
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const User = mongoose.model('User');
  
  const reviews = await Review.find({ user: this.user });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await User.findByIdAndUpdate(this.user, {
    rating: averageRating,
    totalReviews: reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);
