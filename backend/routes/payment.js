const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PaymentService = require('../services/paymentService');
const ShopperAd = require('../models/ShopperAd');

// Create payment token for an ad
router.post('/token/:adId', auth, async (req, res) => {
  try {
    const { adId } = req.params;

    // Verify ad ownership
    const ad = await ShopperAd.findById(adId);
    if (!ad || ad.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if payment is already completed
    if (ad.payment && ad.payment.status === 'success') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const token = await PaymentService.createPaymentToken(adId, req.user.id);
    res.json(token);
  } catch (error) {
    console.error('Error creating payment token:', error);
    res.status(500).json({ message: 'Failed to create payment token' });
  }
});

// Handle payment notification from Midtrans
router.post('/notification', async (req, res) => {
  try {
    await PaymentService.handleCallback(req.body);
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling payment notification:', error);
    res.status(500).json({ message: 'Failed to process payment notification' });
  }
});

// Get payment status
router.get('/status/:adId', auth, async (req, res) => {
  try {
    const { adId } = req.params;

    // Verify ad ownership or admin
    const ad = await ShopperAd.findById(adId);
    if (!ad || (ad.user.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const status = await PaymentService.getPaymentStatus(adId);
    res.json(status);
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ message: 'Failed to get payment status' });
  }
});

module.exports = router;
