const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ad = require('../models/Ad');
const { authenticateAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Admin credentials
const ADMIN_USERNAME = 'administrator';
const ADMIN_PASSWORD = '2a$10$7UF3RvDx9h5KKYs1bkUFo.4cghLkHC7fxVG80zipOiPInkq02Y90W'; // Media789

// Admin authentication endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username }); // Log for debugging

    // Validate credentials
    if (username !== ADMIN_USERNAME) {
      console.log('Invalid username'); // Log for debugging
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    if (password !== ADMIN_PASSWORD) {
      console.log(password);
      console.log(ADMIN_PASSWORD);
      console.log('Invalid password'); // Log for debugging
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Set session and send token
    req.session.isAdmin = true;
    res.json({ 
      success: true,
      token 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User management endpoints
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      email: 1,
      username: 1,
      firstName: 1,
      lastName: 1,
      whatsappNumber: 1,
      isActive: 1,
      isVerified: 1,
      isAdmin: 1,
      rating: 1,
      reviews: 1,
      totalReviews: 1,
      createdAt: 1,
      updatedAt: 1
    });
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users/:userId/toggle-verification', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({ isVerified: user.isVerified });
  } catch (error) {
    console.error('Error toggling user verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users/:userId/toggle-active', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ isActive: user.isActive });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { active, verified } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (typeof active === 'boolean') user.active = active;
    if (typeof verified === 'boolean') user.verified = verified;
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.patch('/users/:userId/whatsapp', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { whatsapp } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { whatsapp },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update whatsapp number' });
  }
});

// Set user active status directly
router.post('/users/set-active', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    console.error('Error setting user active:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ad management endpoints
router.get('/ads', authenticateAdmin, async (req, res) => {
  try {
    const ads = await Ad.find()
      .populate('user', 'name email whatsapp')
      .sort({ createdAt: -1 });
    
    // Check if ad should be shown on main page
    const now = new Date();
    ads.forEach(ad => {
      ad.active = ad.status === 'active' && new Date(ad.expiresAt) > now;
    });

    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

router.put('/ads/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.json(updatedAd);
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ message: 'Error updating ad' });
  }
});

router.patch('/ads/:adId/status', authenticateAdmin, async (req, res) => {
  try {
    const { adId } = req.params;
    const { active } = req.body;
    
    const ad = await Ad.findById(adId).populate('user', 'name email whatsapp');
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Set status based on toggle
    ad.status = active ? 'active' : 'expired';
    await ad.save();
    
    // Return whether it's actually showing on main page
    const now = new Date();
    ad.active = ad.status === 'active' && new Date(ad.expiresAt) > now;
    
    res.json(ad);
  } catch (error) {
    console.error('Error updating ad status:', error);
    res.status(500).json({ error: 'Failed to update ad status' });
  }
});

router.post('/ads', authenticateAdmin, async (req, res) => {
  try {
    const { userId, departureDate, customDisplayName, customRating, ...adData } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate expiresAt as 1 day before departure
    const departureDateObj = new Date(departureDate);
    const expiresAt = new Date(departureDateObj);
    expiresAt.setDate(departureDateObj.getDate() - 1);
    
    const ad = new Ad({
      ...adData,
      departureDate,
      expiresAt,
      user: userId,
      customDisplayName: customDisplayName || undefined,
      customRating: customRating || undefined,
      status: 'active',
      createdAt: new Date()
    });
    
    await ad.save();
    await ad.populate('user', 'name email whatsapp');
    
    res.status(201).json(ad);
  } catch (error) {
    console.error('Admin ad creation error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

module.exports = router;
