const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const { sendWhatsAppOTP } = require('../services/whatsappService');
const User = require('../models/User'); 

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to store
const saveOTP = async (key, otp) => {
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  setTimeout(() => {
    otpStore.delete(key);
  }, 5 * 60 * 1000);
};

// Send Email OTP
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const otp = generateOTP();
    await saveOTP(email, otp);
    await sendOTPEmail(email, otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Send WhatsApp OTP
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Check if phone number exists
    const existingUser = await User.findOne({ whatsappNumber: phoneNumber });
    if (existingUser) {
      return res.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar. Silahkan login atau gunakan nomor lain.' });
    }

    const otp = generateOTP();
    await saveOTP(phoneNumber, otp);
    await sendWhatsAppOTP(phoneNumber, otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    const key = email || phoneNumber;
    const storedData = otpStore.get(key);

    if (!storedData || storedData.otp !== otp || Date.now() > storedData.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    otpStore.delete(key);
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

// Add check email existence
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }
    res.status(200).json({ message: 'Email tersedia' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add check phone existence
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const existingUser = await User.findOne({ whatsappNumber: phoneNumber });
    if (existingUser) {
      return res.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar. Silahkan login atau gunakan nomor lain.' });
    }
    res.status(200).json({ message: 'Nomor tersedia' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
