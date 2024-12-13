const express = require('express');
const Ad = require('../models/Ad');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Create ad (travelers only)
router.post('/', auth, checkRole(['traveler']), async (req, res) => {
  try {
    const {
      departureCity,
      arrivalCity,
      departureDate,
      returnDate,
      availableWeight,
      pricePerKg,
      additionalNotes,
    } = req.body;

    // Set expiration date to 1 day before departure
    const expiresAt = new Date(departureDate);
    expiresAt.setDate(expiresAt.getDate() - 1);

    const ad = new Ad({
      user: req.user._id,
      departureCity,
      arrivalCity,
      departureDate,
      returnDate,
      availableWeight,
      pricePerKg,
      additionalNotes,
      expiresAt,
    });

    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ message: 'Error creating ad', error: error.message });
  }
});

// Get all ads with filters
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/ads - Fetching ads');
    const {
      departureCity,
      arrivalCity,
      departureDate,
      minWeight,
      maxPrice,
    } = req.query;

    const query = {
      status: 'active',
      expiresAt: { $gt: new Date() },
    };

    if (departureCity) query.departureCity = new RegExp(departureCity, 'i');
    if (arrivalCity) query.arrivalCity = new RegExp(arrivalCity, 'i');
    if (departureDate) {
      const date = new Date(departureDate);
      query.departureDate = {
        $gte: date,
        $lt: new Date(date.setDate(date.getDate() + 1)),
      };
    }
    if (minWeight) query.availableWeight = { $gte: Number(minWeight) };
    if (maxPrice) query.pricePerKg = { $lte: Number(maxPrice) };

    console.log('Query:', JSON.stringify(query, null, 2));

    const ads = await Ad.find(query)
      .populate('user', 'username email whatsappNumber rating totalReviews isVerified')
      .sort({ createdAt: -1 });

    console.log(`Found ${ads.length} ads`);
    if (ads.length > 0) {
      console.log('Sample ad user:', JSON.stringify(ads[0].user, null, 2));
    }
    
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ 
      message: 'Error fetching ads', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Get single ad
router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('user', 'username email whatsappNumber rating totalReviews isVerified');
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ message: 'Error fetching ad', error: error.message });
  }
});

// Update ad status (travelers only)
router.patch('/:id/status', auth, checkRole(['traveler']), async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await Ad.findOne({ _id: req.params.id, user: req.user._id });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.status = status;
    if (status === 'completed') {
      ad.completedAt = new Date();
    }

    await ad.save();
    res.json(ad);
  } catch (error) {
    console.error('Error updating ad status:', error);
    res.status(500).json({ message: 'Error updating ad status', error: error.message });
  }
});

// Delete ad (travelers only)
router.delete('/:id', auth, checkRole(['traveler']), async (req, res) => {
  try {
    const ad = await Ad.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
    });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found or cannot be deleted' });
    }

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Error deleting ad', error: error.message });
  }
});

// Handle 404 for unknown routes
router.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found', 
    requestedPath: req.path,
    method: req.method,
    availableRoutes: [
      { path: '/', method: 'GET', description: 'Get all ads' },
      { path: '/:id', method: 'GET', description: 'Get single ad' },
      { path: '/', method: 'POST', description: 'Create new ad (travelers only)' },
      { path: '/:id/book', method: 'POST', description: 'Book an ad' },
      { path: '/:id/status', method: 'PATCH', description: 'Update ad status (travelers only)' }
    ]
  });
});

module.exports = router;