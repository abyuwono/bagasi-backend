const ShopperAd = require('../models/ShopperAd');
const User = require('../models/User');
const Review = require('../models/Review');
const mongoose = require('mongoose');

class SearchService {
  async searchAds(query) {
    try {
      const {
        search,
        destinationCountry,
        priceRange,
        status,
        sort,
        dateRange,
        categories,
        page = 1,
        limit = 10
      } = query;

      const searchQuery = this.buildAdSearchQuery({
        search,
        destinationCountry,
        priceRange,
        status,
        dateRange,
        categories
      });

      const sortOptions = this.buildSortOptions(sort);

      const [ads, total] = await Promise.all([
        ShopperAd.find(searchQuery)
          .populate('user', 'username avatar rating')
          .populate('selectedTraveler', 'username avatar rating')
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit),
        ShopperAd.countDocuments(searchQuery)
      ]);

      // Get aggregated stats for the search results
      const stats = await ShopperAd.aggregate([
        { $match: searchQuery },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$productPrice.idr' },
            minPrice: { $min: '$productPrice.idr' },
            maxPrice: { $max: '$productPrice.idr' },
            totalAds: { $sum: 1 },
            countries: { $addToSet: '$destinationCountry' },
            categories: { $addToSet: '$category' }
          }
        }
      ]);

      return {
        ads,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        stats: stats[0] || null
      };
    } catch (error) {
      console.error('Error searching ads:', error);
      throw error;
    }
  }

  buildAdSearchQuery({
    search,
    destinationCountry,
    priceRange,
    status,
    dateRange,
    categories
  }) {
    const query = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productDescription: { $regex: search, $options: 'i' } },
        { destinationCountry: { $regex: search, $options: 'i' } }
      ];
    }

    if (destinationCountry) {
      query.destinationCountry = destinationCountry;
    }

    if (priceRange) {
      query['productPrice.idr'] = {
        $gte: priceRange.min || 0,
        $lte: priceRange.max || Number.MAX_SAFE_INTEGER
      };
    }

    if (status) {
      query.status = status;
    }

    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    return query;
  }

  buildSortOptions(sort) {
    const sortOptions = {};

    switch (sort) {
      case 'price_asc':
        sortOptions['productPrice.idr'] = 1;
        break;
      case 'price_desc':
        sortOptions['productPrice.idr'] = -1;
        break;
      case 'date_asc':
        sortOptions.createdAt = 1;
        break;
      case 'date_desc':
        sortOptions.createdAt = -1;
        break;
      case 'rating_desc':
        sortOptions['user.rating.average'] = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    return sortOptions;
  }

  async searchUsers(query) {
    try {
      const {
        search,
        role,
        status,
        sort,
        rating,
        isVerified,
        page = 1,
        limit = 10
      } = query;

      const searchQuery = this.buildUserSearchQuery({
        search,
        role,
        status,
        rating,
        isVerified
      });

      const sortOptions = this.buildUserSortOptions(sort);

      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('-password')
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(searchQuery)
      ]);

      // Get user statistics
      const userStats = await Promise.all(
        users.map(async (user) => {
          const [adStats, reviewStats] = await Promise.all([
            ShopperAd.aggregate([
              {
                $match: {
                  $or: [
                    { user: user._id },
                    { selectedTraveler: user._id }
                  ]
                }
              },
              {
                $group: {
                  _id: null,
                  totalAds: { $sum: 1 },
                  completedAds: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                  }
                }
              }
            ]),
            Review.aggregate([
              {
                $match: { reviewee: user._id }
              },
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: '$rating' },
                  totalReviews: { $sum: 1 }
                }
              }
            ])
          ]);

          return {
            ...user.toObject(),
            stats: {
              ads: adStats[0] || { totalAds: 0, completedAds: 0 },
              reviews: reviewStats[0] || { averageRating: 0, totalReviews: 0 }
            }
          };
        })
      );

      return {
        users: userStats,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  buildUserSearchQuery({ search, role, status, rating, isVerified }) {
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (rating) {
      query['rating.average'] = {
        $gte: parseFloat(rating)
      };
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    return query;
  }

  buildUserSortOptions(sort) {
    const sortOptions = {};

    switch (sort) {
      case 'rating_desc':
        sortOptions['rating.average'] = -1;
        break;
      case 'reviews_desc':
        sortOptions['rating.count'] = -1;
        break;
      case 'date_asc':
        sortOptions.createdAt = 1;
        break;
      case 'date_desc':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    return sortOptions;
  }

  async getSearchSuggestions(query) {
    try {
      const [adSuggestions, userSuggestions] = await Promise.all([
        ShopperAd.aggregate([
          {
            $match: {
              $or: [
                { productName: { $regex: query, $options: 'i' } },
                { destinationCountry: { $regex: query, $options: 'i' } }
              ]
            }
          },
          {
            $group: {
              _id: null,
              productNames: { $addToSet: '$productName' },
              countries: { $addToSet: '$destinationCountry' }
            }
          },
          {
            $project: {
              _id: 0,
              suggestions: {
                $setUnion: ['$productNames', '$countries']
              }
            }
          }
        ]),
        User.find({
          username: { $regex: query, $options: 'i' }
        })
          .select('username')
          .limit(5)
      ]);

      return {
        ads: adSuggestions[0]?.suggestions || [],
        users: userSuggestions.map(user => user.username)
      };
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  async getPopularSearches() {
    try {
      const [popularProducts, popularDestinations] = await Promise.all([
        ShopperAd.aggregate([
          {
            $group: {
              _id: '$productName',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
        ShopperAd.aggregate([
          {
            $group: {
              _id: '$destinationCountry',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ])
      ]);

      return {
        products: popularProducts.map(p => p._id),
        destinations: popularDestinations.map(d => d._id)
      };
    } catch (error) {
      console.error('Error getting popular searches:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
