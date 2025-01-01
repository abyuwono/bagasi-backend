const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TrackingService = require('../services/trackingService');
const ShopperAd = require('../models/ShopperAd');

// Get tracking information
router.get('/:adId', auth, async (req, res) => {
  try {
    const { adId } = req.params;

    // Verify ad access
    const ad = await ShopperAd.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Check if user has access to this ad
    if (ad.user.toString() !== req.user.id && 
        ad.selectedTraveler?.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If tracking number exists, get latest tracking info
    if (ad.trackingNumber && ad.localCourier) {
      const tracking = await TrackingService.updateTrackingStatus(
        adId,
        ad.trackingNumber,
        ad.localCourier
      );
      return res.json(tracking);
    }

    return res.json(ad.tracking || { status: 'pending', history: [] });
  } catch (error) {
    console.error('Error getting tracking info:', error);
    res.status(500).json({ message: 'Failed to get tracking information' });
  }
});

// Update tracking number
router.post('/:adId/number', auth, async (req, res) => {
  try {
    const { adId } = req.params;
    const { trackingNumber } = req.body;

    // Verify ad access
    const ad = await ShopperAd.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Only traveler can update tracking number
    if (ad.selectedTraveler?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update tracking number and status
    ad.trackingNumber = trackingNumber;
    ad.status = 'shipped';
    
    // Get initial tracking info
    const tracking = await TrackingService.updateTrackingStatus(
      adId,
      trackingNumber,
      ad.localCourier
    );

    await ad.save();

    // Send email notification
    await sendEmail.sendOrderShippedEmail(ad.user, ad);

    res.json({ tracking, message: 'Tracking number updated successfully' });
  } catch (error) {
    console.error('Error updating tracking number:', error);
    res.status(500).json({ message: 'Failed to update tracking number' });
  }
});

// Get tracking URL
router.get('/:adId/url', auth, async (req, res) => {
  try {
    const { adId } = req.params;

    // Verify ad access
    const ad = await ShopperAd.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Check if user has access to this ad
    if (ad.user.toString() !== req.user.id && 
        ad.selectedTraveler?.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!ad.trackingNumber || !ad.localCourier) {
      return res.json({ url: null });
    }

    const url = TrackingService.getTrackingUrl(ad.localCourier, ad.trackingNumber);
    res.json({ url });
  } catch (error) {
    console.error('Error getting tracking URL:', error);
    res.status(500).json({ message: 'Failed to get tracking URL' });
  }
});

module.exports = router;
