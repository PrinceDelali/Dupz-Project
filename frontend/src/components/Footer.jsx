import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaApple, FaGooglePlay, FaTiktok, FaFacebookF, FaInstagram, FaSnapchatGhost, FaYoutube, FaPinterestP, FaTwitter, FaLinkedinIn, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiLoader, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../store/socialStore';

const Footer = () => {
  const { fetchSocialLinks, getActiveSocialLinks } = useSocialStore();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [email, setEmail] = useState('');
  const [subscriptionState, setSubscriptionState] = useState('idle'); // idle, sending, success
  
  useEffect(() => {
    const loadSocialLinks = async () => {
      setIsLoading(true);
      try {
        await fetchSocialLinks();
      } catch (error) {
        console.error('Error loading social links:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSocialLinks();
  }, [fetchSocialLinks]);
  
  // Reset subscription state after success
  useEffect(() => {
    if (subscriptionState === 'success') {
      const timer = setTimeout(() => {
        setSubscriptionState('idle');
        setEmail('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [subscriptionState]);
  
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubscribe = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      return;
    }
    
    // Simulate API call
    setSubscriptionState('sending');
    
    setTimeout(() => {
      // Simulate successful subscription
      setSubscriptionState('success');
    }, 1500);
  };

  // Get active social links (with fallback to defaults if none exist)
  const socialLinks = getActiveSocialLinks();
  
  // Map platform names to their corresponding icons
  const getIconComponent = (platform) => {
    const iconMap = {
      'facebook': <FaFacebookF />,
      'instagram': <FaInstagram />,
      'tiktok': <FaTiktok />,
      'snapchat': <FaSnapchatGhost />,
      'youtube': <FaYoutube />,
      'pinterest': <FaPinterestP />,
      'twitter': <FaTwitter />,
      'linkedin': <FaLinkedinIn />
    };
    
    return iconMap[platform.toLowerCase()] || <FaInstagram />;
  };
  
  const footerSections = [
    {
      id: 'customer-service',
      title: 'CUSTOMER SERVICE',
      links: [
        { text: 'Track Order', path: '/track' },
        { text: 'Shipping & Returns', path: '/shipping' },
        { text: 'Contact Us', path: '/contact' },
        { text: 'FAQ', path: '/faq' }
      ]
    },
    {
      id: 'about',
      title: 'ABOUT SINOSPLY',
      links: [
        { text: 'Our Story', path: '/about' },
        { text: 'Blog', path: '/blog' },
        { text: 'Careers', path: '/careers' },
        { text: 'Store Locator', path: '/store-locator' }
      ]
    },
    {
      id: 'policies',
      title: 'POLICIES',
      links: [
        { text: 'Terms of Service', path: '/terms-of-use' },
        { text: 'Privacy Policy', path: '/privacy-policy' },
        { text: 'Returns Policy', path: '/returns' },
        { text: 'Shipping Policy', path: '/shipping' }
      ]
    }
  ];
  
  // Button content based on subscription state
  const getButtonContent = () => {
    switch (subscriptionState) {
      case 'sending':
        return <FiLoader className="animate-spin w-4 h-4" />;
      case 'success':
        return <FiCheck className="w-4 h-4" />;
      default:
        return "→";
    }
  };
  
  // Custom button background based on subscription state
  const getButtonClass = () => {
    switch (subscriptionState) {
      case 'sending':
        return "bg-gray-600 text-white";
      case 'success':
        return "bg-green-600 text-white";
      default:
        return "bg-black text-white";
    }
  };
  
  return (
    <footer className="bg-white pt-10 pb-6 border-t border-gray-200">
      <div className="container mx-auto px-4">
        {/* Mobile Footer */}
        <div className="md:hidden">
          {footerSections.map((section) => (
            <div key={section.id} className="border-b border-gray-200">
              <button 
                className="w-full py-4 flex justify-between items-center text-left"
                onClick={() => toggleSection(section.id)}
              >
                <h3 className="font-medium text-sm">{section.title}</h3>
                {expandedSection === section.id ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              
              {expandedSection === section.id && (
                <ul className="pb-4 space-y-2">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <Link to={link.path} className="text-gray-600 text-sm hover:text-black">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          
          <div className="py-6">
            <h3 className="font-medium text-sm mb-4">JOIN OUR NEWSLETTER</h3>
            <form onSubmit={handleSubscribe} className="flex mb-4 relative">
              <input 
                type="email" 
                placeholder="Your email" 
                value={email}
                onChange={handleEmailChange}
                disabled={subscriptionState !== 'idle'}
                className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-all duration-200"
              />
              <AnimatePresence mode="wait">
                <motion.button 
                  key={subscriptionState}
                  initial={{ opacity: 0.8, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                  type="submit"
                  disabled={subscriptionState !== 'idle'}
                  className={`${getButtonClass()} px-4 py-2 text-sm flex items-center justify-center min-w-[36px] transition-colors duration-300`}
                >
                  {getButtonContent()}
                </motion.button>
              </AnimatePresence>
            </form>
            {subscriptionState === 'success' && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-green-600 mt-1"
              >
                Thanks for subscribing!
              </motion.p>
            )}
          </div>
        </div>
        
        {/* Desktop Footer */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.id}>
              <h3 className="font-medium text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path} className="text-gray-600 text-sm hover:text-black">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <div>
            <h3 className="font-medium text-sm mb-4">JOIN OUR NEWSLETTER</h3>
            <form onSubmit={handleSubscribe} className="flex mb-4 relative">
              <input 
                type="email" 
                placeholder="Your email" 
                value={email}
                onChange={handleEmailChange}
                disabled={subscriptionState !== 'idle'}
                className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-all duration-200"
              />
              <AnimatePresence mode="wait">
                <motion.button 
                  key={subscriptionState}
                  initial={{ opacity: 0.8, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  type="submit"
                  disabled={subscriptionState !== 'idle'}
                  className={`${getButtonClass()} px-4 py-2 text-sm flex items-center justify-center min-w-[36px] transition-colors duration-300`}
                >
                  {getButtonContent()}
                </motion.button>
              </AnimatePresence>
            </form>
            <AnimatePresence>
              {subscriptionState === 'success' ? (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-green-600"
                >
                  Thanks for subscribing! We'll keep you updated.
                </motion.p>
              ) : (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-gray-500"
                >
                  Sign up to get updates on new arrivals and special offers.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Social Links - Both Mobile & Desktop */}
        <div className="flex justify-center space-x-4 py-6 border-t border-gray-200">
          {socialLinks.map((link, index) => (
            <a 
              key={link._id || index}
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              title={link.displayName || link.platform}
              className="text-gray-600 hover:text-black transition-colors"
            >
              {getIconComponent(link.platform)}
            </a>
          ))}
        </div>
        
        {/* Copyright & Legal - Both Mobile & Desktop */}
        <div className="text-center text-xs text-gray-500 mt-4">
          <p className="mb-2">©{new Date().getFullYear()} SINOSPLY. All Rights Reserved</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link to="/terms-of-use" className="hover:text-black">Terms of Use</Link>
            <Link to="/privacy-policy" className="hover:text-black">Privacy Policy</Link>
            <Link to="/sitemap" className="hover:text-black">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
