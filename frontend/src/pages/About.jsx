import React from 'react';
import { motion } from 'framer-motion';
import { FaUserCheck, FaPuzzlePiece, FaGlobeAsia, FaAward, FaShippingFast, FaCertificate } from 'react-icons/fa';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import '../styles/Home.css';

const About = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 } 
    }
  };
  
  // Service categories data
  const services = [
    {
      title: 'Product Discovery & Development',
      items: [
        'Concept sourcing and prototype support',
        'Market research & trend analysis',
        'Material selection and sample refinement'
      ],
      icon: <FaPuzzlePiece className="w-6 h-6" />
    },
    {
      title: 'Supplier Matching & Negotiation',
      items: [
        'Hand-picked, audit-passed factories',
        'Volume-based pricing and flexible minimum order quantities',
        'Contract drafting and terms management'
      ],
      icon: <FaUserCheck className="w-6 h-6" />
    },
    {
      title: 'Quality Control & Inspection',
      items: [
        'Factory Visits: On-site checks during production',
        'Sample Verification: Detailed review of pre-production samples',
        'Pefect Reporting: Photos and reports on any issues, plus corrective action plans'
      ],
      icon: <FaAward className="w-6 h-6" />
    },
    {
      title: 'Order Management & Logistics',
      items: [
        'Real-time production updates',
        'Multi-modal shipping coordination (air, sea, express)',
        'Customs clearance and last-mile delivery'
      ],
      icon: <FaShippingFast className="w-6 h-6" />
    },
    {
      title: 'Brand Partnership & Store Enablement',
      items: [
        'Turnkey support for launching niche online brands',
        'Integrated inventory feeds straight from factories',
        'White-label packaging and custom branding solutions'
      ],
      icon: <FaGlobeAsia className="w-6 h-6" />
    }
  ];
  
  // Differentiators data
  const differentiators = [
    {
      title: 'Verified Partners',
      description: 'Every factory we work with passes a rigorous audit for quality, ethics, and capacity.',
      icon: <FaUserCheck className="w-6 h-6" />
    },
    {
      title: 'Lean & Flexible',
      description: 'No bulky warehouses. We coordinate smart batch runs and express shipping so you stay nimble.',
      icon: <FaShippingFast className="w-6 h-6" />
    },
    {
      title: 'End-to-End Care',
      description: 'Product development, price negotiation, quality checks, order management, and worldwide logistics—all under one roof.',
      icon: <FaGlobeAsia className="w-6 h-6" />
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
            About Dupz-Storees
          </motion.h1>
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-red-100 max-w-3xl mx-auto text-lg mb-8"
          >
            Your Bridge to Smarter Product & Brand Growth
          </motion.p>
        </div>
      </section>
      
      {/* Introduction Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
              <div className="w-24 h-1 bg-red-600 mb-6"></div>
              <p className="text-gray-600 mb-6">
                At Dupz-Stores, we believe great products deserve the shortest path from factory floor to front door.
              </p>
              <p className="text-gray-600 mb-6">
                A team of sourcing specialists with deep roots in China's manufacturing hubs, we've helped startups, e‑commerce brands, 
                and retail innovators cut through red tape and inventory headaches.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-8">Our Mission</h3>
              <p className="text-gray-600">
                To power your growth by combining factory‑direct efficiency with white‑glove service. From the first sample to final 
                shipment, our goal is always the same: deliver quality, cut costs, and free you to focus on what matters—building your brand.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-black/5 rounded-lg transform rotate-3"></div>
              <img 
                src="https://www.globalr2p.org/wp-content/uploads/2025/08/China_-August-2025.png" 
                alt="Founder" 
                className="relative z-10 rounded-lg shadow-lg object-cover w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Why We're Different Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Why We're Different</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              What sets us apart from traditional sourcing companies
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentiators.map((item, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center mb-4 text-red-600">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-gray-600 text-center mt-10 max-w-3xl mx-auto"
          >
            As we expand, we're also proud to introduce three live, consumer‑facing brands powered by our model. 
            Explore them under "Products" below—each one a testament to our curated, factory‑direct approach.
          </motion.p>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              We take the complexity out of global sourcing and brand fulfillment so you can scale confidently.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="p-6 border-b-2 border-red-600">
                  <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center mb-4 text-red-600">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-2">
                    {service.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Quote Request Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Custom Quote Requests</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Fill out a quick form with your product specs and timelines—get tailored pricing and lead times within 48 hours.
            </p>
          </motion.div>
          
          <div className="flex justify-center">
            <motion.a
              href="/quote"
              className="inline-flex items-center px-8 py-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-300 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Request a Quote
            </motion.a>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to work with us?</h2>
            <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
              Start your sourcing journey with Sinosply today and experience the difference of having a dedicated partner on the ground in China.
            </p>
            <a 
              href="/quote" 
              className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors duration-300"
            >
              Request a Quote
            </a>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default About; 