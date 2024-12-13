const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Verify Stripe configuration
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.length < 30) {
  console.error('Invalid or missing Stripe secret key');
}

// Prices in IDR
const PRICES = {
  ad_posting: 195000, // Rp 195.000
  membership: 95000,  // Rp 95.000 per month
};

// Get membership price
router.get('/membership-price', async (req, res) => {
  try {
    res.json({ price: PRICES.membership });
  } catch (error) {
    console.error('Error getting membership price:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent for membership
router.post('/create-membership-intent', auth, async (req, res) => {
  try {
    const { duration = 1 } = req.body;
    const amount = PRICES.membership * duration;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Creating payment intent with amount:', amount, 'for user:', req.user._id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to smallest currency unit (sen)
      currency: 'idr',
      payment_method_types: ['card'],
      metadata: {
        userId: req.user._id.toString(),
        type: 'membership',
        duration: duration,
        originalAmount: amount
      }
    });

    console.log('Payment intent created:', paymentIntent.id);

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      type: 'membership',
      amount: amount, // Store original amount in database
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      membershipDuration: duration,
      createdAt: new Date(),
    });
    await transaction.save();
    console.log('Transaction record created:', transaction._id);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent for ad posting
router.post('/create-ad-posting-intent', auth, async (req, res) => {
  try {
    const amount = PRICES.ad_posting;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to smallest currency unit (sen)
      currency: 'idr',
      payment_method_types: ['card'],
      metadata: {
        type: 'ad_posting',
        userId: req.user._id.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount, // Send the amount back to frontend
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Gagal membuat pembayaran' });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;
    const duration = parseInt(paymentIntent.metadata.duration);
    const originalAmount = parseInt(paymentIntent.metadata.originalAmount);

    try {
      // Update user membership status in your database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update membership validity
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + duration);
      
      user.membership = {
        type: 'shopper',
        validUntil: validUntil
      };
      await user.save();

      // Update transaction record
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();

      console.log('Payment successful for user:', userId);
      console.log('Duration:', duration, 'months');
      console.log('Amount:', originalAmount);
    } catch (error) {
      console.error('Error updating user membership:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.json({ received: true });
});

// Get user transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;