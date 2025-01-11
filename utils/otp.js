// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs with expiration time (10 minutes)
const otpStore = new Map();

function storeOTP(email, otp) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  otpStore.set(email, { otp, expiresAt });
}

function verifyOTP(email, otp) {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return false;
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  if (storedData.otp !== otp) {
    return false;
  }

  // OTP is valid, remove it so it can't be used again
  otpStore.delete(email);
  return true;
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
};
