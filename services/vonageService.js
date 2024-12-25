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
    
    const requestId = response && (response.request_id || response.requestId);
    return { request_id: requestId };
  } catch (error) {
    if (error.response?.status === 409) {
      return { request_id: 'existing' };
    }
    throw error;
  }
};

const verifyVonageOTP = async (requestId, code) => {
  try {
    if (!requestId || !code) {
      return false;
    }

    if (requestId === 'existing') {
      return false;
    }

    try {
      const response = await verify2.checkCode(requestId, code);
      if (!response) {
        return false;
      }
      
      const status = typeof response === 'string' ? response : response.status;
      return status === 'COMPLETED' || status === 'completed';
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = {
  sendVonageOTP,
  verifyVonageOTP
};
