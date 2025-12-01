import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLongArrowAltRight, FaFilter, FaTimes, FaGlobe, FaSearch } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePlatformsStore } from '../store/platformsStore';
import HomeNavbar from '../components/HomeNavbar';

const Stores = () => {
  // Get platforms data from store
  const { fetchPlatformsFromAPI, activePlatforms, loading: platformsLoading } = usePlatformsStore();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch platforms data when component mounts
  useEffect(() => {
    fetchPlatformsFromAPI();
  }, [fetchPlatformsFromAPI]);
  
  // Fallback platforms data
  const fallbackPlatforms = [
    {
      _id: '1',
      name: 'SHOP PARTY LOOKS',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/Group_4341_128edd21-c0ce-4241-9d87-1c8a80d3874a_665x.progressive.jpg?v=1740628902',
      domain: '#',
      description: 'Discover our exclusive collection of party outfits',
      category: 'Fashion'
    },
    {
      _id: '2',
      name: 'BEACH DRESSES',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/1-modelinfo-nika-us2_14a23d51-fcbc-4fdf-8aca-051bae50e83f_450x610_crop_center.jpg?v=1728428305',
      domain: '#',
      description: 'Perfect dresses for your beach vacation',
      category: 'Fashion'
    },
    {
      _id: '3',
      name: 'THE SPRING SHOP',
      logoUrl: 'https://www.princesspolly.com.au/cdn/shop/files/1-modelinfo-nat-us2_4fe34236-40a0-47e5-89b1-1315a0b2076f_450x610_crop_center.jpg?v=1739307217',
      domain: '#',
      description: 'Fresh styles for the new season',
      category: 'Fashion'
    },
    {
      _id: '4',
      name: 'TRENDING DUO: BLUE & BROWN',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/1-modelinfo-josephine-us2_3ec262cf-5af1-4637-a7c0-ce1ef00b3da3_450x610_crop_center.jpg?v=1722315009',
      domain: '#',
      description: 'The color combination that\'s taking over this season',
      category: 'Fashion'
    },
    {
      _id: '5',
      name: 'TECH GADGETS',
      logoUrl: 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      domain: '#',
      description: 'Cutting-edge technology to simplify your life',
      category: 'Electronics'
    },
    {
      _id: '6',
      name: 'HOME ESSENTIALS',
      logoUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
      domain: '#',
      description: 'Everything you need for a stylish and comfortable home',
      category: 'Home'
    },
    {
      _id: '7',
      name: 'FITNESS GEAR',
      logoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      domain: '#',
      description: 'Premium equipment for your workout routine',
      category: 'Fitness'
    },
    {
      _id: '8',
      name: 'BEAUTY ESSENTIALS',
      logoUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1487&q=80',
      domain: '#',
      description: 'Skincare and makeup products for your daily routine',
      category: 'Beauty'
    }
  ];
  
  // Use actual data or fallback
  const platformsToDisplay = activePlatforms.length > 0 ? activePlatforms : fallbackPlatforms;
  
  // Extract unique categories from platforms
  const categories = ['All', ...new Set(platformsToDisplay.map(platform => platform.category || 'Uncategorized'))];
  
  // Filter platforms based on search term and selected category
  const filteredPlatforms = platformsToDisplay
    .filter(platform => 
      platform.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (platform.description && platform.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(platform => 
      selectedCategory === 'All' || platform.category === selectedCategory || 
      (!platform.category && selectedCategory === 'Uncategorized')
    );
    
  // Display grouped platforms
  const renderPlatforms = () => {
    if (platformsLoading) {
      return (
        <div className="col-span-full flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
        </div>
      );
    }
    
    if (filteredPlatforms.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center h-60 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FaSearch className="text-gray-400 h-16 w-16 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No stores found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-red-600 hover:text-red-800 transition-colors"
            >
              Reset filters
            </button>
          </motion.div>
        </div>
      );
    }
    
    return filteredPlatforms.map((platform, index) => (
      <motion.div 
        key={platform._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="relative h-[300px] overflow-hidden">
          <img 
            src={platform.logoUrl || platform.bannerUrl}
            alt={platform.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x400?text=Sinosply";
            }}
          />
          {platform.category && (
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full">
              {platform.category}
            </div>
          )}
        </div>
        <div className="p-6 border-t-2 border-red-600">
          <h3 className="text-xl font-bold mb-2 group-hover:text-red-600 transition-colors">{platform.name}</h3>
          {platform.description && (
            <p className="text-gray-600 mb-4 text-sm line-clamp-2">{platform.description}</p>
          )}
          <div className="flex items-center justify-between mt-4">
            <a 
              href={platform.domain !== '#' ? `https://${platform.domain}` : '/products'} 
              target={platform.domain !== '#' ? "_blank" : "_self"} 
              rel="noopener noreferrer" 
              className="inline-flex items-center font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              VISIT STORE <FaLongArrowAltRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            
            {platform.domain && platform.domain !== '#' && (
              <div className="text-gray-500 text-sm flex items-center">
                <FaGlobe className="mr-1" /> {platform.domain}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      {/* Hero section */}
      <div className="relative bg-gradient-to-r from-red-600 to-black pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-white/5 transform -skew-x-12"></div>
          <div className="absolute right-0 bottom-0 h-1/2 w-1/3 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sinosply Stores
            </h1>
            <p className="text-red-100 text-lg md:text-xl max-w-3xl mx-auto mb-10">
              Explore our specialized storefronts offering curated products from Chinese manufacturers
            </p>
            
            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stores..."
                className="w-full pl-5 pr-12 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-red-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <FaSearch className="text-red-100" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Filters section */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
              >
                <FaFilter className="mr-2" />
                <span>Filters</span>
                {selectedCategory !== 'All' && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </button>
              
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-gray-500 text-sm">
              {filteredPlatforms.length} store{filteredPlatforms.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {renderPlatforms()}
        </div>
      </div>
      
      {/* CTA section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Can't find what you're looking for?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              We can help you source any product from China. Get in touch with our team for a custom quote.
            </p>
            <Link
              to="/quote"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-black text-white rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              Request a Custom Quote <FaLongArrowAltRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Stores; 