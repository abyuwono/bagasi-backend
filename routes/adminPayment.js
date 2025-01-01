const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const AdminPaymentService = require('../services/adminPaymentService');

// Get payment overview
router.get('/overview', [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const overview = await AdminPaymentService.getPaymentOverview(startDate, endDate);
    res.json(overview);
  } catch (error) {
    console.error('Error getting payment overview:', error);
    res.status(500).json({ message: 'Failed to get payment overview' });
  }
});

// Get payment details with filters and pagination
router.get('/details', [auth, adminAuth], async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const details = await AdminPaymentService.getPaymentDetails(
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );
    res.json(details);
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ message: 'Failed to get payment details' });
  }
});

// Process refund
router.post('/refund/:adId', [auth, adminAuth], async (req, res) => {
  try {
    const { adId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }

    const refund = await AdminPaymentService.refundPayment(adId, reason);
    res.json(refund);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
});

// Get payment statistics
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const stats = await AdminPaymentService.getPaymentStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({ message: 'Failed to get payment statistics' });
  }
});

// Get payment issues
router.get('/issues', [auth, adminAuth], async (req, res) => {
  try {
    const issues = await AdminPaymentService.getPaymentIssues();
    res.json(issues);
  } catch (error) {
    console.error('Error getting payment issues:', error);
    res.status(500).json({ message: 'Failed to get payment issues' });
  }
});

// Resolve payment issue
router.post('/issues/:adId/resolve', [auth, adminAuth], async (req, res) => {
  try {
    const { adId } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ message: 'Resolution is required' });
    }

    const result = await AdminPaymentService.resolvePaymentIssue(adId, resolution);
    res.json(result);
  } catch (error) {
    console.error('Error resolving payment issue:', error);
    res.status(500).json({ message: 'Failed to resolve payment issue' });
  }
});

module.exports = router;
