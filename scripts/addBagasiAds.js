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

    // Common notes for Jakarta-Tokyo ad
    const jakartaTokyoNotes = `
• Lokasi Jakarta: Cengkareng, Jakarta Barat
• Lokasi Tokyo: Stay Hotel di Tokyo

• Ketentuan:
  - Tidak terima barang terlarang
  - Eks ongkir domestik Jepang
  - Pelunasan fee jastip saat landing di jepang
  - Menerima titipan belanja barang Indo n jepang (waktu terbatas)
  - Bisa bantu checkout marketplace alamat cengkareng (biaya barang pas checkout, pelunasan fee saat landing di jepang)
  - Tidak termasuk bea cukai
  - Maksimal penerimaan barang H-1
`;

    // Create Jakarta to Tokyo ad
    const jakartaToTokyoAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Endy Dut',
      customRating: 4.8,
      customWhatsapp: '+6281291252892',
      departureCity: 'Jakarta',
      departureCityDetail: 'Cengkareng, Jakarta Barat',
      arrivalCity: 'Tokyo',
      arrivalCityDetail: 'Stay Hotel di Tokyo',
      departureDate: '2025-01-15',
      expiresAt: '2025-01-14',
      availableWeight: 80,
      pricePerKg: 110000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: jakartaTokyoNotes,
      status: 'active'
    });

    // Save the ad
    await jakartaToTokyoAd.save();
    console.log('Jakarta to Tokyo ad created');

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();
    const newEntries = [
      {
        id: jakartaToTokyoAd._id,
        from: 'jakarta',
        to: 'tokyo',
        date: '15-januari-2025'
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
