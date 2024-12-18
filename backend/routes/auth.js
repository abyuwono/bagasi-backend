const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, whatsappNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      email,
      password,
      role,
      whatsappNumber,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        whatsappNumber: user.whatsappNumber,
        membership: user.membership,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    // Explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    
    // Use the same error message for both cases to prevent user enumeration
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        whatsappNumber: user.whatsappNumber,
        membership: user.membership,
        isVerified: user.isVerified,
        username: user.username,
        rating: user.rating,
        totalReviews: user.totalReviews,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Gagal masuk ke sistem', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        whatsappNumber: user.whatsappNumber,
        membership: user.membership,
        isVerified: user.isVerified,
        username: user.username,
        rating: user.rating,
        totalReviews: user.totalReviews,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

module.exports = router;