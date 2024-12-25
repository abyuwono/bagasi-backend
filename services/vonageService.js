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
    if (error.response?.status === 409) {
      // If there's a conflict, just return success so the user can use the existing OTP
      return { request_id: 'existing' };
    }
    console.error('Vonage OTP error:', error);
    throw error;
  }
};

const verifyVonageOTP = async (requestId, code) => {
  try {
    if (requestId === 'existing') {
      // For existing OTP requests, just try to verify
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
    }

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
