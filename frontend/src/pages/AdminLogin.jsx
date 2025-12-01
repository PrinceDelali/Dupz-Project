import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingOverlay from '../components/LoadingOverlay';
import apiConfig from '../config/apiConfig';
import { FaStore, FaSignInAlt, FaLock, FaEnvelope } from 'react-icons/fa';
import { useCustomersStore } from '../store/customersStore';
import { useOrderStore } from '../store/orderStore';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { preloadCustomers } = useCustomersStore();
  const { preloadOrders } = useOrderStore();

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
    
    try {
      console.log('Attempting admin login with API URL:', `${apiConfig.baseURL}/auth/admin/login`);
      
      const response = await axios.post(`${apiConfig.baseURL}/auth/admin/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        
        // Preload data needed for the dashboard
        console.log('Preloading customer and order data for dashboard...');
        
        // Start both data fetches in parallel using the optimized preload functions
        const preloadPromises = [
          preloadCustomers(100),  // Preload up to 100 customers
          preloadOrders()         // Preload most recent orders
        ];
        
        try {
          await Promise.all(preloadPromises);
          console.log('Successfully preloaded dashboard data');
        } catch (preloadError) {
          // Log but continue even if preload fails
          console.warn('Data preload warning:', preloadError);
        }
        
        // Navigate to dashboard
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError('');
      const testUrl = `${apiConfig.baseURL}/auth/test-connection`;
      console.log('Testing API connection:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      console.log('API test response:', data);
      alert(`API Connection Test: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('API test error:', err);
      setError(`API Connection Failed: ${err.message}`);
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
            <FaStore className="text-2xl" />
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-800">
            Sinosply Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in to access your administration dashboard
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
                  placeholder="Admin email"
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
              Sign in as Admin
            </button>
          </div>
          
          <div>
            <button
              type="button"
              onClick={testApiConnection}
              className="w-full flex justify-center py-2 px-4 border border-purple-300 text-sm font-medium rounded-lg text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Test API Connection
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-purple-600">
            Back to main store
          </Link>
          <div className="mt-2">
            <Link to="/staff/login" className="text-sm text-purple-600 hover:text-purple-800">
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 