import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import Platform from '../models/Platform.js';
import { create } from 'xmlbuilder2';

const router = express.Router();

// Base URL for the sitemap
const BASE_URL = process.env.FRONTEND_URL || 'https://sinosply.com';

/**
 * @route GET /api/v1/sitemap.xml
 * @desc Generate and serve sitemap.xml
 * @access Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch all active products, collections, and platforms
    const [products, collections, platforms] = await Promise.all([
      Product.find({ isActive: true }).select('_id slug updatedAt'),
      Collection.find({ isActive: true }).select('_id updatedAt'),
      Platform.find({ isActive: true }).select('_id updatedAt')
    ]);
    
    // Create sitemap XML document
    const sitemap = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
    
    // Add static pages
    addPageToSitemap(sitemap, '/', '1.0', 'daily');
    addPageToSitemap(sitemap, '/products', '0.8', 'daily');
    addPageToSitemap(sitemap, '/collections', '0.8', 'weekly');
    addPageToSitemap(sitemap, '/about', '0.7', 'monthly');
    addPageToSitemap(sitemap, '/contact', '0.7', 'monthly');
    addPageToSitemap(sitemap, '/faq', '0.7', 'monthly');
    
    // Add product pages
    products.forEach(product => {
      const path = `/product/${product.slug || product._id}`;
      const lastmod = product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString();
      addPageToSitemap(sitemap, path, '0.9', 'weekly', lastmod);
    });
    
    // Add collection pages
    collections.forEach(collection => {
      const path = `/collections/${collection._id}`;
      const lastmod = collection.updatedAt ? collection.updatedAt.toISOString() : new Date().toISOString();
      addPageToSitemap(sitemap, path, '0.8', 'weekly', lastmod);
    });
    
    // Add platform pages
    platforms.forEach(platform => {
      const path = `/platforms/${platform._id}`;
      const lastmod = platform.updatedAt ? platform.updatedAt.toISOString() : new Date().toISOString();
      addPageToSitemap(sitemap, path, '0.8', 'weekly', lastmod);
    });
    
    // Convert to XML string
    const xml = sitemap.end({ prettyPrint: true });
    
    // Set headers and send response
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * @route GET /api/v1/robots.txt
 * @desc Serve robots.txt file
 * @access Public
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `
# www.robotstxt.org/

User-agent: *
Allow: /

# Disallow admin and authentication pages
Disallow: /admin/
Disallow: /login
Disallow: /register
Disallow: /dashboard
Disallow: /profile
Disallow: /checkout
Disallow: /cart

# Sitemaps
Sitemap: ${BASE_URL}/api/v1/sitemap.xml
  `.trim();
  
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

/**
 * Helper function to add a page to the sitemap
 */
function addPageToSitemap(sitemap, path, priority, changefreq, lastmod = null) {
  const url = sitemap.ele('url');
  url.ele('loc').txt(`${BASE_URL}${path}`);
  if (lastmod) {
    url.ele('lastmod').txt(lastmod);
  }
  url.ele('changefreq').txt(changefreq);
  url.ele('priority').txt(priority);
}

export default router; 