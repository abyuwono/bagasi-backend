const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Helper function to format date
const formatDate = (date) => {
  const d = new Date(date);
  return d.getDate() + ' ' + d.toLocaleString('id-ID', { month: 'long' }) + ' ' + d.getFullYear();
};

// Function to generate WhatsApp message
const generateMessage = (ad) => {
  const randomNumber = Math.floor(Math.random() * 6) + 3; // Random number between 3-8
  const firstName = ad.customDisplayName.split(' ')[0];
  return `Hi Kak ${firstName}. Ada ${randomNumber} orang tertarik untuk menggunakan jastip Bagasi.ID ${ad.departureCity} - ${ad.arrivalCity} tanggal ${formatDate(ad.departureDate)}\n\nLangsung saja chat dengan penitip di https://www.bagasi.id`;
};

// Function to send WhatsApp message
const sendWhatsAppMessage = async (ad, token) => {
  try {
    const message = generateMessage(ad);
    // Make direct call to WatoChat API
    const response = await fetch('https://22774.watochat.com/beli/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '62818550557',
        to: ad.customWhatsapp.replace(/^\+/, ''), // Remove leading + if present
        text: message,
        isAsync: true,
        isNotify: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `WatoChat API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Update ad with new message count and timestamp
    ad.whatsappMessageCount = (ad.whatsappMessageCount || 0) + 1;
    ad.lastWhatsappMessageSent = new Date();
    await ad.save();

    console.log('WhatsApp message sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Send error notification to IFTTT
    try {
      await fetch('https://maker.ifttt.com/trigger/bagasi_send_wa_error/with/key/bghXjYpIu2hCAQdsNzNg-Z', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value1: ad.customWhatsapp,
          value2: error instanceof Error ? error.message : 'Failed to send message',
          value3: new Date().toISOString()
        })
      });
    } catch (iftttError) {
      console.error('Failed to send error notification to IFTTT:', iftttError);
    }
  }
};

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

    // Common notes for Jakarta-Tokyo ad
    const jakartaTokyoNotes = `
• Lokasi Jakarta: Bandung
• Lokasi Tokyo: Akan dikonfirmasi

• Ketentuan:
  - Kapasitas bagasi tersedia
  - Terakhir drop barang 13 Januari 2025
  - Pengiriman dari Bandung
  - Pengambilan di Tokyo
  - Tidak menerima barang terlarang
  - Biaya per kg IDR 100,000
`;

    // Create ad
    const ad = {
      customDisplayName: 'Atep Bastez',
      customRating: 4.6,
      customWhatsapp: '+6285722929168',
      departureCity: 'Jakarta',
      departureCityDetail: 'Bandung',
      arrivalCity: 'Tokyo',
      arrivalCityDetail: 'Akan dikonfirmasi',
      departureDate: '2025-01-14',
      expiresAt: '2025-01-13',
      availableWeight: 30,
      pricePerKg: 100000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: jakartaTokyoNotes,
      status: 'active'
    };

    // Check for any existing ads with the same WhatsApp number
    const existingAd = await Ad.findOne({
      customWhatsapp: ad.customWhatsapp
    });

    if (existingAd) {
      console.log(`Skipping ad creation: WhatsApp number ${ad.customWhatsapp} already exists in the database`);
      process.exit(0);
      return;
    }

    // Save ad and collect sitemap entry
    const newAd = new Ad({
      user: masterUser._id,
      ...ad
    });
    await newAd.save();
    console.log(`${ad.departureCity} to ${ad.arrivalCity} ad created`);

    // Prepare sitemap entry
    const newEntry = {
      id: newAd._id,
      from: ad.departureCity.toLowerCase(),
      to: ad.arrivalCity.toLowerCase().replace(' ', ''),
      date: ad.departureDate.split('-').reverse().join('-').toLowerCase().replace('2025', '2025')
    };

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();

    // Add new entry before </urlset>
    const entry = `
  <url>
    <loc>https://market.bagasi.id/ads/jastip-${newEntry.from}-${newEntry.to}/${newEntry.date}/${newEntry.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;

    sitemap = sitemap.replace('</urlset>', entry + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Sitemap updated');

    // Generate JWT token for API authentication
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: masterUser._id, email: masterUser.email },
      'mule_marketplace_secret_key_2024',
      { expiresIn: '24h' }
    );

    // Send WhatsApp message
    await sendWhatsAppMessage(newAd, token);

    console.log('Ad added successfully');
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
