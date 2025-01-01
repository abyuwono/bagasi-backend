const axios = require('axios');

class CurrencyConverter {
  constructor() {
    this.apiKey = process.env.FIXER_API_KEY;
    this.baseUrl = 'http://data.fixer.io/api';
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour in milliseconds
  }

  async getRate(from, to) {
    try {
      const cacheKey = `${from}_${to}`;
      const cachedRate = this.cache.get(cacheKey);

      if (cachedRate && cachedRate.timestamp > Date.now() - this.cacheTimeout) {
        return cachedRate.rate;
      }

      const response = await axios.get(`${this.baseUrl}/latest`, {
        params: {
          access_key: this.apiKey,
          base: from,
          symbols: to
        }
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch exchange rate');
      }

      const rate = response.data.rates[to];
      
      // Add 1.5% to the rate to mitigate exchange rate fluctuations
      const adjustedRate = rate * 1.015;

      this.cache.set(cacheKey, {
        rate: adjustedRate,
        timestamp: Date.now()
      });

      return adjustedRate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  }

  async convert(amount, from, to) {
    const rate = await this.getRate(from, to);
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  // Convert to IDR with 1.5% buffer
  async convertToIDR(amount, from) {
    return this.convert(amount, from, 'IDR');
  }

  // Convert from IDR with 1.5% buffer
  async convertFromIDR(amount, to) {
    return this.convert(amount, 'IDR', to);
  }
}

module.exports = new CurrencyConverter();
