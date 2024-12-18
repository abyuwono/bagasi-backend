const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ad = require('../models/Ad');
const { authenticateAdmin } = require('../middleware/auth');
const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');

// Admin authentication endpoints
router.post('/auth/generate-auth-options', async (req, res) => {
  try {
    console.log('Generating auth options...');
    console.log('Session:', req.session);
    
    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || 'bagasi.id',
      allowCredentials: [], // Add stored credentials
      userVerification: 'preferred',
    });
    
    // Store challenge for verification
    if (!req.session) {
      console.log('Creating new session');
      req.session = {};
    }
    req.session.challenge = options.challenge;
    console.log('Challenge stored:', req.session.challenge);
    
    res.json(options);
  } catch (error) {
    console.error('Generate auth options error:', error);
    res.status(500).json({ error: 'Failed to generate authentication options', details: error.message });
  }
});

router.post('/auth/verify', async (req, res) => {
  try {
    console.log('Verifying auth...');
    console.log('Session:', req.session);
    console.log('Challenge:', req.session?.challenge);
    
    const { credential } = req.body;
    
    if (!req.session || !req.session.challenge) {
      return res.status(400).json({ error: 'No challenge found. Please try again.' });
    }
    
    const expectedChallenge = req.session.challenge;
    
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge,
      expectedOrigin: process.env.ORIGIN || 'https://market.bagasi.id',
      expectedRPID: process.env.RP_ID || 'bagasi.id',
    });
    
    if (verification.verified) {
      if (!req.session) {
        req.session = {};
      }
      req.session.isAdmin = true;
      console.log('Authentication successful');
      res.json({ success: true });
    } else {
      console.log('Authentication failed');
      res.status(401).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
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
    const ads = await Ad.find().populate('user', 'name email whatsapp');
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

router.patch('/ads/:adId/status', authenticateAdmin, async (req, res) => {
  try {
    const { adId } = req.params;
    const { active } = req.body;
    
    const ad = await Ad.findByIdAndUpdate(
      adId,
      { active },
      { new: true }
    ).populate('user', 'name email whatsapp');
    
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ad status' });
  }
});

router.post('/ads', authenticateAdmin, async (req, res) => {
  try {
    const { userId, ...adData } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const ad = new Ad({
      ...adData,
      user: userId,
      active: true,
      createdAt: new Date()
    });
    
    await ad.save();
    await ad.populate('user', 'name email whatsapp');
    
    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

module.exports = router;
