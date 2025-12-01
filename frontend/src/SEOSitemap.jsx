import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SEO from './components/SEO';

/**
 * HTML Sitemap component for SEO purposes
 * This provides an HTML sitemap for both users and search engines
 */
const SEOSitemap = () => {
  const [sitemapData, setSitemapData] = useState({
    products: [],
    collections: [],
    platforms: [],
    categories: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchSitemapData = async () => {
      try {
        // Fetch all necessary data for sitemap
        const [productsRes, collectionsRes, platformsRes, categoriesRes] = await Promise.all([
          axios.get('/api/v1/products?limit=100&isActive=true'),
          axios.get('/api/v1/collections?limit=50&isActive=true'),
          axios.get('/api/v1/platforms?limit=20&isActive=true'),
          axios.get('/api/v1/products/categories')
        ]);

        setSitemapData({
          products: productsRes.data.products || [],
          collections: collectionsRes.data.collections || [],
          platforms: platformsRes.data.platforms || [],
          categories: categoriesRes.data.categories || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching sitemap data:', error);
        setSitemapData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load sitemap data'
        }));
      }
    };

    fetchSitemapData();
  }, []);

  // SEO metadata for sitemap page
  const seoData = {
    title: 'Sitemap | Sinosply',
    description: 'Complete sitemap of Sinosply. Find all products, collections, categories and pages in one place.',
    type: 'website'
  };

  if (sitemapData.loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO {...seoData} />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (sitemapData.error) {
    return (
      <div className="min-h-screen bg-white">
        <SEO {...seoData} />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">There was an error loading the sitemap. Please try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO {...seoData} />
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Main Pages */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Main Pages</h2>
            <ul className="space-y-2">
              <li><Link to="/" className="text-blue-600 hover:underline">Home</Link></li>
              <li><Link to="/products" className="text-blue-600 hover:underline">Products</Link></li>
              <li><Link to="/collections" className="text-blue-600 hover:underline">Collections</Link></li>
              <li><Link to="/about" className="text-blue-600 hover:underline">About Us</Link></li>
              <li><Link to="/contact" className="text-blue-600 hover:underline">Contact</Link></li>
              <li><Link to="/faq" className="text-blue-600 hover:underline">FAQ</Link></li>
              <li><Link to="/quote" className="text-blue-600 hover:underline">Request Quote</Link></li>
              <li><Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Product Categories</h2>
            {sitemapData.categories.length > 0 ? (
              <ul className="space-y-2">
                {sitemapData.categories.map((category, index) => (
                  <li key={index}>
                    <Link to={`/shop/${category}`} className="text-blue-600 hover:underline">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No categories found</p>
            )}
          </div>
        </div>
        
        {/* Collections */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Collections</h2>
          {sitemapData.collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sitemapData.collections.map(collection => (
                <div key={collection._id}>
                  <Link to={`/collections/${collection._id}`} className="text-blue-600 hover:underline">
                    {collection.name}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No collections found</p>
          )}
        </div>
        
        {/* Platforms/Stores */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Stores</h2>
          {sitemapData.platforms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sitemapData.platforms.map(platform => (
                <div key={platform._id}>
                  <Link to={`/platforms/${platform._id}`} className="text-blue-600 hover:underline">
                    {platform.name}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No stores found</p>
          )}
        </div>
        
        {/* Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">Products</h2>
          {sitemapData.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sitemapData.products.map(product => (
                <div key={product._id}>
                  <Link 
                    to={`/product/${product.slug || product._id}`} 
                    className="text-blue-600 hover:underline line-clamp-1"
                    title={product.name}
                  >
                    {product.name}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No products found</p>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SEOSitemap; 