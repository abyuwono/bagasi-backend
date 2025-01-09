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

    // Common notes for Jakarta-Bangkok routes
    const jakartaBangkokNotes = `
• Lokasi Jakarta: Parkir Inap T2 Bandara Soetta
• Lokasi Bangkok: Pratunam, Bangkok

• Ketentuan:
  - Tiket issued
  - Exclude Cukai
  - Exclude Biaya Pengiriman Domestik
  - Barang Bulky (Volume besar) / Sepatu di hitung 1 an
  - Tidak Menerima Barang Berbahaya /Terlarang
  - Last Terima Barang Maksimal H-1
  - Pembayaran Rupiah via Transfer
`;

    // Create Jakarta to Bangkok ad
    const jakartaToBangkokAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Bonny Rusmayana',
      customRating: 4.6,
      customWhatsapp: '+6281298776687',
      departureCity: 'Jakarta',
      departureCityDetail: 'Parkir Inap T2 Bandara Soetta',
      arrivalCity: 'Bangkok',
      arrivalCityDetail: 'Pratunam, Bangkok',
      departureDate: '2025-01-10',
      expiresAt: '2025-01-09',
      availableWeight: 500,
      pricePerKg: 110000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: jakartaBangkokNotes,
      status: 'active'
    });

    // Create Bangkok to Jakarta ad
    const bangkokToJakartaAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Bonny Rusmayana',
      customRating: 4.6,
      customWhatsapp: '+6281298776687',
      departureCity: 'Bangkok',
      departureCityDetail: 'Pratunam, Bangkok',
      arrivalCity: 'Jakarta',
      arrivalCityDetail: 'Parkir Inap T2 Bandara Soetta',
      departureDate: '2025-01-10',
      expiresAt: '2025-01-09',
      availableWeight: 500,
      pricePerKg: 110000,
      currency: 'IDR',
      minimumWeight: 1,
      additionalNotes: jakartaBangkokNotes,
      status: 'active'
    });

    // Save the ads
    await jakartaToBangkokAd.save();
    await bangkokToJakartaAd.save();
    console.log('Jakarta-Bangkok routes ads created');

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();
    const ads = [jakartaToBangkokAd, bangkokToJakartaAd];
    
    const newEntries = ads.map(ad => {
      const date = new Date(ad.departureDate);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return {
        id: ad._id,
        from: ad.departureCity.toLowerCase(),
        to: ad.arrivalCity.toLowerCase(),
        date: `${day}-${month}-${year}`
      };
    });

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

    console.log('All operations completed successfully');
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
