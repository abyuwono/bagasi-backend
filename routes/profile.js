const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');

const router = express.Router();

// Get user profile with reviews
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reviews = await Review.find({ user: user._id })
      .populate('reviewer', 'username')
      .sort({ createdAt: -1 });

    res.json({
      ...user.toObject(),
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Add a review
router.post('/:userId/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-review
    if (req.user._id.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      user: req.params.userId,
      reviewer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this user' });
    }

    // Create review
    const review = new Review({
      user: req.params.userId,
      reviewer: req.user._id,
      rating,
      comment
    });

    await review.save();

    // Populate reviewer info before sending response
    await review.populate('reviewer', 'username');

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

// Update user verification status (admin only)
router.patch('/:userId/verify', auth, async (req, res) => {
  try {
    // TODO: Add admin check here
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification status', error: error.message });
  }
});

module.exports = router;
