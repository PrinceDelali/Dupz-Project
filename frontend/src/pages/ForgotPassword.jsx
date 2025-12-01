import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaLock, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('📧 Sending password reset request for:', email);
      
      // For development, we're using a single verified email
      const resetPayload = {
        email,
        verifiedEmail: 'kenwynwejones@gmail.com' // Development verified email
      };
      
      await axios.post(`${apiConfig.baseURL}/auth/forgotpassword`, resetPayload);
      console.log('✅ Password reset email sent successfully');
      setIsSubmitted(true);
    } catch (err) {
      console.error('❌ Error sending password reset:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-bold text-gray-900">
                Sino<span className="text-black">sply</span>
              </h1>
              <p className="text-gray-600 mt-4 text-lg">Your global sourcing solution</p>
            </motion.div>
            
            {/* Add large shield/lock icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center mt-12 mb-8"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gray-100 blur-md"></div>
                <FaShieldAlt className="text-black relative w-48 h-48 opacity-90" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <FaLock className="text-white w-20 h-20" />
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-auto"
          >
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">
                Forgot your password? Don't worry! Enter your email address and we'll send you instructions to reset it.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
          <div>
            <Link to="/login" className="flex items-center text-black hover:text-gray-700 transition-colors mb-6">
              <FaArrowLeft className="mr-2" />
              Back to Login
            </Link>
            <h2 className="mt-2 text-center text-3xl font-bold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Enter your email to receive reset instructions
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg relative"
            >
              {error}
            </motion.div>
          )}

          {!isSubmitted ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-gray-200 bg-white rounded-t-lg text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all duration-200"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Instructions'
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-center">
                  If an account exists with <strong>{email}</strong>, you will receive password reset instructions.
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  Please check your email inbox and spam folder.
                </p>
              </div>
              <motion.button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex justify-center py-3 px-4 border border-black text-sm font-medium rounded-lg text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-150"
              >
                Try another email
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
