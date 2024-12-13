const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');
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

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { type, duration } = req.body;
    console.log('Creating payment intent:', { type, duration, userId: req.user._id });
    
    if (!PRICES[type]) {
      console.error('Invalid payment type:', type);
      return res.status(400).json({ message: `Invalid payment type: ${type}` });
    }

    // Calculate base amount
    let baseAmount = type === 'membership' 
      ? PRICES[type] * (duration || 1)
      : PRICES[type];
    
    // Convert to smallest currency unit (sen/cents) for Stripe
    const stripeAmount = Math.round(baseAmount * 100);

    // Verify Stripe is properly configured
    if (!stripe.paymentIntents) {
      console.error('Stripe not initialized. Secret key:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
      return res.status(500).json({ message: 'Payment service not properly configured' });
    }

    try {
      console.log('Creating Stripe payment intent:', { baseAmount, stripeAmount, currency: 'idr' });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: 'idr',
        payment_method_types: ['card'],
        metadata: {
          userId: req.user._id.toString(),
          type,
          duration: duration?.toString(),
          originalAmount: baseAmount.toString(),
        },
      });
      console.log('Payment intent created:', paymentIntent.id);

      // Create transaction record
      const transaction = new Transaction({
        user: req.user._id,
        type,
        amount: baseAmount, // Store original amount in database
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        membershipDuration: duration,
        createdAt: new Date(),
      });
      await transaction.save();
      console.log('Transaction record created:', transaction._id);

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: baseAmount,
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return res.status(500).json({ 
        message: 'Error creating payment intent',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      message: 'Server error processing payment request',
      error: error.message 
    });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
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
      if (transaction.type === 'membership') {
        const user = await User.findById(transaction.user);
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + transaction.membershipDuration);

        user.membership = {
          type: 'shopper',
          validUntil,
        };
        await user.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Webhook error', error: error.message });
  }
});

// Get user transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

module.exports = router;