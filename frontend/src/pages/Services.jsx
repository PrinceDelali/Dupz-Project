import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaShieldAlt, FaSearch, FaLightbulb, FaStore, FaHandshake } from 'react-icons/fa';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import '../styles/Home.css';
import { Link } from 'react-router-dom';

const Services = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 } 
    }
  };
  
  // Services data
  const services = [
    {
      id: 1,
      title: 'Product Sourcing',
      description: 'We connect you with verified manufacturers in China, ensuring quality products at competitive prices.',
      icon: <FaSearch className="h-8 w-8" />,
      features: [
        'Access to 2,000+ verified factories',
        'Competitive pricing negotiations',
        'Quality supplier verification',
        'Sample management'
      ]
    },
    {
      id: 2,
      title: 'Quality Control',
      description: 'Our on-the-ground team conducts thorough quality inspections before shipping to ensure product standards.',
      icon: <FaShieldAlt className="h-8 w-8" />,
      features: [
        'Pre-production inspections',
        'During-production quality checks',
        'Final random sampling',
        'Comprehensive quality reports'
      ]
    },
    {
      id: 3,
      title: 'Product Development',
      description: 'Transform your ideas into market-ready products with our comprehensive development service.',
      icon: <FaLightbulb className="h-8 w-8" />,
      features: [
        'Product design consultation',
        'Prototype creation and testing',
        'Material and component sourcing',
        'Manufacturing process optimization'
      ]
    },
    {
      id: 4,
      title: 'Launch Your Brand',
      description: 'Start your own niche store or drop shipping company with our Brand Partnership program.',
      icon: <FaStore className="h-8 w-8" />,
      features: [
        'Launch faster with turnkey solutions',
        'Manage smarter with our platform',
        'Grow without inventory headaches',
        'Dedicated brand strategy support'
      ]
    }
  ];
  
  // Specialized services data
  const specializedServices = [
    {
      title: 'Brand Partnership Program',
      description: 'Our exclusive program helps entrepreneurs launch successful e-commerce businesses without the traditional barriers.',
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Private Labeling',
      description: 'Build your brand identity with custom packaging and labeling solutions designed to stand out in the market.',
      image: 'https://images.unsplash.com/photo-1635405074683-96d6921a2a68?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Dropshipping',
      description: 'Start selling online with zero inventory using our end-to-end dropshipping service that handles fulfillment and shipping.',
      image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-r from-red-600 to-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-white/5 transform -skew-x-12"></div>
          <div className="absolute right-0 bottom-0 h-1/2 w-1/3 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Our Services
          </motion.h1>
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-red-100 max-w-3xl mx-auto text-lg mb-8"
          >
            End-to-end solutions to simplify your China sourcing and brand launch journey
          </motion.p>
        </div>
      </section>
      
      {/* Main Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Our Core Services</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              From product development to brand launch, we provide comprehensive solutions for your business growth.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            {services.map((service, index) => (
              <motion.div 
                key={service.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="p-8">
                  <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-6 text-red-600">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FaCheck className="text-red-600 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Brand Partnership Program Highlight */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-gradient-to-r from-red-600 to-black rounded-2xl overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="md:flex">
              <div className="md:w-1/2 p-10 md:p-12">
                <h2 className="text-3xl font-bold text-white mb-4">Brand Partnership Program</h2>
                <p className="text-red-100 mb-6">
                  Launch faster, manage smarter, and grow without inventory headaches. Our exclusive program helps entrepreneurs start successful e-commerce businesses.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <FaCheck className="text-white mt-1 mr-3 flex-shrink-0" />
                    <span className="text-white">Complete brand setup and storefront design</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-white mt-1 mr-3 flex-shrink-0" />
                    <span className="text-white">Product sourcing and inventory management</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-white mt-1 mr-3 flex-shrink-0" />
                    <span className="text-white">Marketing strategy and support</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-white mt-1 mr-3 flex-shrink-0" />
                    <span className="text-white">Ongoing business coaching</span>
                  </li>
                </ul>
                <Link 
                  to="/quote"
                  className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors duration-300"
                >
                  Learn More About Partnership
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="md:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80')" }}>
                <div className="h-full w-full bg-black bg-opacity-30 p-12 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-white text-2xl font-bold mb-4">Ready to Launch Your Brand?</h3>
                    <Link 
                      to="/quote"
                      className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-red-600 transition-colors duration-300"
                    >
                      Get Started Today
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Specialized Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Specialized Services</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Beyond our core offerings, we provide specialized services tailored to your specific needs
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {specializedServices.map((service, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="p-6 border-t-2 border-red-600">
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <Link 
                    to="/quote" 
                    className="inline-flex items-center font-medium text-red-600 hover:text-red-800 transition-colors"
                  >
                    Learn more 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to transform your business?</h2>
            <p className="text-lg text-red-100 mb-8 max-w-3xl mx-auto">
              Get personalized service and expert guidance to launch or scale your e-commerce business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/quote"
                className="inline-flex justify-center items-center px-8 py-3 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors duration-300"
              >
                <FaHandshake className="mr-2" />
                Request a Quote
              </Link>
              <Link 
                to="/sinosply-contact"
                className="inline-flex justify-center items-center px-8 py-3 border border-white bg-transparent text-white rounded-lg font-medium hover:bg-white/10 transition-colors duration-300"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Services; 