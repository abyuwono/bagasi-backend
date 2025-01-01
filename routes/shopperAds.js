const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShopperAd = require('../models/ShopperAd');
const ProductScraper = require('../services/productScraper');
const CurrencyConverter = require('../services/currencyConverter');
const { sendEmail } = require('../services/emailService');
const Chat = require('../models/Chat');

// Get all active shopper ads
router.get('/active', getActiveAds);

function getActiveAds(req, res) {
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
}

// Get shopper ad details
router.get('/:id', getAdDetails);

function getAdDetails(req, res) {
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
}

// Create a draft shopper ad
router.post('/draft', [auth], createDraft);

function createDraft(req, res) {
  const { productUrl, shippingAddress, localCourier, notes } = req.body;

  if (!ShopperAd.isValidWebsite(productUrl)) {
    return res.status(400).json({ message: 'Unsupported website' });
  }

  ProductScraper.scrapeProduct(productUrl)
    .then(function(productInfo) {
      if (!productInfo) {
        return res.status(400).json({ message: 'Failed to fetch product information' });
      }

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
}

// Update product information manually
router.patch('/draft/:id/product-info', [auth], updateProductInfo);

function updateProductInfo(req, res) {
  const { productImage, productPrice, productWeight } = req.body;

  ShopperAd.findOne({ _id: req.params.id, user: req.user.id })
    .then(function(shopperAd) {
      if (!shopperAd) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      shopperAd.productImage = productImage;
      shopperAd.productPrice = productPrice;
      shopperAd.productWeight = productWeight;

      CurrencyConverter.convertToIDR(productPrice, 'AUD')
        .then(function(productPriceIDR) {
          shopperAd.productPriceIDR = productPriceIDR;
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
        })
        .catch(function(error) {
          console.error('Error converting price:', error);
          res.status(500).json({ message: 'Server error' });
        });
    })
    .catch(function(error) {
      console.error('Error finding ad:', error);
      res.status(500).json({ message: 'Server error' });
    });
}

// Traveler requests to help
router.post('/:id/request', [auth], requestToHelp);

function requestToHelp(req, res) {
  let adRef;

  ShopperAd.findById(req.params.id)
    .then(function(ad) {
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      if (ad.status !== 'active') {
        return res.status(400).json({ message: 'Ad is not available' });
      }

      adRef = ad;
      const chat = new Chat({
        shopperAd: ad._id,
        shopper: ad.user,
        traveler: req.user.id
      });

      chat.save()
        .then(function(savedChat) {
          adRef.status = 'in_discussion';
          adRef.selectedTraveler = req.user.id;
          adRef.save()
            .then(function() {
              sendEmail({
                to: adRef.user.email,
                subject: 'New Request for Your Shopping Ad',
                template: 'traveler-request',
                context: {
                  shopperName: adRef.user.username,
                  travelerName: req.user.username,
                  productUrl: adRef.productUrl
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
}

// Shopper accepts traveler
router.post('/:id/accept-traveler', [auth], acceptTraveler);

function acceptTraveler(req, res) {
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
}

// Update tracking number
router.patch('/:id/tracking', [auth], updateTracking);

function updateTracking(req, res) {
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
}

// Mark order as completed
router.patch('/:id/complete', [auth], completeOrder);

function completeOrder(req, res) {
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
}

// Cancel order
router.patch('/:id/cancel', [auth], cancelOrder);

function cancelOrder(req, res) {
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
}

module.exports = router;
