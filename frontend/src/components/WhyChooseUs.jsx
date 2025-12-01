import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaQuoteLeft, FaLongArrowAltRight } from 'react-icons/fa';

const WhyChooseUs = ({ 
  title = "Why Choose Sinosply",
  benefits = [], 
  testimonials = [],
  backgroundColor = "bg-white"
}) => {
  const [hoveredBenefit, setHoveredBenefit] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Default benefits if none are provided
  const defaultBenefits = [
    { id: 1, text: 'Cost Savings', description: 'Reduce your sourcing costs by up to 30% with our direct factory connections.' },
    { id: 2, text: 'Fast Turnaround', description: 'Get your products delivered in record time with our streamlined logistics.' },
    { id: 3, text: 'Trusted Partner', description: 'Join hundreds of businesses who rely on our expertise and integrity.' }
  ];

  // Default testimonials if none are provided
  const defaultTestimonials = [
    {
      id: 1,
      quote: "Sinosply sourced our sofa line in 30 days, saving us 25%! The quality exceeded our expectations and our customers love the products.",
      author: "David Mensah",
      company: "Accra Furnish",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 2,
      quote: "Working with Sinosply transformed our supply chain. Their expertise in navigating the Chinese market saved us both time and money.",
      author: "Sarah Johnson",
      company: "Global Imports Ltd",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    }
  ];

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;
  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Cycle to next testimonial every 6 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % displayTestimonials.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [displayTestimonials.length]);

  // Subtle animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  const floatingAnimation = {
    initial: { y: 0 },
    animate: {
      y: [0, -8, 0],
      transition: { 
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut" 
      }
    }
  };

  return (
    <section className={`why-choose-us py-24 ${backgroundColor} relative overflow-hidden`}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-100 rounded-full transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-red-200 rounded-full transform -translate-x-1/4 translate-y-1/4"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section title with thin underline */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
          <div className="mt-3 mx-auto h-0.5 w-16 bg-red-600"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Benefits column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative"
          >
            {/* Decorative element */}
            <motion.div 
              className="absolute -top-10 -left-10 w-20 h-20 text-red-50 z-0 opacity-50"
              {...floatingAnimation}
            >
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M45.2,-60.8C59.2,-51.7,71.8,-39.4,77.2,-24.3C82.7,-9.2,81,8.7,73.9,24.2C66.8,39.8,54.3,53,39.4,60.9C24.5,68.9,7.2,71.6,-9.2,69.8C-25.6,68,-41.2,61.8,-54.3,51C-67.5,40.2,-78.3,24.8,-80.8,7.7C-83.3,-9.4,-77.4,-28.2,-65.5,-41.4C-53.6,-54.6,-35.7,-62.2,-19.5,-70.1C-3.3,-77.9,11.1,-86,26.3,-81.1C41.4,-76.2,57.3,-58.4,45.2,-60.8Z" transform="translate(100 100)" />
              </svg>
            </motion.div>

            <motion.h3 
              className="text-xl font-semibold mb-8 inline-flex items-center relative"
              variants={itemVariants}
            >
              <span className="h-px w-6 bg-red-600 absolute -left-8 top-1/2"></span>
              Key Benefits
            </motion.h3>
            
            <ul className="space-y-8">
              {displayBenefits.map((benefit) => (
                <motion.li 
                  key={benefit.id}
                  variants={itemVariants}
                  onMouseEnter={() => setHoveredBenefit(benefit.id)}
                  onMouseLeave={() => setHoveredBenefit(null)}
                  className="flex group"
                >
                  <motion.div 
                    className="flex-shrink-0 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mr-5 transition-all duration-300"
                    animate={{ 
                      scale: hoveredBenefit === benefit.id ? 1.1 : 1,
                      backgroundColor: hoveredBenefit === benefit.id ? "#FEE2E2" : "#FEF2F2"
                    }}
                  >
                    <FaStar className="text-red-600 transition-all duration-300" 
                      style={{ 
                        transform: hoveredBenefit === benefit.id ? "rotate(15deg)" : "rotate(0deg)"
                      }} 
                    />
                  </motion.div>
                  <div className="pt-1">
                    <h4 className="text-lg font-medium mb-1 transition-colors duration-300 group-hover:text-red-600">{benefit.text}</h4>
                    {benefit.description && (
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Testimonials column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="testimonial-slider"
          >
            <motion.h3 
              className="text-xl font-semibold mb-8 inline-flex items-center relative"
              variants={itemVariants}
            >
              <span className="h-px w-6 bg-red-600 absolute -left-8 top-1/2"></span>
              Client Testimonials
            </motion.h3>

            {/* Testimonial card with slider dots */}
            <div className="relative h-72 md:h-64">
              <AnimatePresence mode="wait">
                {displayTestimonials.map((testimonial, index) => (
                  index === activeTestimonial && (
                    <motion.div 
                      key={testimonial.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-white p-8 rounded-lg shadow-sm border border-gray-100"
                    >
                      <FaQuoteLeft className="text-red-100 text-4xl absolute top-4 left-4 -z-10" />
                      <p className="text-gray-800 italic mb-6 leading-relaxed">{testimonial.quote}</p>
                      <div className="flex items-center mt-auto">
                        {testimonial.avatar && (
                          <div className="h-14 w-14 rounded-full overflow-hidden mr-4 border-2 border-gray-100">
                            <img 
                              src={testimonial.avatar} 
                              alt={testimonial.author}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{testimonial.author}</p>
                          {testimonial.company && (
                            <p className="text-sm text-gray-500">{testimonial.company}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>
            
            {/* Testimonial navigation */}
            {displayTestimonials.length > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex space-x-2">
                  {displayTestimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-8 h-1 rounded-full transition-all duration-300 ${
                        index === activeTestimonial ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
                <button className="text-red-600 flex items-center text-sm font-medium hover:underline focus:outline-none" onClick={() => setActiveTestimonial((activeTestimonial + 1) % displayTestimonials.length)}>
                  Next 
                  <FaLongArrowAltRight className="ml-1" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs; 