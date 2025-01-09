const mongoose = require('mongoose');
const ShopperAd = require('../models/ShopperAd');
const fs = require('fs');
const path = require('path');

async function updateSitemapShopperAds() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://bagasi:bagasi123!@cluster0.clcx5.mongodb.net/mule-marketplace?retryWrites=true&w=majority');

    // Get all shopper ads regardless of status
    const shopperAds = await ShopperAd.find({});
    
    // Read existing sitemap
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    const currentDate = new Date().toISOString();

    // Create entries for shopper ads
    const entries = shopperAds.map(ad => {
      // Convert product name to URL-friendly format
      const productSlug = ad.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return `
  <url>
    <loc>https://market.bagasi.id/jastip-belanja/${productSlug}/${ad._id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n');

    // Remove any existing shopper ad entries
    sitemap = sitemap.replace(/\n.*jastip-belanja.*\n/g, '\n');

    // Add new entries before </urlset>
    sitemap = sitemap.replace('</urlset>', entries + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Sitemap updated with ${shopperAds.length} shopper ads`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSitemapShopperAds();
