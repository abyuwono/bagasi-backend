const { Verify2Client } = require('@vonage/verify2');

const client = new Verify2Client({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

const sendVonageOTP = async (phoneNumber) => {
  try {
    const response = await client.newRequest({
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
    const response = await client.checkCode(requestId, code);
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
