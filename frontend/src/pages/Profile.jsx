import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaKey, FaHistory, FaHeart, FaShoppingBag, FaSignOutAlt, FaTruck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { useOrderStore } from '../store/orderStore';
import apiConfig from '../config/apiConfig';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const orderStore = useOrderStore(); // Use the order store
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Get orders from orderStore instead of API
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  // State for order details and tracking views
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingOrderDetails, setViewingOrderDetails] = useState(false);
  const [viewingTrackingInfo, setViewingTrackingInfo] = useState(false);
  
  // Use a ref to track if orders have already been loaded
  const ordersLoaded = useRef(false);

  // Subscribe to order updates from the store
  useEffect(() => {
    // Subscribe to order updates
    const unsubscribe = orderStore.subscribeToOrderUpdates((updatedOrder) => {
      console.log('Profile - Received order update:', updatedOrder);
      
      // Only process if user is logged in and the updated order belongs to this user
      if (user && updatedOrder && 
          (updatedOrder.user === user._id || updatedOrder.userId === user._id)) {
        
        setOrders(prevOrders => {
          // Replace the updated order in the array
          const newOrders = prevOrders.map(order => 
            order._id === updatedOrder._id ? updatedOrder : order
          );
          return newOrders;
        });
        
        // Also update selectedOrder if it's the one that was updated
        if (selectedOrder && selectedOrder._id === updatedOrder._id) {
          setSelectedOrder(updatedOrder);
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, selectedOrder, orderStore]);

  // Load orders from store
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    console.log('Profile - Current user:', user, 'User ID:', user._id);
    
    // Fix any inconsistent user ID fields in orders
    orderStore.fixOrderUserIds();
    
    // Fetch orders directly from the API instead of using local store
    const fetchOrdersFromAPI = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Profile - No auth token found');
          setLoading(false);
          return;
        }
        
        console.log('Profile - Fetching orders from API for user ID:', user._id);
        const response = await axios.get(
          `${apiConfig.baseURL}/orders/my-orders`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        console.log('Profile - API Response:', response.data);
        
        if (response.data.success) {
          const fetchedOrders = response.data.data || [];
          console.log(`Profile - Successfully fetched ${fetchedOrders.length} orders from API`);
          
          // Save to store for future use
          fetchedOrders.forEach(order => orderStore.addOrder(order));
          
          // Set orders in component state
          setOrders(fetchedOrders);
        } else {
          console.error('Profile - API returned error:', response.data.error);
          setError(response.data.error || 'Failed to fetch orders');
        }
      } catch (error) {
        console.error('Profile - Error fetching orders from API:', error);
        console.error('Profile - Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          userId: user._id,
          userEmail: user.email
        });
        
        setError('Failed to load your orders. Please try again later.');
      } finally {
        setLoading(false);
        ordersLoaded.current = true;
      }
    };
    
    fetchOrdersFromAPI();
  }, [user, navigate]);

  // Refresh orders from the API
  const handleRefreshOrders = () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    console.log('Profile - Refreshing orders for user:', user);
    
    const refreshOrdersFromAPI = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Profile - No auth token found');
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log('Profile - Refreshing orders from API for user ID:', user._id);
        const response = await axios.get(
          `${apiConfig.baseURL}/orders/my-orders`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          const fetchedOrders = response.data.data || [];
          console.log(`Profile - Successfully refreshed ${fetchedOrders.length} orders from API`);
          
          // Update store for future use
          fetchedOrders.forEach(order => orderStore.addOrder(order));
          
          // Set orders in component state
          setOrders(fetchedOrders);
        } else {
          console.error('Profile - API refresh returned error:', response.data.error);
          setError(response.data.error || 'Failed to refresh orders');
        }
      } catch (error) {
        console.error('Profile - Error refreshing orders from API:', error);
        console.error('Profile - Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          userId: user._id,
          userEmail: user.email
        });
        
        setError('Failed to refresh your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    refreshOrdersFromAPI();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('Profile - Updating user details:', formData);
      const { data } = await axios.put(
        `${apiConfig.baseURL}/auth/updatedetails`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Profile - Update response:', data);
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Profile - Error updating user details:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/sinosply-stores');
  };

  // View order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setViewingOrderDetails(true);
  };

  // Go back to orders list
  const handleBackToOrders = () => {
    setViewingOrderDetails(false);
    setSelectedOrder(null);
  };

  // View tracking information
  const handleViewTracking = (order) => {
    setSelectedOrder(order);
    setViewingOrderDetails(false);
    setViewingTrackingInfo(true);
  };

  // Go back from tracking to order details
  const handleBackToDetails = () => {
    setViewingTrackingInfo(false);
    setViewingOrderDetails(true);
  };

  const renderProfileTab = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaEdit />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={true}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows="3"
            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {isEditing && (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  );

  const renderOrdersTab = () => {
    // If viewing tracking info, render the tracking view
    if (viewingTrackingInfo && selectedOrder) {
      return renderTrackingView();
    }
    
    // If viewing order details, render the details view
    if (viewingOrderDetails && selectedOrder) {
      return renderOrderDetails();
    }

    // Safely format price
    const safelyFormatPrice = (price, defaultValue = '0.00') => {
      if (price === undefined || price === null) return defaultValue;
      return typeof price === 'number' ? price.toFixed(2) : defaultValue;
    };

    // Otherwise, render the orders list
    return (
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="border-b pb-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Order History</h2>
          <div>
            <button
              onClick={handleRefreshOrders}
              className="px-4 py-2 text-sm text-white bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Refresh Orders
            </button>
          </div>
        </div>
        
        {/* Show total order count */}
        <div className="text-sm text-gray-500 mb-2">
          {orders.length > 0 ? `Displaying ${orders.length} orders` : 'No orders found'}
        </div>
        
        {/* Show error message if there's an error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        )}
        
        {/* No orders state */}
        {!loading && !error && orders.length === 0 ? (
          <div className="text-center py-8">
            <FaShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
            <Link 
              to="/sinosply-stores" 
              className="inline-block bg-black text-white py-2 px-6 rounded-md hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders list */
          !loading && !error && (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div
                  key={order._id || order.orderNumber || index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Order header - minimal version */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Order #{order.orderNumber || 'N/A'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date unavailable'}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'Processing'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Order summary - minimal */}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Items:</span> {order.items?.length || 0}
                      </p>
                      <p className="text-sm text-gray-700 truncate max-w-[200px]">
                        <span className="font-medium">Tracking:</span> {order.trackingNumber || 'Not available'}
                              </p>
                            </div>
                            <div className="text-right">
                      <p className="font-bold text-lg">
                        ₵{safelyFormatPrice(order.totalAmount)}
                      </p>
                      <button 
                        onClick={() => handleViewOrderDetails(order)}
                        className="mt-1 text-xs font-medium px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  // Simplified order details view
  const renderOrderDetails = () => {
    if (!selectedOrder) return null;
    
    const order = selectedOrder;
    
    // Safely format price
    const safelyFormatPrice = (price, defaultValue = '0.00') => {
      if (price === undefined || price === null) return defaultValue;
      return typeof price === 'number' ? price.toFixed(2) : defaultValue;
    };
    
    return (
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        {/* Header with back button */}
        <div className="border-b pb-4 flex items-center">
          <button 
            onClick={handleBackToOrders}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
        </div>
        
        {/* Order status and number */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">
                Order #{order.orderNumber}
              </h3>
              <p className="text-sm text-gray-500">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}
              </p>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status || 'Processing'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Order items - minimal */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-gray-900">Order Items</h3>
          </div>
          <div className="divide-y">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="flex p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 mr-3">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                        className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                      }}
                    />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center">
                      <FaShoppingBag className="text-gray-400" />
                    </div>
                  )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-black mb-1 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × ₵{safelyFormatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ₵{safelyFormatPrice((item.price || 0) * (item.quantity || 1))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-3 text-gray-500 text-sm italic">Item details not available</p>
            )}
          </div>
        </div>
        
        {/* Shipping Info - Simple */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-gray-900">Shipping Information</h3>
          </div>
          <div className="p-3">
            <p className="text-sm mb-1">
              <span className="font-medium">Tracking Number:</span> {order.trackingNumber || 'Not available'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Status:</span> {order.status || 'Processing'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Shipping Address:</span> {
                order.shippingAddress ? (
                  `${order.shippingAddress.name || ''}, ${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zip || ''}`
                ) : 'Address not available'
              }
            </p>
              </div>
            </div>
            
            {/* Order summary */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-gray-900">Order Summary</h3>
              </div>
          <div className="p-3">
            <div className="flex justify-between py-1">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-sm font-medium">₵{safelyFormatPrice(order.subtotal)}</p>
              </div>
            <div className="flex justify-between py-1">
              <p className="text-sm text-gray-600">Shipping</p>
              <p className="text-sm font-medium">₵{safelyFormatPrice(order.shipping)}</p>
              </div>
            <div className="flex justify-between py-1">
              <p className="text-sm text-gray-600">Tax</p>
              <p className="text-sm font-medium">₵{safelyFormatPrice(order.tax)}</p>
            </div>
            <div className="flex justify-between py-1 border-t mt-2 pt-2">
                <p className="font-bold">Total</p>
              <p className="font-bold text-lg">₵{safelyFormatPrice(order.totalAmount)}</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between pt-2">
          <button
            onClick={handleBackToOrders}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Back to Orders
          </button>
          <button
            onClick={() => handleViewTracking(selectedOrder)}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Track Package
          </button>
        </div>
      </div>
    );
  };

  // Simplified tracking view
  const renderTrackingView = () => {
    if (!selectedOrder) return null;
    
    const order = selectedOrder;
    
    // Safely format price and dates
    const safelyFormatPrice = (price, defaultValue = '0.00') => {
      if (price === undefined || price === null) return defaultValue;
      return typeof price === 'number' ? price.toFixed(2) : defaultValue;
    };
    
    const safelyFormatDate = (dateString) => {
      try {
        return dateString ? new Date(dateString).toLocaleString() : 'Not available';
      } catch (e) {
        return 'Not available';
      }
    };
    
    // Calculate simple progress percentage based on status
    let progressPercentage = 0;
    switch (order.status) {
      case 'Delivered':
      progressPercentage = 100;
        break;
      case 'Shipped':
      progressPercentage = 60;
        break;
      case 'Processing':
        progressPercentage = 30;
        break;
      default:
        progressPercentage = 10;
    }
    
    // Estimate delivery date (5 days from order date)
    const orderDate = new Date(order.createdAt || Date.now());
    const estimatedDeliveryDate = order.estimatedDelivery ? 
      new Date(order.estimatedDelivery) : 
      new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    return (
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        {/* Header with back button */}
        <div className="border-b pb-4 flex items-center">
          <button 
            onClick={handleBackToDetails}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Package Tracking</h2>
        </div>
        
        {/* Tracking info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">
                Tracking #{order.trackingNumber || 'N/A'}
              </h3>
              <p className="text-sm text-gray-500">
                Order #{order.orderNumber || 'N/A'}
              </p>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
                order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'Shipped' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status || 'Processing'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Current Status and Progress */}
        <div className="border rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <div>
              <h4 className="font-medium text-sm">Estimated Delivery</h4>
              <p className="text-gray-600 text-sm">
                {estimatedDeliveryDate.toLocaleDateString()}
              </p>
              </div>
              <div className="text-right">
              <h4 className="font-medium text-sm">Current Status</h4>
              <p className="text-gray-600 text-sm">{order.status || 'Processing'}</p>
              </div>
            </div>
            
            {/* Progress bar */}
          <div className="mt-4 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Order Placed</span>
                <span>Processing</span>
                <span>Shipped</span>
                <span>Delivered</span>
            </div>
          </div>
        </div>
        
        {/* Shipping Address */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-gray-900">Shipping Details</h3>
          </div>
          <div className="p-3">
            <p className="text-sm mb-1">
              <span className="font-medium">Recipient:</span> {
                order.shippingAddress?.name || 
                order.customerName || 
                'Customer'
              }
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Address:</span> {
                order.shippingAddress ? (
                  `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zip || ''}`
                ) : 'Address not available'
              }
            </p>
            <p className="text-sm">
              <span className="font-medium">Contact:</span> {
                order.shippingAddress?.phone || 
                order.customerEmail || 
                'Not available'
              }
            </p>
          </div>
        </div>
        
        {/* Simplified Tracking Timeline */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-gray-900">Tracking History</h3>
          </div>
          <div className="p-3">
            <div className="space-y-3">
              {/* Order Placed */}
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Order Placed</h4>
                  <p className="text-xs text-gray-500">
                    {safelyFormatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Processing */}
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <div className={`w-3 h-3 rounded-full ${
                    ['Processing', 'Shipped', 'Delivered'].includes(order.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Processing</h4>
                  <p className="text-xs text-gray-500">
                    {['Processing', 'Shipped', 'Delivered'].includes(order.status)
                      ? `${safelyFormatDate(new Date(new Date(order.createdAt).getTime() + 8*60*60*1000))} - Order processing started`
                      : 'Pending'}
                  </p>
                </div>
              </div>
              
              {/* Shipped */}
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <div className={`w-3 h-3 rounded-full ${
                    ['Shipped', 'Delivered'].includes(order.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Shipped</h4>
                  <p className="text-xs text-gray-500">
                    {['Shipped', 'Delivered'].includes(order.status)
                      ? `${safelyFormatDate(new Date(new Date(order.createdAt).getTime() + 24*60*60*1000))} - Package has been shipped`
                      : 'Pending'}
                  </p>
                </div>
              </div>
              
              {/* Delivered */}
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Delivered</h4>
                  <p className="text-xs text-gray-500">
                    {order.status === 'Delivered'
                      ? `${safelyFormatDate(estimatedDeliveryDate)} - Package delivered`
                      : 'Pending - Estimated: ' + estimatedDeliveryDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between pt-2">
          <button
            onClick={handleBackToDetails}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Back to Order Details
          </button>
        </div>
      </div>
    );
  };

  // Rest of the component remains unchanged
  const renderWishlistTab = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold text-gray-900">My Wishlist</h2>
      </div>
      
      <div className="text-center py-8">
        <FaHeart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
        <Link 
          to="/sinosply-stores" 
          className="inline-block bg-black text-white py-2 px-6 rounded-md hover:bg-gray-800 transition-colors"
        >
          Discover Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your profile, orders, and wishlist</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'profile'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaUser className="flex-shrink-0" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'orders'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaHistory className="flex-shrink-0" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === 'wishlist'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaHeart className="flex-shrink-0" />
                  <span>Wishlist</span>
                </button>
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'wishlist' && renderWishlistTab()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;