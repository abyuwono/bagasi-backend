const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otp');
const EmailService = require('../services/emailService');
const emailService = new EmailService();

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
    console.log('Login attempt for email:', email);

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    console.log('Found user:', user.email);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', user.email);
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Create token
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log('Login successful for user:', user.email);
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat login' });
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

// Request password reset
router.post('/request-reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return 200 even if user not found to prevent user enumeration
      return res.status(200).json({ message: 'Jika email terdaftar, Anda akan menerima kode OTP.' });
    }

    // Generate OTP
    const otp = generateOTP();
    await storeOTP(email.toLowerCase(), otp);

    // Send OTP email
    await emailService.sendOTPEmail(email.toLowerCase(), otp, 'reset');

    res.status(200).json({ message: 'Jika email terdaftar, Anda akan menerima kode OTP.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan. Silakan coba lagi nanti.' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    console.log('Reset password request for email:', email);

    // Validate OTP
    const isValidOTP = verifyOTP(email.toLowerCase(), otp);
    if (!isValidOTP) {
      console.log('Invalid OTP for email:', email);
      return res.status(400).json({ message: 'Kode OTP tidak valid atau sudah kadaluarsa' });
    }

    // Find user and update password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    console.log('Found user:', user.email);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password directly in the database to avoid double hashing
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    console.log('Password updated for user:', user.email);

    res.status(200).json({ message: 'Password berhasil direset' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mereset password' });
  }
});

module.exports = router;