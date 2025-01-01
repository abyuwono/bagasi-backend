const axios = require('axios');
const ShopperAd = require('../models/ShopperAd');
const { sendEmail } = require('./emailService');

class TrackingService {
  constructor() {
    this.courierApis = {
      'JNE': {
        baseUrl: process.env.JNE_API_URL,
        key: process.env.JNE_API_KEY
      },
      'J&T Express': {
        baseUrl: process.env.JNT_API_URL,
        key: process.env.JNT_API_KEY
      },
      // Add other courier APIs as needed
    };
  }

  async updateTrackingStatus(adId, trackingNumber, courier) {
    try {
      const ad = await ShopperAd.findById(adId);
      if (!ad) {
        throw new Error('Ad not found');
      }

      // Get tracking info from courier API
      const trackingInfo = await this.getTrackingInfo(trackingNumber, courier);
      
      // Update tracking history
      ad.tracking = {
        ...ad.tracking,
        status: trackingInfo.status,
        lastUpdate: new Date(),
        history: [...(ad.tracking?.history || []), {
          status: trackingInfo.status,
          location: trackingInfo.location,
          timestamp: trackingInfo.timestamp,
          description: trackingInfo.description
        }]
      };

      // Check if package is delivered
      if (trackingInfo.status === 'delivered' && ad.status === 'shipped') {
        ad.status = 'delivered';
        // Send email notification
        await sendEmail.sendOrderDeliveredEmail(ad.user, ad);
      }

      await ad.save();
      return ad.tracking;
    } catch (error) {
      console.error('Error updating tracking status:', error);
      throw error;
    }
  }

  async getTrackingInfo(trackingNumber, courier) {
    try {
      const courierConfig = this.courierApis[courier];
      if (!courierConfig) {
        // Return basic tracking info for unsupported couriers
        return {
          status: 'in_transit',
          location: 'N/A',
          timestamp: new Date(),
          description: 'Package is in transit'
        };
      }

      // Make API call to courier service
      const response = await axios.get(`${courierConfig.baseUrl}/track`, {
        params: {
          tracking_number: trackingNumber
        },
        headers: {
          'Authorization': `Bearer ${courierConfig.key}`
        }
      });

      // Map courier response to our standard format
      return this.mapCourierResponse(response.data, courier);
    } catch (error) {
      console.error(`Error getting tracking info from ${courier}:`, error);
      throw error;
    }
  }

  mapCourierResponse(response, courier) {
    // Map different courier API responses to a standard format
    switch (courier) {
      case 'JNE':
        return {
          status: this.mapJNEStatus(response.cnote.pod_status),
          location: response.cnote.pod_city || 'N/A',
          timestamp: new Date(response.cnote.pod_date),
          description: response.cnote.pod_desc || ''
        };

      case 'J&T Express':
        return {
          status: this.mapJNTStatus(response.status),
          location: response.location || 'N/A',
          timestamp: new Date(response.timestamp),
          description: response.description || ''
        };

      default:
        return {
          status: 'in_transit',
          location: 'N/A',
          timestamp: new Date(),
          description: 'Package is in transit'
        };
    }
  }

  mapJNEStatus(status) {
    const statusMap = {
      'ON PROCESS': 'in_transit',
      'ON DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'PROBLEM': 'exception'
    };
    return statusMap[status] || 'in_transit';
  }

  mapJNTStatus(status) {
    const statusMap = {
      'Pickup': 'picked_up',
      'In Transit': 'in_transit',
      'Out For Delivery': 'out_for_delivery',
      'Delivered': 'delivered',
      'Exception': 'exception'
    };
    return statusMap[status] || 'in_transit';
  }

  getTrackingUrl(courier, trackingNumber) {
    const courierUrls = {
      'JNE': `https://www.jne.co.id/id/tracking/trace/${trackingNumber}`,
      'J&T Express': `https://www.jet.co.id/track/${trackingNumber}`,
      'SiCepat': `https://www.sicepat.com/checkAwb/${trackingNumber}`,
      'AnterAja': `https://anteraja.id/tracking/${trackingNumber}`,
      'ID Express': `https://idexpress.com/tracking?awb=${trackingNumber}`,
      'Ninja Express': `https://www.ninjaxpress.co/id-id/tracking?tracking_id=${trackingNumber}`
    };

    return courierUrls[courier] || null;
  }
}

module.exports = new TrackingService();
