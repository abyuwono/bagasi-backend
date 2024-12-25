const { Auth } = require('@vonage/auth');
const { Vonage } = require('@vonage/server-sdk');
const { Verify2 } = require('@vonage/verify2');

const credentials = {
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  applicationId: process.env.VONAGE_APPLICATION_ID
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
    console.error('Vonage OTP error:', error);
    throw error;
  }
};

const verifyVonageOTP = async (requestId, code) => {
  try {
    const response = await verify2.checkCode(requestId, code);
    return response;
  } catch (error) {
    console.error('Vonage verify error:', error);
    throw error;
  }
};

module.exports = {
  sendVonageOTP,
  verifyVonageOTP
};
