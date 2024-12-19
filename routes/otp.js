const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const { sendWhatsAppOTP } = require('../services/whatsappService');

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Email OTP
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

// Send WhatsApp OTP
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 5-minute expiration
    otpStore.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send WhatsApp OTP
    await sendWhatsAppOTP(phoneNumber, otp);

    // Set timeout to delete OTP after expiration
    setTimeout(() => {
      otpStore.delete(phoneNumber);
    }, 5 * 60 * 1000);

    res.json({ message: 'WhatsApp OTP sent successfully' });
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp OTP' });
  }
});

// Verify OTP (works for both email and WhatsApp)
router.post('/verify', (req, res) => {
  const { email, phoneNumber, otp } = req.body;
  
  const key = email || phoneNumber;
  const storedData = otpStore.get(key);
  
  if (!storedData) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }
  
  if (storedData.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  // Clear the OTP after successful verification
  otpStore.delete(key);
  
  res.json({ message: 'OTP verified successfully' });
});

module.exports = router;
