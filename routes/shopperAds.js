const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShopperAd = require('../models/ShopperAd');
const ProductScraper = require('../services/productScraper');
const CurrencyConverter = require('../services/currencyConverter');
const { sendEmail } = require('../services/emailService');
const Chat = require('../models/Chat');

// Create a draft shopper ad
const createDraft = (req, res) => {
  const { productUrl, shippingAddress, localCourier, notes } = req.body;

  // Validate website
  if (!ShopperAd.isValidWebsite(productUrl)) {
    return res.status(400).json({ message: 'Unsupported website' });
  }

  // Scrape product information
  ProductScraper.scrapeProduct(productUrl)
    .then(productInfo => {
      if (!productInfo) {
        return res.status(400).json({ message: 'Failed to fetch product information' });
      }

      // Convert price to IDR
      return CurrencyConverter.convertToIDR(productInfo.price, 'AUD')
        .then(productPriceIDR => {
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

          // Calculate fees and save
          return shopperAd.calculateFees()
            .then(() => shopperAd.save())
            .then(savedAd => res.status(201).json(savedAd));
        });
    })
    .catch(error => {
      console.error('Error creating draft shopper ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Get all active shopper ads
const getActive = (req, res) => {
  ShopperAd.find({ status: 'active' })
    .populate('user', 'username')
    .sort('-createdAt')
    .then(ads => res.json(ads))
    .catch(error => {
      console.error('Error fetching active shopper ads:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Get shopper ad details
const getById = (req, res) => {
  ShopperAd.findById(req.params.id)
    .populate('user', 'username')
    .populate('selectedTraveler', 'username')
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      res.json(ad);
    })
    .catch(error => {
      console.error('Error fetching shopper ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Update product information manually
const updateProductInfo = (req, res) => {
  const { productImage, productPrice, productWeight } = req.body;
  
  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(shopperAd => {
      if (!shopperAd) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      // Update product information
      shopperAd.productImage = productImage;
      shopperAd.productPrice = productPrice;
      shopperAd.productWeight = productWeight;

      // Convert price and save
      return CurrencyConverter.convertToIDR(productPrice, 'AUD')
        .then(productPriceIDR => {
          shopperAd.productPriceIDR = productPriceIDR;
          return shopperAd.calculateFees();
        })
        .then(() => shopperAd.save())
        .then(updatedAd => res.json(updatedAd));
    })
    .catch(error => {
      console.error('Error updating product information:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Traveler requests to help
const requestToHelp = (req, res) => {
  let adRef;

  ShopperAd.findById(req.params.id)
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'active') {
        return res.status(400).json({ message: 'Ad is not available' });
      }

      adRef = ad;

      // Create chat room
      const chat = new Chat({
        shopperAd: ad._id,
        shopper: ad.user,
        traveler: req.user.id
      });

      return chat.save();
    })
    .then(chat => {
      // Update ad status
      adRef.status = 'in_discussion';
      adRef.selectedTraveler = req.user.id;
      return adRef.save().then(() => chat);
    })
    .then(chat => {
      // Send email notification
      return sendEmail({
        to: adRef.user.email,
        subject: 'New Request for Your Shopping Ad',
        template: 'traveler-request',
        context: {
          shopperName: adRef.user.username,
          travelerName: req.user.username,
          productUrl: adRef.productUrl
        }
      }).then(() => chat);
    })
    .then(chat => {
      res.json({ message: 'Request sent successfully', chatId: chat._id });
    })
    .catch(error => {
      console.error('Error processing traveler request:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Shopper accepts traveler
const acceptTraveler = (req, res) => {
  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'in_discussion') {
        return res.status(400).json({ message: 'Invalid ad status' });
      }

      ad.status = 'accepted';
      return ad.save().then(() => {
        return sendEmail({
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
      });
    })
    .then(() => {
      res.json({ message: 'Traveler accepted successfully' });
    })
    .catch(error => {
      console.error('Error accepting traveler:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Update tracking number
const updateTracking = (req, res) => {
  const { trackingNumber } = req.body;

  ShopperAd.findOne({
    _id: req.params.id,
    selectedTraveler: req.user.id
  })
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      ad.trackingNumber = trackingNumber;
      ad.status = 'shipped';
      return ad.save().then(() => {
        return sendEmail({
          to: ad.user.email,
          subject: 'Your Item Has Been Shipped',
          template: 'item-shipped',
          context: {
            shopperName: ad.user.username,
            trackingNumber,
            courier: ad.localCourier
          }
        });
      });
    })
    .then(() => {
      res.json({ message: 'Tracking number updated successfully' });
    })
    .catch(error => {
      console.error('Error updating tracking number:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Mark order as completed
const completeOrder = (req, res) => {
  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'shipped') {
        return res.status(400).json({ message: 'Invalid ad status' });
      }

      ad.status = 'completed';
      return ad.save();
    })
    .then(() => {
      res.json({ message: 'Order marked as completed' });
    })
    .catch(error => {
      console.error('Error completing order:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Cancel order
const cancelOrder = (req, res) => {
  ShopperAd.findOne({
    _id: req.params.id,
    $or: [{ user: req.user.id }, { selectedTraveler: req.user.id }]
  })
    .then(ad => {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (!['in_discussion', 'accepted'].includes(ad.status)) {
        return res.status(400).json({ message: 'Cannot cancel at this stage' });
      }

      ad.status = 'cancelled';
      return ad.save().then(() => {
        const otherUser = req.user.id === ad.user.toString() ? ad.selectedTraveler : ad.user;
        return sendEmail({
          to: otherUser.email,
          subject: 'Order Cancelled',
          template: 'order-cancelled',
          context: {
            userName: otherUser.username,
            productUrl: ad.productUrl
          }
        });
      });
    })
    .then(() => {
      res.json({ message: 'Order cancelled successfully' });
    })
    .catch(error => {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Server error' });
    });
};

// Routes
router.post('/draft', auth, createDraft);
router.get('/active', getActive);
router.get('/:id', getById);
router.patch('/draft/:id/product-info', auth, updateProductInfo);
router.post('/:id/request', auth, requestToHelp);
router.post('/:id/accept-traveler', auth, acceptTraveler);
router.patch('/:id/tracking', auth, updateTracking);
router.patch('/:id/complete', auth, completeOrder);
router.patch('/:id/cancel', auth, cancelOrder);

module.exports = router;
