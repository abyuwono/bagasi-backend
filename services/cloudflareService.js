const axios = require('axios');
const FormData = require('form-data');

// Use environment variables
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

const uploadImageFromUrl = async (imageUrl) => {
  try {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Cloudflare credentials not found in environment variables');
    }

    // Download the image first
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data, 'binary');

    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'product-image.jpg',
      contentType: 'image/jpeg'
    });

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
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
