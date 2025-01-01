const Review = require('../models/Review');
const User = require('../models/User');
const ShopperAd = require('../models/ShopperAd');
const emailService = require('./emailService');

class ReviewService {
  async createReview(userId, adId, reviewData) {
    try {
      const ad = await ShopperAd.findById(adId)
        .populate('user')
        .populate('selectedTraveler');

      if (!ad) {
        throw new Error('Ad not found');
      }

      // Check if user is authorized to review
      if (ad.user.toString() !== userId && ad.selectedTraveler?.toString() !== userId) {
        throw new Error('Not authorized to review this ad');
      }

      // Check if user has already reviewed
      const existingReview = await Review.findOne({
        ad: adId,
        reviewer: userId
      });

      if (existingReview) {
        throw new Error('You have already reviewed this ad');
      }

      // Create review
      const review = new Review({
        ad: adId,
        reviewer: userId,
        reviewee: userId === ad.user.toString() ? ad.selectedTraveler : ad.user,
        rating: reviewData.rating,
        comment: reviewData.comment,
        type: userId === ad.user.toString() ? 'traveler' : 'shopper'
      });

      await review.save();

      // Update user's average rating
      await this.updateUserRating(review.reviewee);

      // Send email notification
      const reviewee = await User.findById(review.reviewee);
      await emailService.sendReviewNotification(reviewee, ad, review);

      return review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async updateUserRating(userId) {
    try {
      const reviews = await Review.find({ reviewee: userId });
      
      if (reviews.length === 0) {
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await User.findByIdAndUpdate(userId, {
        $set: {
          rating: {
            average: averageRating,
            count: reviews.length
          }
        }
      });
    } catch (error) {
      console.error('Error updating user rating:', error);
      throw error;
    }
  }

  async getReviewsByAd(adId) {
    try {
      const reviews = await Review.find({ ad: adId })
        .populate('reviewer', 'username avatar rating')
        .populate('reviewee', 'username avatar rating')
        .sort({ createdAt: -1 });

      return reviews;
    } catch (error) {
      console.error('Error getting reviews by ad:', error);
      throw error;
    }
  }

  async getReviewsByUser(userId, type = 'received') {
    try {
      const query = type === 'received' 
        ? { reviewee: userId }
        : { reviewer: userId };

      const reviews = await Review.find(query)
        .populate('reviewer', 'username avatar rating')
        .populate('reviewee', 'username avatar rating')
        .populate({
          path: 'ad',
          select: 'productUrl productName status'
        })
        .sort({ createdAt: -1 });

      return reviews;
    } catch (error) {
      console.error('Error getting reviews by user:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const reviews = await Review.find({ reviewee: userId });
      
      const stats = {
        totalReviews: reviews.length,
        averageRating: 0,
        ratingDistribution: {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        }
      };

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => {
          stats.ratingDistribution[review.rating]++;
          return sum + review.rating;
        }, 0);
        
        stats.averageRating = totalRating / reviews.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async reportReview(reviewId, reason) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      review.reported = true;
      review.reportReason = reason;
      review.reportedAt = new Date();

      await review.save();

      // Notify admin about reported review
      // This could be implemented later with admin notification system
      
      return review;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  async handleReportedReview(reviewId, action, adminId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      if (action === 'remove') {
        review.removed = true;
        review.removedBy = adminId;
        review.removedAt = new Date();
        await review.save();

        // Update user rating after review removal
        await this.updateUserRating(review.reviewee);
      } else if (action === 'dismiss') {
        review.reported = false;
        review.reportReason = null;
        review.reportedAt = null;
        await review.save();
      }

      return review;
    } catch (error) {
      console.error('Error handling reported review:', error);
      throw error;
    }
  }
}

module.exports = new ReviewService();
