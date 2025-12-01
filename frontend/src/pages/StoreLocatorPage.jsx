import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import HomeNavbar from '../components/HomeNavbar';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaSearch, FaDirections, FaGlobe, FaCalendarAlt, FaVideo } from 'react-icons/fa';

const StoreLocatorPage = () => {
  // Headquarters data
  const [headquarters] = useState([
    {
      id: 1,
      name: "China Headquarters",
      address: "888 Innovation Boulevard, Shanghai, China",
      phone: "+86 21 1234 5678",
      email: "china@sinosply.com",
      hours: "Mon-Fri: 9AM-5PM (CST)",
      coordinates: { lat: 31.2304, lng: 121.4737 },
      image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    },
    {
      id: 2,
      name: "Ghana Headquarters",
      address: "45 Independence Avenue, Accra, Ghana",
      phone: "+233 30 273 4567",
      email: "ghana@sinosply.com",
      hours: "Mon-Fri: 8AM-4PM (GMT)",
      coordinates: { lat: 5.6037, lng: -0.1870 },
      image: "https://images.unsplash.com/photo-1594706468440-074de45e4ab2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    }
  ]);

  const [selectedLocation, setSelectedLocation] = useState(headquarters[0]);
  const [consultationType, setConsultationType] = useState('virtual');
  
  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  // Handle consultation type change
  const handleConsultationTypeChange = (type) => {
    setConsultationType(type);
  };

  return (
    <>
      <Helmet>
        <title>Global Locations | Sinosply</title>
        <meta name="description" content="Connect with Sinosply's global headquarters in China and Ghana" />
      </Helmet>

      <HomeNavbar />

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-4">Our Global Presence</h1>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Sinosply operates virtually with headquarters in China and Ghana. While we don't have physical retail locations at the moment, 
            we offer virtual consultations and global shipping to bring our products directly to your doorstep.
          </p>

          {/* Virtual/Physical toggle */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button 
              onClick={() => handleConsultationTypeChange('virtual')}
              className={`px-4 py-2 rounded-full ${consultationType === 'virtual' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              <FaVideo className="inline mr-2" /> Virtual Consultation
            </button>
            <button 
              onClick={() => handleConsultationTypeChange('schedule')}
              className={`px-4 py-2 rounded-full ${consultationType === 'schedule' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              <FaCalendarAlt className="inline mr-2" /> Schedule a Call
            </button>
          </div>

          {/* Consultation content */}
          {consultationType === 'virtual' && (
            <div className="bg-gray-50 p-6 rounded-lg mb-12">
              <h2 className="text-2xl font-bold mb-4">Virtual Consultation</h2>
              <p className="mb-4">Experience our products from anywhere in the world with our one-on-one virtual consultation.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-2">How It Works</h3>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>Select your preferred products from our online store</li>
                    <li>Schedule a 30-minute video consultation</li>
                    <li>Meet with our product specialists to discuss options</li>
                    <li>Receive personalized recommendations</li>
                  </ol>
                  <button className="mt-6 bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors">
                    Book a Virtual Consultation
                  </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold mb-2">Benefits</h3>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>Personalized product guidance</li>
                    <li>See products up close through high-definition video</li>
                    <li>Ask questions in real-time</li>
                    <li>Shop from the comfort of your home</li>
                    <li>Available in multiple languages</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {consultationType === 'schedule' && (
            <div className="bg-gray-50 p-6 rounded-lg mb-12">
              <h2 className="text-2xl font-bold mb-4">Schedule a Call</h2>
              <p className="mb-6">Choose a time that works for you to speak with one of our product specialists.</p>
              <form className="max-w-lg">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Preferred Date & Time</label>
                  <input type="datetime-local" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Product Interest</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
                    <option value="">Select a product category</option>
                    <option>Fashion Items</option>
                    <option>Electronics</option>
                    <option>Home Goods</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Questions or Comments</label>
                  <textarea className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black h-28"></textarea>
                </div>
                <button className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors">
                  Schedule Call
                </button>
              </form>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">Our Headquarters</h2>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Headquarters list */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {headquarters.map(location => (
                  <div 
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedLocation.id === location.id ? 'bg-gray-100 border-l-4 border-l-black' : ''}`}
                  >
                    <h3 className="font-bold text-lg">{location.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{location.address}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <FaClock className="mr-1" />
                      <span>{location.hours}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Global Shipping</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We ship to over 100 countries worldwide with competitive shipping rates and fast delivery options.
                </p>
                <Link to="/shipping" className="text-sm font-medium hover:underline flex items-center">
                  <FaGlobe className="mr-1" /> View Shipping Information
                </Link>
              </div>
            </div>

            {/* Map and headquarters details */}
            <div className="lg:w-2/3">
              {selectedLocation && (
                <>
                  {/* Map placeholder with location image */}
                  <div className="bg-gray-200 rounded-lg h-80 mb-6 overflow-hidden">
                    <div className="relative h-full">
                      <img 
                        src={selectedLocation.image} 
                        alt={selectedLocation.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="text-white text-center">
                          <p className="text-xl font-bold mb-2">{selectedLocation.name}</p>
                          <p className="mb-4">{selectedLocation.address}</p>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white text-black px-4 py-2 rounded inline-flex items-center"
                          >
                            <FaDirections className="mr-2" /> View on Map
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Headquarters details */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">{selectedLocation.name}</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-gray-500 mt-1 mr-3" />
                        <p>{selectedLocation.address}</p>
                      </div>
                      
                      <div className="flex items-start">
                        <FaPhone className="text-gray-500 mt-1 mr-3" />
                        <p>{selectedLocation.phone}</p>
                      </div>
                      
                      <div className="flex items-start">
                        <FaEnvelope className="text-gray-500 mt-1 mr-3" />
                        <p>{selectedLocation.email}</p>
                      </div>
                      
                      <div className="flex items-start">
                        <FaClock className="text-gray-500 mt-1 mr-3" />
                        <p>{selectedLocation.hours}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="font-bold mb-3">Contact Us</h3>
                      <p className="text-gray-600 mb-4">
                        Have questions or need assistance? Our team at {selectedLocation.name} is here to help.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a 
                          href={`mailto:${selectedLocation.email}`}
                          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors inline-flex items-center"
                        >
                          <FaEnvelope className="mr-2" /> Send Email
                        </a>
                        
                        <Link to="/contact" className="border border-black px-4 py-2 rounded hover:bg-gray-100 transition-colors">
                          Contact Form
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
};

export default StoreLocatorPage; 