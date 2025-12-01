import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaUserCircle, 
  FaShoppingCart, 
  FaBars, 
  FaTimes, 
  FaRobot, 
  FaHome, 
  FaBoxOpen, 
  FaCog, 
  FaInfoCircle, 
  FaEnvelope, 
  FaQuoteRight, 
  FaChevronRight,
  FaAngleDown
} from 'react-icons/fa';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const HomeNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isAISearch, setIsAISearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedMobileSearch, setExpandedMobileSearch] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation links with icons
  const navLinks = [
    { title: 'Home', path: '/', icon: <FaHome className="w-5 h-5" /> },
    { title: 'Products', path: '/products', icon: <FaBoxOpen className="w-5 h-5" /> },
    { title: 'Services', path: '/services', icon: <FaCog className="w-5 h-5" /> },
    { title: 'About', path: '/about', icon: <FaInfoCircle className="w-5 h-5" /> },
    { title: 'Contact', path: '/sinosply-contact', icon: <FaEnvelope className="w-5 h-5" /> }
  ];

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle AI search on/off
  const toggleAISearch = () => {
    setIsAISearch(!isAISearch);
  };

  // Toggle mobile search expansion
  const toggleMobileSearch = () => {
    setExpandedMobileSearch(!expandedMobileSearch);
  };

  // Handle search submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      if (isAISearch) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}&ai=true`);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      setIsSearchActive(false);
      setIsMobileMenuOpen(false);
      setExpandedMobileSearch(false);
    }
  };

  // Check if a navigation link should be active (handle nested routes)
  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  // Mobile menu animation variants
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.05,
        staggerDirection: 1
      }
    }
  };

  // Mobile menu item animation variants
  const menuItemVariants = {
    closed: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className={`text-2xl font-bold ${isScrolled ? 'text-red-600' : 'text-white'}`}>
                Sinosply
              </span>
              {/* <span className={`ml-1 text-sm font-medium ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
                Connect
              </span> */}
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Link
                  to={link.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.path)
                      ? `${isScrolled ? 'text-red-600' : 'text-white font-bold'}`
                      : `${isScrolled ? 'text-gray-700 hover:text-red-600' : 'text-white/90 hover:text-white'}`
                  }`}
                >
                  {link.title}
                  {isActiveLink(link.path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 mx-4 ${isScrolled ? 'bg-red-600' : 'bg-white'}`}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex items-center"
            >
              {/* Enhanced Search Component */}
              <div ref={searchRef} className="relative">
                <button 
                  onClick={() => setIsSearchActive(!isSearchActive)}
                  className={`p-2 rounded-full transition-colors ${
                    isScrolled ? 'text-gray-600 hover:text-red-600' : 'text-white/90 hover:text-white'
                  }`}
                  aria-label="Search"
                >
                  <FaSearch className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {isSearchActive && (
                    <motion.div 
                      initial={{ opacity: 0, width: 0, scale: 0.9 }}
                      animate={{ opacity: 1, width: '300px', scale: 1 }}
                      exit={{ opacity: 0, width: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 top-full mt-2 rounded-lg shadow-lg overflow-hidden ${isScrolled ? 'bg-white' : 'bg-black/80 backdrop-blur-md'}`}
                    >
                      <form onSubmit={handleSearchSubmit} className="flex flex-col">
                        <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700">
                          <FaSearch className={`w-5 h-5 mx-2 ${isScrolled ? 'text-gray-500' : 'text-white/80'}`} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search products, services..."
                            className={`w-full p-2 outline-none ${isScrolled ? 'bg-white text-gray-800' : 'bg-transparent text-white placeholder-white/60'}`}
                          />
                        </div>
                        <div className={`flex items-center justify-between px-4 py-2 ${isScrolled ? 'bg-gray-50' : 'bg-black/50'}`}>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="ai-search"
                              checked={isAISearch}
                              onChange={toggleAISearch}
                              className="rounded text-red-600 focus:ring-red-500 mr-2"
                            />
                            <label 
                              htmlFor="ai-search" 
                              className={`text-sm flex items-center ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
                            >
                              <FaRobot className="mr-1" />
                              AI Search
                            </label>
                          </div>
                          <button
                            type="submit"
                            disabled={isSearching}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            {isSearching ? 'Searching...' : 'Search'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
{/* 
              <Link to="/cart" className={`p-2 rounded-full transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-red-600' : 'text-white/90 hover:text-white'
              }`}>
                <FaShoppingCart className="w-5 h-5" />
              </Link>
              <Link to="/account" className={`p-2 rounded-full transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-red-600' : 'text-white/90 hover:text-white'
              }`}>
                <FaUserCircle className="w-5 h-5" />
              </Link> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Link
                to="/quote"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'bg-gradient-to-r from-red-600 to-black text-white hover:shadow-md hover:shadow-red-500/20'
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                Get a Quote
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isScrolled ? 'text-gray-700' : 'text-white'
              } ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Enhanced version */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className="md:hidden fixed top-[60px] left-0 right-0 bottom-0 bg-white z-40 overflow-y-auto shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Mobile search header */}
              <motion.div 
                variants={menuItemVariants}
                className="sticky top-0 z-10 bg-white"
              >
                <div 
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer"
                  onClick={toggleMobileSearch}
                >
                  <div className="flex items-center">
                    <FaSearch className="text-red-600 mr-3" />
                    <span className="font-medium">Search Products & Services</span>
                  </div>
                  <FaAngleDown className={`text-gray-500 transition-transform duration-300 ${expandedMobileSearch ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {expandedMobileSearch && (
                    <motion.form 
                      onSubmit={handleSearchSubmit}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 py-3 bg-gray-50"
                    >
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white mb-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search products, services..."
                          className="w-full p-3 outline-none text-gray-800"
                        />
                        <button
                          type="submit"
                          disabled={isSearching}
                          className="px-4 py-3 bg-red-600 text-white"
                        >
                          <FaSearch className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FaRobot className="text-red-600 mr-2" />
                          <span className="text-sm">AI-Powered Search</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isAISearch}
                            onChange={toggleAISearch}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Navigation Links */}
              <div className="py-2 flex-grow">
                {navLinks.map((link) => (
                  <motion.div 
                    key={link.path}
                    variants={menuItemVariants}
                  >
                    <Link
                      to={link.path}
                      className={`flex items-center px-4 py-4 text-base font-medium ${
                        isActiveLink(link.path)
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                      } border-b border-gray-100`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`mr-3 ${isActiveLink(link.path) ? 'text-red-600' : 'text-gray-500'}`}>
                        {link.icon}
                      </div>
                      <span className="flex-grow">{link.title}</span>
                      <FaChevronRight className="text-gray-400 text-sm" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Quote button */}
              <motion.div 
                variants={menuItemVariants}
                className="p-4 border-t border-gray-200 bg-gray-50 mt-auto"
              >
                <Link
                  to="/quote"
                  className="flex items-center justify-center py-4 bg-gradient-to-r from-red-600 to-black text-white text-center rounded-lg font-medium shadow-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaQuoteRight className="mr-2" />
                  Get a Quote
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default HomeNavbar; 