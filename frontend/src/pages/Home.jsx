import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { FaLongArrowAltRight } from 'react-icons/fa';
import '../styles/Home.css';
import HomeNavbar from '../components/HomeNavbar';
import HeroSection from '../components/HeroSection';
import ProductExplorer from '../components/ProductExplorer';
import KeyFeatures from '../components/KeyFeatures';
import WhyChooseUs from '../components/WhyChooseUs';
import CTAFooter from '../components/CTAFooter';
import SEO from '../components/SEO';
import { usePlatformsStore } from '../store/platformsStore';
import { useProductStore } from '../store/productStore';
import { useReviewStore } from '../store/reviewStore';
import axios from 'axios';

const Home = () => {
  // Get platforms data for stores section
  const { fetchPlatformsFromAPI, activePlatforms, loading: platformsLoading } = usePlatformsStore();
  
  // Get products from store
  const { 
    fetchProductsFromAPI, 
    fetchSampleProducts, 
    sampleProducts, 
    loading: productsLoading 
  } = useProductStore();
  
  // Get review store for review stats
  const { reviewStats } = useReviewStore();
  
  // Fetch SEO data
  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const response = await axios.get('/api/v1/seo/generate-metadata?type=home');
        
        if (response.data.success) {
          // SEO data is automatically handled by the SEO component
          // No need to store it in a state since it's a static homepage
        }
      } catch (err) {
        console.log('Error fetching homepage SEO data', err);
        // Fall back to default SEO metadata in the SEO component
      }
    };
    
    fetchSEOData();
  }, []);
  
  // Fetch platforms when component mounts
  useEffect(() => {
    fetchPlatformsFromAPI();
  }, [fetchPlatformsFromAPI]);
  
  // Fetch sample products when component mounts
  useEffect(() => {
    // Fetch products if not already loaded
    fetchProductsFromAPI();
    
    // Fetch sample products
    fetchSampleProducts();
    
    // Add console logging to verify sample products
    console.log('Sample products fetch initiated');
  }, [fetchProductsFromAPI, fetchSampleProducts]);
  
  // Log whenever sample products change
  useEffect(() => {
    console.log(`Loaded ${sampleProducts.length} sample products:`, 
      sampleProducts.map(p => `${p.name} (isSample: ${p.isSample}, isFeatured: ${p.isFeatured})`));
  }, [sampleProducts]);
  
  // Add ElevenLabs Convai widget script to the page
  useEffect(() => {
    // Create script element for ElevenLabs Convai widget
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);
    
    // Clean up on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Fallback platforms data if no platforms are available from the store
  const fallbackPlatforms = [
    {
      _id: '1',
      name: 'SHOP PARTY LOOKS',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/Group_4341_128edd21-c0ce-4241-9d87-1c8a80d3874a_665x.progressive.jpg?v=1740628902',
      domain: '#',
      description: 'Discover our exclusive collection of party outfits'
    },
    {
      _id: '2',
      name: 'BEACH DRESSES',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/1-modelinfo-nika-us2_14a23d51-fcbc-4fdf-8aca-051bae50e83f_450x610_crop_center.jpg?v=1728428305',
      domain: '#',
      description: 'Perfect dresses for your beach vacation'
    },
    {
      _id: '3',
      name: 'THE SPRING SHOP',
      logoUrl: 'https://www.princesspolly.com.au/cdn/shop/files/1-modelinfo-nat-us2_4fe34236-40a0-47e5-89b1-1315a0b2076f_450x610_crop_center.jpg?v=1739307217',
      domain: '#',
      description: 'Fresh styles for the new season'
    },
    {
      _id: '4',
      name: 'TRENDING DUO: BLUE & BROWN',
      logoUrl: 'https://us.princesspolly.com/cdn/shop/files/1-modelinfo-josephine-us2_3ec262cf-5af1-4637-a7c0-ce1ef00b3da3_450x610_crop_center.jpg?v=1722315009',
      domain: '#',
      description: 'The color combination that\'s taking over this season'
    }
  ];
  
  // Fallback sample products if no sample products are loaded
  const fallbackSampleProducts = [
    {
      name: 'Compressed Sofas',
      description: 'High-quality space-saving furniture solutions for your home.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/sofas',
      price: '$599',
      rating: 4.7
    },
    {
      name: 'Bamboo Furniture',
      description: 'Sustainable and elegant furniture made from eco-friendly bamboo.',
      image: 'https://images.unsplash.com/photo-1540638349517-3abd5afc5847?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/bamboo',
      price: '$399',
      rating: 4.9
    },
    {
      name: 'Smart Gadgets',
      description: 'Cutting-edge technology to simplify and enhance your lifestyle.',
      image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      link: '/products/gadgets',
      price: '$299',
      rating: 4.5
    }
  ];
  
  // Format sample products for the product explorer
  const formattedSampleProducts = sampleProducts.length > 0 
    ? sampleProducts.map(product => {
        // Get product review data if available
        let reviewCount = product.reviewCount || 0;
        let avgRating = product.avgRating || 4.5;
        
        // Use review stats if available for this product
        if (reviewStats && reviewStats[product._id]) {
          reviewCount = reviewStats[product._id].count || reviewCount;
          avgRating = reviewStats[product._id].avgRating || avgRating;
        }
        
        return {
          name: product.name,
          description: product.description,
          image: product.variants?.[0]?.additionalImages?.[0] || 'https://via.placeholder.com/400x400?text=No+Image',
          link: `/product/${product.slug}`,
          price: `GH₵ ${product.basePrice?.toFixed(2) || "0.00"}`,
          rating: avgRating,
          reviewCount: reviewCount
        };
      })
    : fallbackSampleProducts;
  
  // Display active platforms or fallback if none available
  const platformsToDisplay = activePlatforms.length > 0 ? activePlatforms : fallbackPlatforms;

  return (
    <div className="min-h-screen bg-white">
      {/* SEO component with home page metadata */}
      <SEO 
        title="Sinosply - Connect to Premium Chinese Products"
        description="Discover premium products directly from trusted Chinese suppliers with Sinosply. Your reliable partner for business growth and global sourcing."
        image="https://sinosply.com/og-image.jpg"
        type="website"
      />
      
      <HomeNavbar />

      {/* ElevenLabs Convai Widget */}
      <div className="elevenlabs-convai-widget">
        <elevenlabs-convai agent-id="agent_01jvcqbx3kesp876edf3f3ksnx"></elevenlabs-convai>
      </div>

      {/* Header Section */}
      <HeroSection 
        slides={[
      {
        id: 1,
            title: "Connecting you to China's best products to revolutionise your business",
            description: "Discover the diverse range of store fronts under Sinosply, offering unique and exclusive products tailored to your needs.",
            linkTo: "/quote",
            linkText: "Request any product today",
            bgImage: "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
      },
      {
        id: 2,
            title: "Seamless Connections to China's Top Suppliers",
            description: "Access our curated network of over 2,000 trusted Chinese manufacturers with direct factory prices.",
            linkTo: "/products",
            linkText: "Explore our products",
            bgImage: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
      },
      {
        id: 3,
            title: "Sustainable Sourcing for a Greener Future",
            description: "Choose from a range of sustainable and eco-friendly products with green certifications.",
            linkTo: "/quote",
            linkText: "Get a free quote",
            bgImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
          }
        ]}
      />

      {/* Product Explorer */}
      <ProductExplorer 
        title="Sample Products"
        products={formattedSampleProducts}
        loading={productsLoading}
        disableExploreButton={true}
      />

      {/* Key Features Section */}
      <KeyFeatures />

      {/* Stores Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Sinosply Stores</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Explore our specialized stores offering curated products for every need
            </p>
          </motion.div>
          
          {platformsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {platformsToDisplay.map((platform, index) => (
                <motion.div 
                  key={platform._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="h-[400px] overflow-hidden">
                    <img 
                      src={platform.logoUrl || platform.bannerUrl}
                      alt={platform.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x400?text=Sinosply";
                      }}
                    />
                  </div>
                  <div className="p-6 border-t-2 border-red-600">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-red-600 transition-colors">{platform.name}</h3>
                    {platform.description && (
                      <p className="text-gray-600 mb-4">{platform.description}</p>
                    )}
                    <a 
                      href={platform.domain !== '#' ? `https://${platform.domain}` : '/products'} 
                      target={platform.domain !== '#' ? "_blank" : "_self"} 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      SHOP NOW <FaLongArrowAltRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                </div>
                </motion.div>
            ))}
          </div>
          )}
          
          <motion.div 
            className="flex justify-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/stores" 
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-black text-white rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              View All Stores <FaLongArrowAltRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Sinosply Section */}
      <WhyChooseUs />

      {/* CTA Footer */}
      <CTAFooter />


      <Footer />
    </div>
  );
};

export default Home;
