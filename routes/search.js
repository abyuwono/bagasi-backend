const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SearchService = require('../services/searchService');

// Search ads
router.get('/ads', async (req, res) => {
  try {
    const results = await SearchService.searchAds(req.query);
    res.json(results);
  } catch (error) {
    console.error('Error searching ads:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search users
router.get('/users', auth, async (req, res) => {
  try {
    const results = await SearchService.searchUsers(req.query);
    res.json(results);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const suggestions = await SearchService.getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const popularSearches = await SearchService.getPopularSearches();
    res.json(popularSearches);
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
