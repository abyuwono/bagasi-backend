const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { generateOTP, saveOTP, validateOTP } = require('../utils/otp');
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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    // Explicitly select the password field
    const user = await User.findOne({ email }).select('+password +active +isActive');
    
    // Use the same error message for both cases to prevent user enumeration
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is deactivated after successful password check
    if (!user.active) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin untuk informasi lebih lanjut.' });
    }

    const token = jwt.sign({ userId: user._id, isAdmin: user.role === 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '24h',
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
    await saveOTP(email.toLowerCase(), otp);

    // Send OTP email
    await emailService.sendOTPEmail(email.toLowerCase(), otp);

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

    // Validate OTP
    const isValidOTP = await validateOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;