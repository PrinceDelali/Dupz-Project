import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import apiConfig from '../config/apiConfig';

const SinosplyContact = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 } 
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Create the submission data with original email and the forwarding address
      const submissionData = {
        ...formData,
        forwardTo: 'kenwynwejones@gmail.com', // Always send to this verified email
        originalEmail: formData.email // Keep track of the customer's email
      };
      
      console.log('Sending contact form submission to:', `${apiConfig.baseURL}/contact`);
      console.log('Form data:', submissionData);
      
      const response = await axios.post(`${apiConfig.baseURL}/contact`, submissionData);
      
      setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      // For development: try sending to a test endpoint if API fails
      try {
        console.log('Attempting fallback email delivery...');
        await axios.post('https://api.resend.com/emails', {
          from: 'onboarding@resend.dev',
          to: 'kenwynwejones@gmail.com',
          subject: `[CONTACT FORM] ${formData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong> ${formData.message}</p>
          `
        }, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY || 'your-resend-api-key'}`
          }
        });
        
        setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } catch (fallbackError) {
        console.error('Fallback email delivery failed:', fallbackError);
        setStatus({ 
          type: 'error', 
          message: 'Unable to send your message at this time. Please try again later or contact us directly at info@sinosply.com.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Contact information
  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="w-6 h-6" />,
      title: "Visit Us",
      details: [
        "123 Sourcing Avenue",
        "Guangzhou, China 510000"
      ]
    },
    {
      icon: <FaPhone className="w-6 h-6" />,
      title: "Call Us",
      details: [
        "+233 59 503 4394",
        "+233 59 503 4394"
      ]
    },
    {
      icon: <FaEnvelope className="w-6 h-6" />,
      title: "Email Us",
      details: [
        "info@sinosply.com",
        "founder@sinosply.com"
      ]
    },
    {
      icon: <FaClock className="w-6 h-6" />,
      title: "Working Hours",
      details: [
        "Monday-Friday: 9AM - 6PM",
        "Saturday: 10AM - 2PM"
      ]
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
            Contact Us
          </motion.h1>
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-red-100 max-w-3xl mx-auto text-lg mb-8"
          >
            Get in touch with our team for sourcing solutions and inquiries
          </motion.p>
        </div>
      </section>
      
      {/* Contact Information Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900">Our Contact Information</h2>
            <div className="mt-2 w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              We're here to help with all your sourcing needs - feel free to reach out!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((item, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center mb-4 text-red-600">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                {item.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-600">{detail}</p>
                ))}
              </motion.div>
            ))}
          </div>
          
          {/* Contact Form Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <motion.div 
              className="lg:col-span-2 bg-gray-50 p-8 rounded-xl"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Get In Touch</h3>
              <p className="text-gray-600 mb-6">
                Have questions about sourcing from China? Need help with your supply chain? 
                Fill out the form and our team will get back to you promptly.
              </p>
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                  alt="Sinosply office" 
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="+233 59 503 4394"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="How can we help you?"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide details about your inquiry..."
                  ></textarea>
                </div>

                {status.message && (
                  <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {status.message}
                  </div>
                )}
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl overflow-hidden shadow-lg h-96">
            <iframe 
              title="Sinosply Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3653.0131245227506!2d113.2592136!3d23.1289336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3402ff60eb0ec3d1%3A0xdb4b69b0ddf9e1ad!2sGuangzhou%2C%20Guangdong%2C%20China!5e0!3m2!1sen!2s!4v1655969015212!5m2!1sen!2s" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default SinosplyContact; 