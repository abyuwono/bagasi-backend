const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const ReviewService = require('../services/reviewService');

// Create a review
router.post('/:adId', auth, async (req, res) => {
  try {
    const { adId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const review = await ReviewService.createReview(req.user.id, adId, {
      rating,
      comment
    });

    res.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for an ad
router.get('/ad/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const reviews = await ReviewService.getReviewsByAd(adId);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: 'Failed to get reviews' });
  }
});

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'received' } = req.query;
    const reviews = await ReviewService.getReviewsByUser(userId, type);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({ message: 'Failed to get user reviews' });
  }
});

// Get user review stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await ReviewService.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Failed to get user stats' });
  }
});

// Report a review
router.post('/:reviewId/report', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const review = await ReviewService.reportReview(reviewId, reason);
    res.json(review);
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ message: 'Failed to report review' });
  }
});

// Handle reported review (admin only)
router.post('/:reviewId/handle-report', [auth, adminAuth], async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body;

    if (!['remove', 'dismiss'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const review = await ReviewService.handleReportedReview(
      reviewId,
      action,
      req.user.id
    );
    res.json(review);
  } catch (error) {
    console.error('Error handling reported review:', error);
    res.status(500).json({ message: 'Failed to handle reported review' });
  }
});

module.exports = router;
