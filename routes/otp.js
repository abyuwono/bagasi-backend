const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 5-minute expiration
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    // Set timeout to delete OTP after expiration
    setTimeout(() => {
      otpStore.delete(email);
    }, 5 * 60 * 1000);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify', (req, res) => {
  const { email, otp } = req.body;
  
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }
  
  if (storedData.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  // Clear the OTP after successful verification
  otpStore.delete(email);
  
  res.json({ message: 'OTP verified successfully' });
});

module.exports = router;
