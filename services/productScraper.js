const axios = require('axios');
const cheerio = require('cheerio');

class ProductScraper {
  static async scrapeProduct(url) {
    try {
      const domain = new URL(url).hostname;
      let scraper;

      switch (domain) {
        case 'www.amazon.com.au':
          scraper = this.scrapeAmazon;
          break;
        case 'www.chemistwarehouse.com.au':
          scraper = this.scrapeChemistWarehouse;
          break;
        case 'www.ebay.com.au':
          scraper = this.scrapeEbay;
          break;
        case 'www.coles.com.au':
          scraper = this.scrapeColes;
          break;
        case 'www.woolworths.com.au':
          scraper = this.scrapeWoolworths;
          break;
        default:
          throw new Error('Unsupported website');
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      return await scraper(response.data);
    } catch (error) {
      console.error('Error scraping product:', error);
      return null;
    }
  }

  static async scrapeAmazon(html) {
    const $ = cheerio.load(html);
    return {
      name: $('#productTitle').text().trim(),
      image: $('#landingImage').attr('src'),
      price: parseFloat($('#priceblock_ourprice').text().replace('$', '').trim()),
      weight: this.extractWeight($('#productDetails_detailBullets_sections1 tr').text())
    };
  }

  static async scrapeChemistWarehouse(html) {
    const $ = cheerio.load(html);
    return {
      name: $('.product-name h1').text().trim(),
      image: $('.product-image img').attr('src'),
      price: parseFloat($('.product-price').text().replace('$', '').trim()),
      weight: this.extractWeight($('.product-details').text())
    };
  }

  static async scrapeEbay(html) {
    const $ = cheerio.load(html);
    return {
      name: $('#itemTitle').text().replace('Details about', '').trim(),
      image: $('#icImg').attr('src'),
      price: parseFloat($('#prcIsum').text().replace('AU $', '').trim()),
      weight: this.extractWeight($('#itemSpecifics').text())
    };
  }

  static async scrapeColes(html) {
    const $ = cheerio.load(html);
    return {
      name: $('.product-title').text().trim(),
      image: $('.product-image img').attr('src'),
      price: parseFloat($('.product-price').text().replace('$', '').trim()),
      weight: this.extractWeight($('.product-details').text())
    };
  }

  static async scrapeWoolworths(html) {
    const $ = cheerio.load(html);
    return {
      name: $('.product-title').text().trim(),
      image: $('.product-image img').attr('src'),
      price: parseFloat($('.product-price').text().replace('$', '').trim()),
      weight: this.extractWeight($('.product-details').text())
    };
  }

  static extractWeight(text) {
    const weightRegex = /(\d+(?:\.\d+)?)\s*(g|kg|ml|L)/i;
    const match = text.match(weightRegex);
    
    if (!match) return null;
    
    const [, value, unit] = match;
    let weightInGrams = parseFloat(value);
    
    switch (unit.toLowerCase()) {
      case 'kg':
        weightInGrams *= 1000;
        break;
      case 'l':
        weightInGrams *= 1000;
        break;
      case 'ml':
        weightInGrams = weightInGrams;
        break;
    }
    
    return weightInGrams;
  }
}

module.exports = ProductScraper;
