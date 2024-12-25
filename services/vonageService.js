const { Auth } = require('@vonage/auth');
const { Vonage } = require('@vonage/server-sdk');
const { Verify2 } = require('@vonage/verify2');

const credentials = {
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY
};

const vonage = new Vonage(credentials);
const verify2 = new Verify2(credentials);

const sendVonageOTP = async (phoneNumber) => {
  try {
    // Try to get active verification for this number
    try {
      const activeVerifications = await verify2.search({ to: phoneNumber });
      if (activeVerifications && activeVerifications.length > 0) {
        // Cancel the active verification
        for (const verification of activeVerifications) {
          if (verification.status !== 'COMPLETED' && verification.status !== 'CANCELLED') {
            await verify2.cancel(verification.request_id);
          }
        }
      }
    } catch (error) {
      console.warn('Error checking/canceling active verifications:', error);
    }

    // Create new verification request
    const response = await verify2.newRequest({
      brand: "BAGASI",
      workflow: [
        {
          channel: "sms",
          to: phoneNumber
        }
      ]
    });
    return response;
  } catch (error) {
    console.error('Vonage OTP error:', error);
    throw error;
  }
};

const verifyVonageOTP = async (requestId, code) => {
  try {
    const response = await verify2.checkCode({
      request_id: requestId,
      code: code
    });
    return response.status === 'COMPLETED';
  } catch (error) {
    console.error('Vonage verify error:', error);
    return false;
  }
};

module.exports = {
  sendVonageOTP,
  verifyVonageOTP
};
