import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaShieldAlt, FaGlobeAsia, FaLeaf, FaLightbulb } from 'react-icons/fa';

const KeyFeatures = ({ title = "Key Features", features = [], backgroundColor = "bg-gray-50" }) => {
  // Default features if none are provided
  const defaultFeatures = [
    {
      title: 'Seamless Connections to China\'s Top Suppliers',
      icon: <FaGlobeAsia className="text-red-500" />,
      points: [
        'Vetted Supplier Network: Access our curated network of over 2,000 trusted Chinese manufacturers.',
        'Direct Factory Prices: Benefit from competitive pricing directly from the source.',
        'Quality Assurance: Rigorous checks ensure product quality and compliance.'
      ]
    },
    {
      title: 'Sustainable Sourcing for a Greener Future',
      icon: <FaLeaf className="text-green-500" />,
      points: [
        'Eco-Friendly Products: Choose from a range of sustainable and eco-friendly products.',
        'Green Certifications: Products certified for environmental sustainability.',
        'Carbon Footprint Reduction: Partner with us to reduce your carbon footprint.'
      ]
    },
    {
      title: 'E-Commerce & Product Sourcing Expertise',
      icon: <FaLightbulb className="text-yellow-500" />,
      points: [
        'Comprehensive Market Insights: Leverage our expertise to navigate the Chinese market.',
        'End-to-End Solutions: From sourcing to shipping, we handle it all.',
        'Custom Product Development: Collaborate with us to create products tailored to your needs.'
      ]
    },
    {
      title: 'Scale Your Business Globally',
      icon: <FaShieldAlt className="text-black" />,
      points: [
        'Global Distribution Network: Reach customers worldwide with our logistics solutions.',
        'Market Expansion Strategies: Expand your business into new markets with confidence.',
        'Cross-Border E-Commerce: Seamlessly sell your products across borders.'
      ]
    }
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section className={`key-features py-20 ${backgroundColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title with accent line */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          <div className="mt-3 mx-auto h-1 w-20 bg-red-600 rounded-full"></div>
        </div>

        {/* Features grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {displayFeatures.map((feature, index) => (
            <motion.div 
              variants={itemVariants}
              key={feature.title} 
              className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              {/* Icon and title */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                  {feature.icon || <div className="w-6 h-6 bg-red-500 rounded-full"></div>}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <div className="h-1 w-10 bg-gray-200 rounded-full"></div>
              </div>
              
              {/* Points */}
              <ul className="space-y-3">
                {feature.points.map((point, i) => {
                  const [title, description] = point.split(': ');
                  return (
                    <li key={i} className="flex">
                      <span className="flex-shrink-0 mt-1 mr-2 text-red-600">
                        <FaCheck size={12} />
                      </span>
                      <div>
                        <span className="text-sm font-medium">{title}: </span>
                        <span className="text-sm text-gray-600">{description}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default KeyFeatures; 