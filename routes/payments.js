const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { verifyToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

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
router.post('/create-membership-intent', verifyToken, async (req, res) => {
  try {
    const { duration = 1 } = req.body;
    const amount = PRICES.membership * duration;

    console.log('Creating payment intent with amount:', amount);

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
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();

      // Handle membership activation
      const user = await User.findById(transaction.user);
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + transaction.membershipDuration);

      user.membership = {
        type: 'shopper',
        validUntil,
      };
      await user.save();

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
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

module.exports = router;