const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShopperAd = require('../models/ShopperAd');
const ProductScraper = require('../services/productScraper');
const CurrencyConverter = require('../services/currencyConverter');
const { sendEmail } = require('../services/emailService');
const Chat = require('../models/Chat');

// Create a draft shopper ad
router.post('/draft', [auth], function(req, res) {
  const { productUrl, shippingAddress, localCourier, notes } = req.body;

  // Validate website
  if (!ShopperAd.isValidWebsite(productUrl)) {
    return res.status(400).json({ message: 'Unsupported website' });
  }

  // Scrape product information
  ProductScraper.scrapeProduct(productUrl)
    .then(function(productInfo) {
      if (!productInfo) {
        return res.status(400).json({ message: 'Failed to fetch product information' });
      }

      // Convert price to IDR
      CurrencyConverter.convertToIDR(productInfo.price, 'AUD')
        .then(function(productPriceIDR) {
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
          shopperAd.calculateFees()
            .then(function() {
              shopperAd.save()
                .then(function(savedAd) {
                  res.status(201).json(savedAd);
                })
                .catch(function(error) {
                  console.error('Error saving ad:', error);
                  res.status(500).json({ message: 'Server error' });
                });
            })
            .catch(function(error) {
              console.error('Error calculating fees:', error);
              res.status(500).json({ message: 'Server error' });
            });
        })
        .catch(function(error) {
          console.error('Error converting price:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error scraping product:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Update product information manually
router.patch('/draft/:id/product-info', [auth], function(req, res) {
  const { productImage, productPrice, productWeight } = req.body;
  const shopperAd = ShopperAd.findOne({ _id: req.params.id, user: req.user.id });

  if (!shopperAd) {
    return res.status(404).json({ message: 'Ad not found' });
  }

  // Update product information
  shopperAd.productImage = productImage;
  shopperAd.productPrice = productPrice;
  shopperAd.productWeight = productWeight;
  shopperAd.productPriceIDR = await CurrencyConverter.convertToIDR(productPrice, 'AUD');

  // Recalculate fees
  shopperAd.calculateFees()
    .then(function() {
      shopperAd.save()
        .then(function(updatedAd) {
          res.json(updatedAd);
        })
        .catch(function(error) {
          console.error('Error saving ad:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error calculating fees:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Get all active shopper ads
router.get('/active', function(req, res) {
  ShopperAd.find({ status: 'active' })
    .populate('user', 'username')
    .sort('-createdAt')
    .then(function(ads) {
      res.json(ads);
    })
    .catch(function(error) {
      console.error('Error fetching active shopper ads:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Get shopper ad details
router.get('/:id', function(req, res) {
  ShopperAd.findById(req.params.id)
    .populate('user', 'username')
    .populate('selectedTraveler', 'username')
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      res.json(ad);
    })
    .catch(function(error) {
      console.error('Error fetching shopper ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Traveler requests to help
router.post('/:id/request', [auth], function(req, res) {
  ShopperAd.findById(req.params.id)
    .then(function(ad) {
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
      chat.save()
        .then(function(savedChat) {
          ad.status = 'in_discussion';
          ad.selectedTraveler = req.user.id;
          ad.save()
            .then(function() {
              // Send email notification to shopper
              sendEmail({
                to: ad.user.email,
                subject: 'New Request for Your Shopping Ad',
                template: 'traveler-request',
                context: {
                  shopperName: ad.user.username,
                  travelerName: req.user.username,
                  productUrl: ad.productUrl
                }
              })
                .then(function() {
                  res.json({ message: 'Request sent successfully', chatId: savedChat._id });
                })
                .catch(function(error) {
                  console.error('Error sending email:', error);
                  res.status(500).json({ message: 'Server error' });
                });
            })
            .catch(function(error) {
              console.error('Error saving ad:', error);
              res.status(500).json({ message: 'Server error' });
            });
        })
        .catch(function(error) {
          console.error('Error saving chat:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Shopper accepts traveler
router.post('/:id/accept-traveler', [auth], function(req, res) {
  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'in_discussion') {
        return res.status(400).json({ message: 'Invalid ad status' });
      }

      ad.status = 'accepted';
      ad.save()
        .then(function() {
          // Send email notifications
          sendEmail({
            to: ad.selectedTraveler.email,
            subject: 'Your Request Has Been Accepted',
            template: 'request-accepted',
            context: {
              travelerName: ad.selectedTraveler.username,
              shopperName: ad.user.username,
              productUrl: ad.productUrl,
              shippingAddress: ad.shippingAddress.fullAddress
            }
          })
            .then(function() {
              res.json({ message: 'Traveler accepted successfully' });
            })
            .catch(function(error) {
              console.error('Error sending email:', error);
              res.status(500).json({ message: 'Server error' });
            });
        })
        .catch(function(error) {
          console.error('Error saving ad:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Update tracking number
router.patch('/:id/tracking', [auth], function(req, res) {
  const { trackingNumber } = req.body;

  ShopperAd.findOne({
    _id: req.params.id,
    selectedTraveler: req.user.id
  })
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      ad.trackingNumber = trackingNumber;
      ad.status = 'shipped';
      ad.save()
        .then(function() {
          // Send email notification to shopper
          sendEmail({
            to: ad.user.email,
            subject: 'Your Item Has Been Shipped',
            template: 'item-shipped',
            context: {
              shopperName: ad.user.username,
              trackingNumber,
              courier: ad.localCourier
            }
          })
            .then(function() {
              res.json({ message: 'Tracking number updated successfully' });
            })
            .catch(function(error) {
              console.error('Error sending email:', error);
              res.status(500).json({ message: 'Server error' });
            });
        })
        .catch(function(error) {
          console.error('Error saving ad:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Mark order as completed
router.patch('/:id/complete', [auth], function(req, res) {
  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'shipped') {
        return res.status(400).json({ message: 'Invalid ad status' });
      }

      ad.status = 'completed';
      ad.save()
        .then(function() {
          res.json({ message: 'Order marked as completed' });
        })
        .catch(function(error) {
          console.error('Error saving ad:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Cancel order
router.patch('/:id/cancel', [auth], function(req, res) {
  ShopperAd.findOne({
    _id: req.params.id,
    $or: [{ user: req.user.id }, { selectedTraveler: req.user.id }]
  })
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (!['in_discussion', 'accepted'].includes(ad.status)) {
        return res.status(400).json({ message: 'Cannot cancel at this stage' });
      }

      ad.status = 'cancelled';
      ad.save()
        .then(function() {
          const otherUser = req.user.id === ad.user.toString() ? ad.selectedTraveler : ad.user;
          sendEmail({
            to: otherUser.email,
            subject: 'Order Cancelled',
            template: 'order-cancelled',
            context: {
              userName: otherUser.username,
              productUrl: ad.productUrl
            }
          })
            .then(function() {
              res.json({ message: 'Order cancelled successfully' });
            })
            .catch(function(error) {
              console.error('Error sending email:', error);
              res.status(500).json({ message: 'Server error' });
            });
        })
        .catch(function(error) {
          console.error('Error saving ad:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

module.exports = router;
