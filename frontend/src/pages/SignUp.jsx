import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiShoppingCart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { register, socialAuth } from '../services/auth';
import axios from 'axios';
import apiConfig from '../config/apiConfig';


// Create an axios instance with the correct baseURL
const api = axios.create({
  baseURL: apiConfig.baseURL
});

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      // Register the user
      const response = await register(formData);
      
      // If registration is successful, send welcome email
      if (response && response.success) {
        try {
          // Send welcome email
          await api.post('/email/welcome', {
            email: formData.email,
            userData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              userId: response.userId || response._id || ''
            }
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Continue with registration process even if email fails
        }
      }
      
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSocialSignup = async (provider) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await socialAuth(provider);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        const userData = {
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        (userData);
        
        // Send welcome email for social sign-ups too
        try {
          await api.post('/email/welcome', {
            email: userData.email,
            userData: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              userId: response.user._id || ''
            }
          });
          console.log('Welcome email sent for social signup');
        } catch (emailError) {
          console.error('Failed to send welcome email for social signup:', emailError);
          // Continue with login process even if email fails
        }
        
        navigate('/sinosply-stores');
      }
    } catch (err) {
      setError(err.message || `${provider} signup failed`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-600 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-600 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-600 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-600 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="(+233) 000-000-000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long with letters and numbers
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        {/* 3D Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ 
              y: [0, -20, 0],
              opacity: 1,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-20"
          >
            <div className="w-32 h-32 bg-white backdrop-blur-sm rounded-2xl transform rotate-12 border border-gray-200 shadow-xl">
              <FiShoppingCart className="w-12 h-12 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
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
            className="space-y-6"
          >
            <div className="bg-white shadow-xl p-8 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full ring-2 ring-white bg-black" />
                  ))}
                </div>
                <div className="text-sm text-gray-600">Join 10,000+ businesses worldwide</div>
              </div>
              <p className="text-gray-700 italic text-lg leading-relaxed">
                "Connecting with verified suppliers through Sinosply transformed our sourcing process. The platform's efficiency and reliability are unmatched."
              </p>
              <div className="mt-6 flex items-center">
                <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold">JM</span>
                </div>
                <div className="ml-3">
                  <p className="text-gray-900 font-medium">James Mensah</p>
                  <p className="text-gray-500 text-sm">Supply Chain Director</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-center text-gray-500 text-sm">
              Sign up to get started
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-8 relative">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 
                      ${step >= num 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'}`}
                  >
                    {num}
                  </motion.div>
                  {num < 3 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-1 transition-all duration-300 ${
                        step > num 
                          ? 'bg-black' 
                          : 'bg-gray-200'
                      }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <motion.button
                  type="button"
                  onClick={prevStep}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back
                </motion.button>
              )}
              {step < 3 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-auto px-6 py-2 text-sm text-white bg-black rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className={`w-full px-6 py-2 text-sm text-white bg-black rounded-lg 
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'} 
                    transition-all duration-200 shadow-lg`}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              )}
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <motion.button
                  type="button"
                  onClick={() => handleSocialSignup('google')}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center py-2 px-6 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-700">Sign up with Google</span>
                </motion.button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-black hover:text-gray-700 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>

  );
};

export default SignUp;
