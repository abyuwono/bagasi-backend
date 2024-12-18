const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ad = require('../models/Ad');
const { authenticateAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin credentials
const ADMIN_USERNAME = 'administrator';
const ADMIN_PASSWORD = '$2a$10$4602FSQjX3R8WOgSj7F4BuL2jq2Mf.gWGvmihgy/yXceIjknbQiUK';

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
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD);
    console.log('Password validation:', { isValidPassword }); // Log for debugging
    
    if (!isValidPassword) {
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
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
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
    const { userId, departureDate, ...adData } = req.body;
    
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
      active: true,
      createdAt: new Date()
    });
    
    await ad.save();
    await ad.populate('user', 'name email whatsapp');
    
    res.status(201).json(ad);
  } catch (error) {
    console.error('Admin ad creation error:', error); // Add error logging
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

module.exports = router;
