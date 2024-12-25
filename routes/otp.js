const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const { sendWhatsAppOTP } = require('../services/whatsappService');
const { sendVonageOTP, verifyVonageOTP } = require('../services/vonageService');
const User = require('../models/User'); 

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to store
const saveOTP = async (key, otp, requestId = null) => {
  console.log('[OTP] Saving OTP data:', { key, otp, requestId });
  otpStore.set(key, {
    otp,
    requestId,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  const stored = otpStore.get(key);
  console.log('[OTP] Stored data:', stored);
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
    console.error('[OTP] Send error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Send WhatsApp/SMS OTP
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Check if phone number exists
    const existingUser = await User.findOne({ whatsappNumber: phoneNumber });
    if (existingUser) {
      return res.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar. Silahkan login atau gunakan nomor lain.' });
    }

    // Check if it's an Indonesian number
    if (phoneNumber.startsWith('+62')) {
      // Use Zenziva for Indonesian numbers
      const otp = generateOTP();
      await saveOTP(phoneNumber, otp);
      await sendWhatsAppOTP(phoneNumber, otp);
    } else {
      // Use Vonage for international numbers
      const response = await sendVonageOTP(phoneNumber);
      console.log('[OTP] Vonage response:', response);
      await saveOTP(phoneNumber, null, response.request_id);
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('[OTP] Send error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    const key = email || phoneNumber;
    const storedData = otpStore.get(key);

    console.log('[OTP] Verifying OTP for:', key);
    console.log('[OTP] Stored data:', storedData);
    console.log('[OTP] Received OTP:', otp);

    if (!storedData || Date.now() > storedData.expiresAt) {
      console.log('[OTP] Invalid or expired OTP - No stored data or expired');
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (phoneNumber && !phoneNumber.startsWith('+62')) {
      console.log('[OTP] Using Vonage verification with requestId:', storedData.requestId);
      if (!storedData.requestId) {
        console.log('[OTP] No Vonage request ID found');
        return res.status(400).json({ message: 'Invalid OTP request' });
      }
      const isValid = await verifyVonageOTP(storedData.requestId, otp);
      if (!isValid) {
        console.log('[OTP] Invalid Vonage OTP');
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    } else if (!storedData.otp || storedData.otp !== otp) {
      console.log('[OTP] Invalid local OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(key);
    console.log('[OTP] Verification successful');
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('[OTP] Verification error:', error);
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
    console.error('[OTP] Check email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add check phone existence
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const existingUser = await User.findOne({ whatsappNumber: phoneNumber });
    if (existingUser) {
      return res.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar' });
    }
    res.status(200).json({ message: 'Nomor WhatsApp tersedia' });
  } catch (error) {
    console.error('[OTP] Check phone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
