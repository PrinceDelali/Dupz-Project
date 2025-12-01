import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingOverlay from '../components/LoadingOverlay';
import apiConfig from '../config/apiConfig';
import { FaStore, FaSignInAlt, FaLock, FaEnvelope, FaUserTie } from 'react-icons/fa';

const StaffLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Effect for navigation after successful login
  useEffect(() => {
    if (loginSuccess && user && user.role === 'staff') {
      console.log('🚀 [StaffLogin] Navigation effect triggered, user:', user.role);
      
      // Add a slight delay to ensure state is fully updated
      const timer = setTimeout(() => {
        console.log('🔄 [StaffLogin] Navigating to dashboard after delay');
        navigate('/admin/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoginSuccess(false);
    
    try {
      console.log('Attempting staff login with API URL:', `${apiConfig.baseURL}/auth/staff/login`);
      
      const response = await axios.post(`${apiConfig.baseURL}/auth/staff/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        console.log('Staff login successful:', response.data);
        
        // Ensure permissions are included if they're missing
        const userData = response.data.user;
        if (userData.role === 'staff' && !userData.permissions) {
          userData.permissions = ['dashboard']; // Add a default permission if missing
          console.log('Adding default permissions:', userData.permissions);
        }
        
        // Use a consistent pattern to store auth data
        console.log('🔐 [StaffLogin] Setting token in localStorage');
        localStorage.setItem('token', response.data.token);
        
        console.log('👤 [StaffLogin] Setting user in localStorage');
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update axios headers
        console.log('🔑 [StaffLogin] Setting Authorization header');
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Set user in context
        console.log('🔄 [StaffLogin] Setting user in context');
        setUser(userData);
        
        // Set success state which will trigger navigation in the useEffect
        console.log('✅ [StaffLogin] Setting loginSuccess flag');
        setLoginSuccess(true);
      }
    } catch (error) {
      console.error('Staff login error:', error);
      setError(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {loading && <LoadingOverlay />}
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="bg-purple-600 text-white p-3 rounded-full mb-4">
            <FaUserTie className="text-2xl" />
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-800">
            Sinosply Staff Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in to access your staff dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <div className="mr-2">
              <FaLock className="text-red-500" />
            </div>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Staff email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="#" className="font-medium text-purple-600 hover:text-purple-500">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaSignInAlt className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              </span>
              Sign in as Staff
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <Link to="/sinosply-stores" className="text-sm text-gray-600 hover:text-purple-600">
            Back to main store
          </Link>
          <div className="mt-2">
            <Link to="/admin/login" className="text-sm text-purple-600 hover:text-purple-800">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin; 