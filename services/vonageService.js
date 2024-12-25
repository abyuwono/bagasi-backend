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
    console.log('[Vonage] Sending OTP to:', phoneNumber);
    const response = await verify2.newRequest({
      brand: "BAGASI",
      workflow: [
        {
          channel: "sms",
          to: phoneNumber
        }
      ]
    });
    console.log('[Vonage] Raw response:', response);
    const requestId = response?.request_id;
    console.log('[Vonage] Extracted request_id:', requestId);
    
    if (!requestId) {
      throw new Error('No request_id in Vonage response');
    }
    
    return { request_id: requestId };
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('[Vonage] Conflict error - OTP already sent');
      return { request_id: 'existing' };
    }
    console.error('[Vonage] Send OTP error:', error);
    console.error('[Vonage] Error response:', error.response?.data);
    throw error;
  }
};

const verifyVonageOTP = async (requestId, code) => {
  try {
    console.log('[Vonage] Verifying OTP - Request ID:', requestId, 'Code:', code);
    
    if (requestId === 'existing') {
      console.log('[Vonage] Cannot verify with existing request ID');
      return false;
    }

    try {
      const response = await verify2.checkCode(requestId, code);
      console.log('[Vonage] Verify response:', JSON.stringify(response, null, 2));
      
      if (!response) {
        console.log('[Vonage] Empty response from verify');
        return false;
      }
      
      console.log('[Vonage] Verify status:', response.status);
      return response.status === 'COMPLETED';
    } catch (error) {
      console.error('[Vonage] Verify error:', error);
      console.error('[Vonage] Error response:', error.response?.data);
      return false;
    }
  } catch (error) {
    console.error('[Vonage] Outer verify error:', error);
    return false;
  }
};

module.exports = {
  sendVonageOTP,
  verifyVonageOTP
};
