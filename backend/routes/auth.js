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
    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    // Explicitly select the password and active fields
    const user = await User.findOne({ email }).select('+password +active');
    console.log('Found user:', user ? { email: user.email, active: user.active } : null);
    
    // Use the same error message for both cases to prevent user enumeration
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Check if active is undefined, treat as active
    if (user.active === undefined) {
      user.active = true;
      await user.save();
      console.log('Set default active status for user:', user.email);
    }

    // Check if account is deactivated after successful password check
    if (user.active === false) {
      console.log('User account is deactivated:', email);
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin untuk informasi lebih lanjut.' });
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

// Logout
router.post('/logout', async (req, res) => {
  try {
    // Reset any session data
    if (req.session) {
      req.session.destroy();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
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