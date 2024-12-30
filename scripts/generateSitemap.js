const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { id: idLocale } = require('date-fns/locale');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const parseXmlString = promisify(parseString);

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

// Function to read existing sitemap
async function readExistingSitemap(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return new Set();
    }

    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const result = await parseXmlString(xmlContent);
    const urls = result.urlset.url.map(url => url.loc[0]);
    return new Set(urls);
  } catch (error) {
    console.error('Error reading existing sitemap:', error);
    return new Set();
  }
}

// Function to generate sitemap
async function generateSitemap() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all active ads
    const ads = await Ad.find({ status: 'active' }).populate('user');

    // Output path for sitemap
    const outputPath = path.join(__dirname, '../../frontend/public/sitemap.xml');

    // Read existing URLs
    const existingUrls = await readExistingSitemap(outputPath);

    // Start XML content
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static URLs if they don't exist
    const staticUrls = [
      'https://market.bagasi.id',
      'https://market.bagasi.id/search'
    ];

    for (const url of staticUrls) {
      if (!existingUrls.has(url)) {
        sitemap += `
  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>${url === 'https://market.bagasi.id' ? '1.0' : '0.8'}</priority>
  </url>`;
      }
    }

    // Keep existing URLs
    existingUrls.forEach(url => {
      if (!staticUrls.includes(url) && !url.includes('/ads/')) {
        sitemap += `
  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    });

    // Add each ad URL
    for (const ad of ads) {
      const date = format(new Date(ad.departureDate), 'd-MMMM-yyyy', { locale: idLocale });
      const slug = `jastip-${generateSlug(ad.departureCity)}-${generateSlug(ad.arrivalCity)}`;
      const dateSlug = generateSlug(date);
      const adUrl = `https://market.bagasi.id/ads/${slug}/${dateSlug}/${ad._id}`;

      // Only add if URL doesn't exist
      if (!existingUrls.has(adUrl)) {
        sitemap += `
  <url>
    <loc>${adUrl}</loc>
    <lastmod>${new Date(ad.updatedAt || ad.createdAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    // Close XML
    sitemap += '\n</urlset>';

    // Write to file
    fs.writeFileSync(outputPath, sitemap);
    console.log('Sitemap updated successfully at:', outputPath);

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
