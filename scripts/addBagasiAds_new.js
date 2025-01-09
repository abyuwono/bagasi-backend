const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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

    // Common notes for both routes
    const commonNotes = `
• Lokasi Indonesia: Jakarta
• Lokasi Saudi: Jeddah

• Ketentuan:
  - Menerima Jastip supermarket/online shop
  - Barang diterima paling lambat 2 hari sebelum keberangkatan
  - Bersedia di repack
  - Pembulatan ke atas
  - Tidak berisi barang-barang terlarang sesuai aturan imigrasi
  - Belum termasuk ongkir domestik & cukai
`;

    // Create Indonesia to Saudi ad
    const indoToSaudiAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Lulu Afuad',
      customRating: 4.7,
      customWhatsapp: '+6285643702066',
      departureCity: 'Jakarta',
      departureCityDetail: 'Jakarta',
      arrivalCity: 'Jeddah',
      arrivalCityDetail: 'Jeddah',
      departureDate: '2025-02-18',
      expiresAt: '2025-02-16',
      availableWeight: 20,
      pricePerKg: 100000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Create Saudi to Indonesia ad
    const saudiToIndoAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Lulu Afuad',
      customRating: 4.7,
      customWhatsapp: '+6285643702066',
      departureCity: 'Jeddah',
      departureCityDetail: 'Jeddah',
      arrivalCity: 'Jakarta',
      arrivalCityDetail: 'Jakarta',
      departureDate: '2025-03-04',
      expiresAt: '2025-03-02',
      availableWeight: 20,
      pricePerKg: 130000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Save the ads
    await indoToSaudiAd.save();
    await saudiToIndoAd.save();
    console.log('Indonesia-Saudi and Saudi-Indonesia ads created');

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();
    const newEntries = [
      {
        id: indoToSaudiAd._id,
        from: 'jakarta',
        to: 'jeddah',
        date: '18-februari-2025'
      },
      {
        id: saudiToIndoAd._id,
        from: 'jeddah',
        to: 'jakarta',
        date: '04-maret-2025'
      }
    ];

    // Add new entries before </urlset>
    const entries = newEntries.map(entry => `
  <url>
    <loc>https://market.bagasi.id/ads/jastip-${entry.from}-${entry.to}/${entry.date}/${entry.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

    sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Sitemap updated');

    console.log('Ads added successfully');
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
