const axios = require('axios');
const FormData = require('form-data');

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('Missing Cloudflare credentials in environment variables');
}

const uploadImageFromUrl = async (imageUrl) => {
  try {
    const formData = new FormData();
    formData.append('url', imageUrl);
    formData.append('metadata', JSON.stringify({ source: 'bagasi-marketplace' }));
    formData.append('requireSignedURLs', 'false');

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        imageUrl: response.data.result.variants[0],
        imageId: response.data.result.id
      };
    }

    return {
      success: false,
      error: 'Failed to upload image to Cloudflare'
    };
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadImageFromUrl
};
