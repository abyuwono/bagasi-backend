const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { id: idLocale } = require('date-fns/locale');

// Load environment variables
require('dotenv').config();

// Import models
require('../models/User'); // Import User model first
const Ad = require('../models/Ad');

// Function to generate URL-friendly string
function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Function to generate sitemap
async function generateSitemap() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all active ads
    const ads = await Ad.find({ status: 'active' }).populate('user');

    // Start XML content
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://market.bagasi.id</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://market.bagasi.id/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add each ad URL
    for (const ad of ads) {
      const date = format(new Date(ad.departureDate), 'd-MMMM-yyyy', { locale: idLocale });
      const slug = `jastip-${generateSlug(ad.departureCity)}-${generateSlug(ad.arrivalCity)}`;
      const dateSlug = generateSlug(date);
      
      sitemap += `
  <url>
    <loc>https://market.bagasi.id/ads/${slug}/${dateSlug}/${ad._id}</loc>
    <lastmod>${new Date(ad.updatedAt || ad.createdAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Close XML
    sitemap += '\n</urlset>';

    // Write to file
    const outputPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    fs.writeFileSync(outputPath, sitemap);
    console.log('Sitemap generated successfully at:', outputPath);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
generateSitemap();
