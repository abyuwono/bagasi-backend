const axios = require('axios');

const CRAWLBASE_TOKEN = 'Phq9Fu6eQCvNEv0VLAcOhQ';
const FIXER_API_KEY = 'Xnv2dwXCvIfGTgTbmXWuuilGkF2cft4X';
const MARKUP_PERCENTAGE = 3.8; // 3.8% markup on currency conversion

// Map domains to shop names
const SHOP_NAMES = {
  'woolworths.com.au': 'Woolworths',
  'coles.com.au': 'Coles',
  'chemistwarehouse.com.au': 'Chemist Warehouse',
  'amazon.com.au': 'Amazon Australia',
  'ebay.com.au': 'eBay Australia'
};

function getShopName(url) {
  try {
    // Extract domain without www.
    const domain = url.toLowerCase()
                     .replace('https://', '')
                     .replace('http://', '')
                     .replace('www.', '')
                     .split('/')[0];
    return SHOP_NAMES[domain] || 'Unknown Shop';
  } catch (error) {
    return 'Unknown Shop';
  }
}

function roundUpToThousand(number) {
  return Math.ceil(number / 1000) * 1000;
}

async function convertCurrency(amount, from = 'AUD', to = 'IDR') {
  try {
    const url = `https://api.apilayer.com/fixer/convert?to=${to}&from=${from}&amount=${amount}`;
    const response = await axios.get(url, {
      headers: {
        'apikey': FIXER_API_KEY
      }
    });
    
    // Apply 3.8% markup
    const rateWithMarkup = response.data.result * (1 + MARKUP_PERCENTAGE / 100);
    
    // Round up to the nearest thousand
    return roundUpToThousand(rateWithMarkup);
  } catch (error) {
    console.error('Error converting currency:', error.message);
    // Fallback to approximate conversion if API fails
    const fallbackRate = 10000; // Approximate AUD to IDR rate
    const rateWithMarkup = (amount * fallbackRate) * (1 + MARKUP_PERCENTAGE / 100);
    return roundUpToThousand(rateWithMarkup);
  }
}

async function crawlWoolworthsProduct(productUrl) {
  try {
    // Get shop name from URL
    const shopName = getShopName(productUrl);
    
    // Extract product ID from URL
    const productId = productUrl.split('/').pop();
    
    // First try to get product data from the public API
    console.log('Fetching product data from API...');
    const apiUrl = `https://www.woolworths.com.au/api/v3/ui/schemaorg/product/${productId}`;
    
    try {
      const apiResponse = await axios.get(apiUrl);
      const productData = apiResponse.data;
      const productPrice = parseFloat(productData.offers.price);
      
      // Get merchant name from brand or seller
      const merchantName = productData.brand?.name || 
                         productData.offers?.seller?.name || 
                         'Woolworths';
      
      // Convert price to IDR using Fixer API
      const productPriceIDR = await convertCurrency(productPrice);
      
      const formattedData = {
        productUrl,
        productName: productData.name,
        productImage: productData.image,
        productPrice,
        productWeight: extractWeight(productData.name),
        productPriceIDR,
        website: 'woolworths.com.au',
        merchantName,
        shopName
      };

      console.log('Product data from API:', JSON.stringify(formattedData, null, 2));
      return formattedData;
    } catch (apiError) {
      console.log('API request failed, falling back to page scraping...');
      
      // Fallback to page scraping if API fails
      const encodedUrl = encodeURIComponent(productUrl);
      const crawlbaseUrl = `https://api.crawlbase.com/?token=${CRAWLBASE_TOKEN}&url=${encodedUrl}&js_render=true&wait=5000`;

      const response = await axios.get(crawlbaseUrl);
      const html = response.data;

      // Extract data using regex
      const productName = extractMetaContent(html, 'title') || '';
      const productImage = extractMetaContent(html, 'og:image') || '';
      
      // Try different price extraction methods
      let productPrice = 0;
      
      // Method 1: Look for price in data attributes
      const priceMatch = html.match(/data-price="(\d+\.?\d*)"/i) ||
                        html.match(/data-product-price="(\d+\.?\d*)"/i);
      
      if (priceMatch) {
        productPrice = parseFloat(priceMatch[1]);
      } else {
        // Method 2: Look for price in specific elements
        const priceDivMatch = html.match(/class="price"[^>]*>[\$\s]*(\d+\.?\d*)/i);
        if (priceDivMatch) {
          productPrice = parseFloat(priceDivMatch[1]);
        }
      }

      // Try to extract merchant name
      const merchantMatch = html.match(/data-brand="([^"]+)"/i) ||
                          html.match(/class="product-brand"[^>]*>([^<]+)</i);
      const merchantName = merchantMatch ? merchantMatch[1].trim() : 'Woolworths';

      // Convert price to IDR using Fixer API
      const productPriceIDR = await convertCurrency(productPrice);

      const productData = {
        productUrl,
        productName: productName.replace(' | Woolworths', ''),
        productImage,
        productPrice,
        productWeight: extractWeight(productName),
        productPriceIDR,
        website: 'woolworths.com.au',
        merchantName,
        shopName
      };

      console.log('Product data from scraping:', JSON.stringify(productData, null, 2));
      return productData;
    }
  } catch (error) {
    console.error('Error crawling product:', error.message);
    throw error;
  }
}

function extractMetaContent(html, property) {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractWeight(name) {
  const weightRegex = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pack|capsules)\b/i;
  const match = name.match(weightRegex);
  
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 'kg':
        return value;
      case 'g':
        return value / 1000;
      case 'l':
        return value;
      case 'ml':
        return value / 1000;
      case 'pack':
      case 'capsules':
        // For packs/capsules, estimate weight based on quantity
        return (value * 0.001); // Assume 1g per capsule/item
    }
  }

  // Default weight if not found
  return 0.5;
}

// Example usage
const testUrl = 'https://www.woolworths.com.au/shop/productdetails/771858';

// Run the crawler
crawlWoolworthsProduct(testUrl)
  .then(data => console.log('Crawled data:', JSON.stringify(data, null, 2)))
  .catch(error => console.error('Error:', error));

module.exports = { crawlWoolworthsProduct };
