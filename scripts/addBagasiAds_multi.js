// Suppress punycode deprecation warning
process.noDeprecation = true;

const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

async function addBagasiAds() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Find the master account
    const masterUser = await User.findOne({ email: 'pgj899@gmail.com' });
    if (!masterUser) {
      console.error('Master account not found');
      process.exit(1);
    }

    // Generate admin JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: masterUser._id.toString(),
        email: masterUser.email,
        isAdmin: true,
        role: 'admin'
      },
      'mule_marketplace_secret_key_2024',
      { expiresIn: '24h' }
    );

    console.log('Generated admin token:', token);

    // Common notes for all routes
    const commonNotes = `
• Lokasi Sydney: Sydney International Airport (SYD)
• Lokasi Surabaya: Juanda International Airport (SUB)

• Ketentuan:
  - Semua barang akan dicheck terlebih dahulu
  - Pickup/delivery tanggal 18 Januari 2025
  - Last drop barang 16 Januari 2025 (city)
`;

    const whatsappNumber = '+61478620722';

    // Check for existing ads with this WhatsApp number
    const existingAds = await Ad.find({ customWhatsapp: whatsappNumber });
    if (existingAds.length > 0) {
      console.log(`Found ${existingAds.length} existing ads for WhatsApp number ${whatsappNumber}`);
      console.log('Skipping ad creation: WhatsApp number already exists');
      process.exit(0);
    }

    // Create ad data
    const route = {
      departureCity: 'Sydney',
      arrivalCity: 'Surabaya',
      departureDate: '2025-01-18',
      expiresAt: '2025-01-16',
      pricePerKg: 18,
      currency: 'AUD'
    };

    const baseAd = {
      customDisplayName: 'Michelle',
      customRating: 4.7,
      customWhatsapp: whatsappNumber,
      availableWeight: 50,
      currency: route.currency,
      minimumWeight: 1,
      additionalNotes: commonNotes,
      status: 'active',
      departureCityDetail: 'Sydney International Airport (SYD)',
      arrivalCityDetail: 'Juanda International Airport (SUB)'
    };

    const ad = {
      ...baseAd,
      ...route
    };

    // Save ad
    const newAd = new Ad({
      user: masterUser._id,
      ...ad
    });
    await newAd.save();
    console.log(`${ad.departureCity} to ${ad.arrivalCity} ad created`);

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();
    
    // Add new entry before </urlset>
    const entry = `
  <url>
    <loc>https://market.bagasi.id/ads/jastip-${ad.departureCity.toLowerCase()}-${ad.arrivalCity.toLowerCase()}/${ad.departureDate.split('-').reverse().join('-')}/${newAd._id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;

    sitemap = sitemap.replace('</urlset>', entry + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Sitemap updated');

    // Send WhatsApp message
    async function sendWhatsAppMessage(ad, token) {
      try {
        console.log('Sending WhatsApp message to:', ad.customWhatsapp);
        
        // Format the date (18 January 2025)
        const date = new Date(ad.departureDate);
        const formattedDate = date.getDate() + ' ' + 
          date.toLocaleString('id-ID', { month: 'long' }) + ' ' + 
          date.getFullYear();
        
        const message = `Hi Kak ${ad.customDisplayName}. Ada 8 orang tertarik untuk menggunakan jastip Bagasi.ID ${ad.departureCity} - ${ad.arrivalCity} tanggal ${formattedDate}\n\nLangsung saja chat dengan penitip di https://www.bagasi.id`;
        
        const response = await fetch('https://api.bagasi.id/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            phoneNumber: ad.customWhatsapp,
            message: message
          })
        });
        
        console.log('API Response:', response.status, await response.json());
        console.log('WhatsApp message sent successfully');
      } catch (error) {
        console.error('Error sending WhatsApp message:', error);
      }
    }

    await sendWhatsAppMessage(newAd, token);

    console.log('All ads added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addBagasiAds();
