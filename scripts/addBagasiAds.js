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

    // Generate random rating with 1 decimal place between 4 and 5
    const randomRating = Number((4 + Math.random()).toFixed(1));

    // Common notes for both ads
    const commonNotes = `Route Details:
Sydney to Jakarta:
- Drop off: Apartment near Townhall, Sydney
- Pick up: Kuningan City, Jakarta
- Drop off deadline: Jan 14, 2025
- Pick up available: From Jan 16, 2025

Jakarta to Sydney:
- Drop off: Kuningan City, Jakarta
- Pick up: Apartment near Townhall, Sydney
- Drop off deadline: Jan 26, 2025
- Pick up available: From Jan 28, 2025

Pricing:
- $15/kg
- $10 for items < 500g
- Available capacity: 20kg

Important Notes:
❌ No bulky packages
❌ No cigarettes/vape
❌ No restricted goods by Australian Customs
ℹ️ Items will be inspected prior to departure`;

    // Create Sydney to Jakarta ad
    const sydneyJakartaAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Nova Chairil',
      customRating: randomRating,
      customWhatsapp: '+614116000558',
      departureCity: 'Sydney',
      arrivalCity: 'Jakarta',
      departureDate: new Date('2025-01-14T00:00:00+11:00'),
      expiresAt: new Date('2025-01-13T23:59:59+11:00'),
      pricePerKg: 15,
      currency: 'AUD',
      availableWeight: 20,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Create Jakarta to Sydney ad
    const jakartaSydneyAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Nova Chairil',
      customRating: randomRating, // Same rating as they're from same person
      customWhatsapp: '+614116000558',
      departureCity: 'Jakarta',
      arrivalCity: 'Sydney',
      departureDate: new Date('2025-01-26T00:00:00+07:00'),
      expiresAt: new Date('2025-01-25T23:59:59+07:00'),
      pricePerKg: 15,
      currency: 'AUD',
      availableWeight: 20,
      additionalNotes: commonNotes,
      status: 'active'
    });

    // Notes for Sydney-Bali route in Bahasa Indonesia
    const sydneyBaliNotes = `Detail Rute:
Sydney ke Bali:
- Drop off: Area Mascot
- Pick up: Lokasi pickup di Bali bisa menyesuaikan
- Batas waktu drop off: 8 Januari 2025
- Siap di Bali: 11 Januari 2025

Biaya:
💰 $17 / kg
⚖️ Barang ringan besar akan dihitung volume

Layanan:
✅ Bersedia di-unpack, diperiksa, di-declare
🛒 Bisa bantu dibelanjakan dari store
📦 Bisa diteruskan ke kota lain pakai ekspedisi

Catatan Penting:
❗ Barang yang ditahan di airport / customs adalah tanggung jawab pemilik`;

    // Create Sydney to Bali ad
    const sydneyBaliAd = new Ad({
      user: masterUser._id,
      customDisplayName: 'Astalugra Pramitha',
      customRating: randomRating,
      customWhatsapp: '+62818550557', // Default number as per guidelines
      departureCity: 'Sydney',
      arrivalCity: 'Bali',
      departureDate: new Date('2025-01-11T00:00:00+08:00'), // Bali time
      expiresAt: new Date('2025-01-08T23:59:59+11:00'), // Sydney time, last drop off date
      pricePerKg: 17,
      currency: 'AUD',
      availableWeight: 20, // Default weight since not specified
      additionalNotes: sydneyBaliNotes,
      status: 'active'
    });

    // Save both ads
    await sydneyJakartaAd.save();
    await jakartaSydneyAd.save();
    await sydneyBaliAd.save();

    console.log('Ads created successfully with rating:', randomRating);

    // Update sitemap.xml
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    // Add new URL entry for the ad
    const newUrl = `
  <url>
    <loc>https://mule-marketplace.com/ads/${sydneyBaliAd._id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    // Insert new URL before closing urlset tag
    sitemap = sitemap.replace('</urlset>', newUrl);
    
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Sitemap updated successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error creating ads:', error);
    process.exit(1);
  }
}

addBagasiAds();
