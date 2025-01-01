const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShopperAd = require('../models/ShopperAd');
const ProductScraper = require('../services/productScraper');
const CurrencyConverter = require('../services/currencyConverter');
const { sendEmail } = require('../utils/email');
const Chat = require('../models/Chat');

// Create a draft shopper ad
router.post('/draft', auth, async (req, res) => {
  try {
    const { productUrl, shippingAddress, localCourier, notes } = req.body;

    // Validate website
    if (!ShopperAd.isValidWebsite(productUrl)) {
      return res.status(400).json({ message: 'Unsupported website' });
    }

    // Scrape product information
    const productInfo = await ProductScraper.scrapeProduct(productUrl);
    if (!productInfo) {
      return res.status(400).json({ message: 'Failed to fetch product information' });
    }

    // Convert price to IDR
    const productPriceIDR = await CurrencyConverter.convertToIDR(productInfo.price, 'AUD');

    const shopperAd = new ShopperAd({
      user: req.user.id,
      productUrl,
      productImage: productInfo.image,
      productPrice: productInfo.price,
      productWeight: productInfo.weight,
      productPriceIDR,
      shippingAddress,
      localCourier,
      notes,
      website: new URL(productUrl).hostname,
      status: 'draft'
    });

    // Calculate fees
    await shopperAd.calculateFees();
    await shopperAd.save();

    res.status(201).json(shopperAd);
  } catch (error) {
    console.error('Error creating draft shopper ad:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product information manually
router.patch('/draft/:id/product-info', auth, async (req, res) => {
  try {
    const { productImage, productPrice, productWeight } = req.body;
    const shopperAd = await ShopperAd.findOne({ _id: req.params.id, user: req.user.id });

    if (!shopperAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Update product information
    shopperAd.productImage = productImage;
    shopperAd.productPrice = productPrice;
    shopperAd.productWeight = productWeight;
    shopperAd.productPriceIDR = await CurrencyConverter.convertToIDR(productPrice, 'AUD');

    // Recalculate fees
    await shopperAd.calculateFees();
    await shopperAd.save();

    res.json(shopperAd);
  } catch (error) {
    console.error('Error updating product information:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active shopper ads
router.get('/active', async (req, res) => {
  try {
    const ads = await ShopperAd.find({ status: 'active' })
      .populate('user', 'username')
      .sort('-createdAt');
    res.json(ads);
  } catch (error) {
    console.error('Error fetching active shopper ads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active shopper ads
router.get('/active', async (req, res) => {
  try {
    const ads = await ShopperAd.find({ status: 'active' })
      .populate('user', 'username')
      .sort('-createdAt');
    res.json(ads);
  } catch (error) {
    console.error('Error fetching active shopper ads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shopper ad details
router.get('/:id', async (req, res) => {
  try {
    const ad = await ShopperAd.findById(req.params.id)
      .populate('user', 'username')
      .populate('selectedTraveler', 'username');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.json(ad);
  } catch (error) {
    console.error('Error fetching shopper ad:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Traveler requests to help
router.post('/:id/request', auth, async (req, res) => {
  try {
    const ad = await ShopperAd.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (ad.status !== 'active') {
      return res.status(400).json({ message: 'Ad is not available' });
    }

    // Create chat room
    const chat = new Chat({
      shopperAd: ad._id,
      shopper: ad.user,
      traveler: req.user.id
    });
    await chat.save();

    // Update ad status
    ad.status = 'in_discussion';
    ad.selectedTraveler = req.user.id;
    await ad.save();

    // Send email notification to shopper
    await sendEmail({
      to: ad.user.email,
      subject: 'New Request for Your Shopping Ad',
      template: 'traveler-request',
      context: {
        shopperName: ad.user.username,
        travelerName: req.user.username,
        productUrl: ad.productUrl
      }
    });

    res.json({ message: 'Request sent successfully', chatId: chat._id });
  } catch (error) {
    console.error('Error processing traveler request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Shopper accepts traveler
router.post('/:id/accept-traveler', auth, async (req, res) => {
  try {
    const ad = await ShopperAd.findOne({ _id: req.params.id, user: req.user.id });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (ad.status !== 'in_discussion') {
      return res.status(400).json({ message: 'Invalid ad status' });
    }

    ad.status = 'accepted';
    await ad.save();

    // Send email notifications
    await sendEmail({
      to: ad.selectedTraveler.email,
      subject: 'Your Request Has Been Accepted',
      template: 'request-accepted',
      context: {
        travelerName: ad.selectedTraveler.username,
        shopperName: ad.user.username,
        productUrl: ad.productUrl,
        shippingAddress: ad.shippingAddress.fullAddress
      }
    });

    res.json({ message: 'Traveler accepted successfully' });
  } catch (error) {
    console.error('Error accepting traveler:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update tracking number
router.patch('/:id/tracking', auth, async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    const ad = await ShopperAd.findOne({
      _id: req.params.id,
      selectedTraveler: req.user.id
    });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.trackingNumber = trackingNumber;
    ad.status = 'shipped';
    await ad.save();

    // Send email notification to shopper
    await sendEmail({
      to: ad.user.email,
      subject: 'Your Item Has Been Shipped',
      template: 'item-shipped',
      context: {
        shopperName: ad.user.username,
        trackingNumber,
        courier: ad.localCourier
      }
    });

    res.json({ message: 'Tracking number updated successfully' });
  } catch (error) {
    console.error('Error updating tracking number:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark order as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const ad = await ShopperAd.findOne({ _id: req.params.id, user: req.user.id });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (ad.status !== 'shipped') {
      return res.status(400).json({ message: 'Invalid ad status' });
    }

    ad.status = 'completed';
    await ad.save();

    // TODO: Implement payment release to traveler

    res.json({ message: 'Order marked as completed' });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const ad = await ShopperAd.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { selectedTraveler: req.user.id }]
    });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    if (!['in_discussion', 'accepted'].includes(ad.status)) {
      return res.status(400).json({ message: 'Cannot cancel at this stage' });
    }

    ad.status = 'cancelled';
    await ad.save();

    // Notify other party
    const otherUser = req.user.id === ad.user.toString() ? ad.selectedTraveler : ad.user;
    await sendEmail({
      to: otherUser.email,
      subject: 'Order Cancelled',
      template: 'order-cancelled',
      context: {
        userName: otherUser.username,
        productUrl: ad.productUrl
      }
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
