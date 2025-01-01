const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const AnalyticsService = require('../services/analyticsService');

// Get overview stats
router.get('/overview', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await AnalyticsService.getOverviewStats(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(stats);
  } catch (error) {
    console.error('Error getting overview stats:', error);
    res.status(500).json({ message: 'Failed to get overview statistics' });
  }
});

// Get ad metrics
router.get('/ads', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await AnalyticsService.getAdMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error getting ad metrics:', error);
    res.status(500).json({ message: 'Failed to get ad metrics' });
  }
});

// Get user metrics
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await AnalyticsService.getUserMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error getting user metrics:', error);
    res.status(500).json({ message: 'Failed to get user metrics' });
  }
});

// Get engagement metrics
router.get('/engagement', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await AnalyticsService.getEngagementMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({ message: 'Failed to get engagement metrics' });
  }
});

// Get popular destinations
router.get('/destinations', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const destinations = await AnalyticsService.getPopularDestinations(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(destinations);
  } catch (error) {
    console.error('Error getting popular destinations:', error);
    res.status(500).json({ message: 'Failed to get popular destinations' });
  }
});

// Get product metrics
router.get('/products', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await AnalyticsService.getProductMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error getting product metrics:', error);
    res.status(500).json({ message: 'Failed to get product metrics' });
  }
});

// Get performance metrics
router.get('/performance', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await AnalyticsService.getPerformanceMetrics(
      new Date(startDate),
      new Date(endDate)
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ message: 'Failed to get performance metrics' });
  }
});

module.exports = router;
