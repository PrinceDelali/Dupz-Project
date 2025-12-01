import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Footer from '../components/Footer';
import HomeNavbar from '../components/HomeNavbar';
import { motion } from 'framer-motion';
import { FaRocket, FaGlobeAfrica, FaHeartbeat, FaBrain, FaCheckCircle, FaUserPlus } from 'react-icons/fa';

const CareersPage = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    position: '',
    experience: '',
    message: '',
    resume: null
  });
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e) => {
    setFormState(prev => ({ ...prev, resume: e.target.files[0] }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmissionStatus('submitting');
    
    // Simulate form submission
    setTimeout(() => {
      setSubmissionStatus('success');
      setFormState({
        name: '',
        email: '',
        position: '',
        experience: '',
        message: '',
        resume: null
      });
      // Reset file input
      document.getElementById('resumeUpload').value = '';
    }, 2000);
  };
  
  return (
    <>
      <Helmet>
        <title>Careers | Sinosply</title>
        <meta name="description" content="Explore future career opportunities at Sinosply" />
      </Helmet>

      <HomeNavbar />

      {/* Hero Section */}
      <div className="bg-gray-100">
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Global Team</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              We're building something special at Sinosply. While we don't have any open positions at the moment, we're always looking for exceptional talent for future opportunities.
            </p>
            <a href="#talent-pool" className="bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors">
              Join Our Talent Pool
            </a>
          </motion.div>
        </div>
      </div>

      {/* Company Values */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            As a fully virtual company with headquarters in China and Ghana, we embody these core principles that guide everything we do.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaRocket className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Innovation</h3>
            <p className="text-gray-600">We embrace new ideas and technologies to deliver exceptional products and experiences across global markets.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGlobeAfrica className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Global Mindset</h3>
            <p className="text-gray-600">We celebrate diverse perspectives and build bridges between cultures to create truly international experiences.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeartbeat className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Passion</h3>
            <p className="text-gray-600">We bring enthusiasm and commitment to everything we do, from product development to customer service.</p>
          </motion.div>
        </div>
      </div>

      {/* Future Growth */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Future Growth</h2>
            <p className="text-xl text-gray-600 mb-8">
              Sinosply is expanding rapidly as we develop our global presence. While we're currently operating virtually with headquarters in China and Ghana, we have ambitious growth plans for the future.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start mb-4">
                <div className="bg-black rounded-full p-3 mr-4 text-white">
                  <FaBrain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Remote-First Culture</h3>
                  <p className="text-gray-600">
                    We've built a collaborative virtual environment that enables talented individuals around the world to work together seamlessly, regardless of location.
                  </p>
                </div>
              </div>
              <ul className="ml-16 space-y-2 text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Flexible work arrangements</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Global collaboration tools</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Virtual team-building</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start mb-4">
                <div className="bg-black rounded-full p-3 mr-4 text-white">
                  <FaUserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Future Opportunities</h3>
                  <p className="text-gray-600">
                    As we grow, we'll be expanding our team with roles in these key areas:
                  </p>
                </div>
              </div>
              <ul className="ml-16 space-y-2 text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>E-commerce Operations</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Product Development</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Global Logistics</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  <span>Digital Marketing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Talent Pool */}
      <div id="talent-pool" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Talent Pool</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              While we don't have any open positions at the moment, we'd love to keep your information on file for future opportunities. Share your details with us and we'll reach out when a suitable role becomes available.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="position">Area of Interest</label>
                  <select 
                    id="position"
                    name="position"
                    value={formState.position}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                  >
                    <option value="">Select an option</option>
                    <option value="E-commerce Operations">E-commerce Operations</option>
                    <option value="Product Development">Product Development</option>
                    <option value="Global Logistics">Global Logistics</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="experience">Years of Experience</label>
                  <select 
                    id="experience"
                    name="experience"
                    value={formState.experience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                  >
                    <option value="">Select an option</option>
                    <option value="0-1 years">0-1 years</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="message">Why do you want to work with us?</label>
                <textarea 
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black h-32"
                  disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                ></textarea>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2" htmlFor="resumeUpload">Upload Resume (PDF, DOC, DOCX)</label>
                <input 
                  type="file" 
                  id="resumeUpload"
                  name="resume"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  accept=".pdf,.doc,.docx"
                  disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
              </div>
              
              {submissionStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-start">
                  <FaCheckCircle className="mt-1 mr-2" />
                  <div>
                    <p className="font-medium">Thank you for your submission!</p>
                    <p className="text-sm">We've received your information and will keep it on file for future opportunities.</p>
                  </div>
                </div>
              ) : (
                <button 
                  type="submit" 
                  className={`bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors ${submissionStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={submissionStatus === 'submitting'}
                >
                  {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </form>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-xl font-medium mb-3">Stay Updated</h3>
            <p className="text-gray-600">
              Follow us on social media to stay updated on future opportunities and company news.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CareersPage; 