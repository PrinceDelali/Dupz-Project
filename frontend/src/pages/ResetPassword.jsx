import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    // We could verify token validity here if needed
    if (!token) {
      setIsTokenValid(false);
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Resetting password with token');
      
      await axios.put(`${apiConfig.baseURL}/auth/resetpassword/${token}`, {
        password
      });
      
      console.log('✅ Password reset successful');
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('❌ Password reset error:', err);
      
      if (err.response?.status === 400) {
        setIsTokenValid(false);
        setError('Your password reset link has expired or is invalid. Please request a new one.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password. Please try again.');
      }
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
          </div>
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-auto"
          >
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">
                Choose a strong, secure password that you don't use for other accounts. A good password is at least 8 characters long and contains a mix of letters, numbers, and symbols.
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
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Enter your new password below
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

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-6"
            >
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <p className="text-green-700 text-center">
                  Your password has been successfully reset!
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  You will be redirected to the login page shortly...
                </p>
              </div>
            </motion.div>
          ) : isTokenValid ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
                <div className="relative group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 bg-white rounded-t-lg text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all duration-200"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-black transition-colors" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-black transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 bg-white rounded-t-lg text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all duration-200"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-black transition-colors" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400 hover:text-black transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
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
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
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
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <p className="text-red-600 text-center">
                  Invalid or expired password reset link.
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  Please request a new password reset link.
                </p>
              </div>
              <Link to="/forgot-password">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center py-3 px-4 border border-black text-sm font-medium rounded-lg text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-150"
                >
                  Request New Link
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 