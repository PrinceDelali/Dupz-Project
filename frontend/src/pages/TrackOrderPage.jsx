import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Share2,
  Phone,
  Printer,
  Search,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useOrderStore } from '../store/orderStore';
import apiConfig from '../config/apiConfig';

const TrackOrderPage = () => {
  const { trackingNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const orderStore = useOrderStore();
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(''); // 'not_found', 'invalid_format', 'server_error'
  const [currentStatus, setCurrentStatus] = useState('');
  const [packageHistory, setPackageHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [querySource, setQuerySource] = useState(''); // Track where order data came from
  
  // API URL - Update with environment variable
  const API_URL = apiConfig.baseURL;
  
  // Mock delivery statuses and their corresponding stages
  const deliveryStages = [
    { key: 'order_placed', label: 'Order Placed', icon: <CheckCircle size={22} /> },
    { key: 'processing', label: 'Processing', icon: <Package size={22} /> },
    { key: 'shipped', label: 'Shipped', icon: <Truck size={22} /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: <MapPin size={22} /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={22} /> }
  ];
  
  // Basic validation for tracking/order number format
  const validateTrackingNumber = (number) => {
    if (!number) return { valid: false, reason: 'empty' };
    if (number.length < 5) return { valid: false, reason: 'too_short' };
    if (number.length > 30) return { valid: false, reason: 'too_long' };
    
    // Most tracking numbers are alphanumeric with possible hyphen
    if (!/^[a-zA-Z0-9-]+$/.test(number)) {
      return { valid: false, reason: 'invalid_chars' };
    }
    
    return { valid: true };
  };
  
  useEffect(() => {
    // Clean the tracking number to handle any special characters or spaces
    const cleanedTrackingNumber = trackingNumber ? trackingNumber.trim() : '';
    
    console.log("Initial tracking lookup:", { 
      rawNumber: trackingNumber,
      cleanedNumber: cleanedTrackingNumber,
      fromState: !!location.state?.orderInfo, 
      fromStore: !!orderStore.orderInfo,
    });

    if (!cleanedTrackingNumber) {
      setError('No tracking number provided. Please enter a valid tracking number.');
      setErrorType('not_found');
      setLoading(false);
      return;
    }
    
    // Validate tracking number format
    const validationResult = validateTrackingNumber(cleanedTrackingNumber);
    if (!validationResult.valid) {
      let errorMessage = 'Invalid tracking number format.';
      switch (validationResult.reason) {
        case 'too_short':
          errorMessage = 'The tracking number is too short. Please check and try again.';
          break;
        case 'too_long':
          errorMessage = 'The tracking number is too long. Please check and try again.';
          break;
        case 'invalid_chars':
          errorMessage = 'The tracking number contains invalid characters. Tracking numbers typically contain only letters, numbers, and hyphens.';
          break;
        default:
          errorMessage = 'Invalid tracking number format. Please check and try again.';
      }
      setError(errorMessage);
      setErrorType('invalid_format');
      setLoading(false);
      return;
    }

    // Use orderInfo from location.state or Zustand store
    const infoFromState = location.state?.orderInfo;
    const infoFromStore = orderStore.orderInfo;
    let shouldFetchFromAPI = true;

    // If we have state data that matches the tracking number, use it immediately
    if (infoFromState && 
        (infoFromState.trackingNumber === cleanedTrackingNumber || 
         infoFromState.orderNumber === cleanedTrackingNumber)) {
      console.log("Using order info from navigation state:", infoFromState);
      setOrderInfo(infoFromState);
      mapStatusToDeliveryStage(infoFromState.status || 'processing');
      shouldFetchFromAPI = false;
      setQuerySource('navigation');
    }
    // Then check store data
    else if (infoFromStore && 
        (infoFromStore.trackingNumber === cleanedTrackingNumber || 
         infoFromStore.orderNumber === cleanedTrackingNumber)) {
      console.log("Using order info from store:", infoFromStore);
      
      // Get formatted shipping address using the store helper
      const formattedShippingAddress = orderStore.getFormattedShippingAddress() || {
        name: 'Customer',
        street: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
      };
      
      // Format the order from store
      const orderData = {
        ...infoFromStore,
        trackingNumber: infoFromStore.trackingNumber,
        // Use formatted shipping address from store
        shippingAddress: formattedShippingAddress,
        // Ensure we have items for display
        items: infoFromStore.items || []
      };
      
      setOrderInfo(orderData);
      mapStatusToDeliveryStage(orderData.status || 'processing');
      shouldFetchFromAPI = false;
      setQuerySource('store');
    }
    // Otherwise check all orders in the store that match
    else {
      const allOrders = orderStore.getOrders();
      if (allOrders && allOrders.length > 0) {
        const matchingOrder = allOrders.find(order => 
          order.trackingNumber === cleanedTrackingNumber || 
          order.orderNumber === cleanedTrackingNumber
        );
        
        if (matchingOrder) {
          console.log("Found matching order in store orders collection:", matchingOrder);
          setOrderInfo({
            ...matchingOrder,
            orderDate: matchingOrder.formattedOrderDate || new Date(matchingOrder.createdAt || new Date()).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            estimatedDelivery: matchingOrder.estimatedDelivery
              ? new Date(matchingOrder.estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'Not available'
          });
          mapStatusToDeliveryStage(matchingOrder.status || 'processing');
          shouldFetchFromAPI = false;
          setQuerySource('orders collection');
        }
      }
    }
    
    // Always fetch from API if we couldn't find the data locally
    // or if we're arriving from an email link
    const isFromEmail = new URLSearchParams(window.location.search).get('source') === 'email';
    
    if (shouldFetchFromAPI || isFromEmail) {
      fetchOrderByTracking(cleanedTrackingNumber);
    } else {
      setLoading(false);
    }
  }, [trackingNumber, location.state, orderStore]);
  
  // Map backend status to our frontend delivery stages
  const mapStatusToDeliveryStage = (status) => {
    let mappedStage;
    
    switch(status?.toLowerCase()) {
      case 'pending':
      case 'order_placed':
        mappedStage = 'order_placed';
        break;
      case 'processing':
        mappedStage = 'processing';
        break;
      case 'shipped':
        mappedStage = 'shipped';
        break;
      case 'out_for_delivery':
        mappedStage = 'out_for_delivery';
        break;
      case 'delivered':
        mappedStage = 'delivered';
        break;
      default:
        mappedStage = 'processing';
    }
    
    console.log("Mapping status to stage:", { status, mappedStage });
    setCurrentStatus(mappedStage);
    
    // Generate mock package history based on the status
    const statusIndex = deliveryStages.findIndex(stage => stage.key === mappedStage);
    generatePackageHistory(statusIndex);
  };
  
  // Fetch order data from the API using tracking number
  const fetchOrderByTracking = async (tracking) => {
    if (!tracking) {
      console.error("No tracking number provided");
      setError('No tracking number provided. Please enter a valid tracking number.');
      setErrorType('not_found');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log(`🔍 [TrackOrderPage] Fetching order with tracking number: ${tracking}`);
    
    try {
      // Make API call to fetch order details
      const response = await axios.get(`${API_URL}/orders/track/${tracking}`);
      
      if (response.data.success && response.data.data) {
        const orderData = response.data.data;
        console.log("✅ [TrackOrderPage] Successfully retrieved order data from API:", orderData);
        
        // Format dates for display
        const formattedOrderData = {
          ...orderData,
          orderDate: orderData.formattedOrderDate || 
            new Date(orderData.createdAt || new Date()).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
          estimatedDelivery: orderData.estimatedDelivery
            ? new Date(orderData.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Not available'
        };
        
        setOrderInfo(formattedOrderData);
        mapStatusToDeliveryStage(orderData.status || 'processing');
        setQuerySource('api');
        setError(null);
        setErrorType('');
      } else {
        throw new Error(response.data.error || 'Failed to retrieve order data');
      }
    } catch (err) {
      console.error('❌ [TrackOrderPage] Error fetching order:', err);

      // Set appropriate error message
      const errorMessage = err.response?.data?.error || 
                        `We couldn't find any tracking information for ${tracking}. Please verify you entered the correct number.`;
      
      // Set error type based on response or validation
      if (err.response?.status === 404) {
        setErrorType('not_found');
      } else if (err.response?.status === 400) {
        setErrorType('invalid_format');
      } else {
        setErrorType('server_error');
      }
      
      setError(errorMessage);
      
      // Only use mock data in development IF specifically testing with valid test tracking numbers
      // Do not show mock data for genuinely invalid tracking numbers
      if (process.env.NODE_ENV === 'development' && tracking.startsWith('TEST-')) {
        console.log("ℹ️ [TrackOrderPage] Using mock data for test tracking number");
      const orderData = createMockOrderData(tracking);
      
        setOrderInfo({
          ...orderData,
          orderDate: orderData.formattedOrderDate || 
            new Date(orderData.createdAt || new Date()).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          estimatedDelivery: orderData.estimatedDelivery
            ? new Date(orderData.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Not available'
        });
        
        mapStatusToDeliveryStage(orderData.status || 'processing');
        setQuerySource('mock');
      setError(null);
        setErrorType('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to create mock order data for development
  const createMockOrderData = (trackingNumber) => {
    // Calculate dates
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - 2); // 2 days ago
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days from now
    
    // Generate mock tracking data
    return {
      id: `ORDER-${Math.floor(Math.random() * 1000000)}`,
      orderNumber: trackingNumber,
      trackingNumber: trackingNumber.startsWith('TRK') ? trackingNumber : `TRK${Math.floor(Math.random() * 10000000000)}`,
      status: 'processing',
      createdAt: orderDate.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
      shippingMethod: 'Standard Shipping',
      items: [
        {
          name: 'Fashion Dress',
          price: 99.99,
          quantity: 1,
          image: 'https://via.placeholder.com/150',
          size: 'M',
          color: 'Black',
        },
      ],
      shippingAddress: {
        name: 'Jane Doe',
        street: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        country: 'USA',
        phone: '+12345678900'
      }
    };
  };
  
  // Generate mock package history based on current status
  const generatePackageHistory = (currentStageIndex) => {
    const history = [];
    const now = new Date();
    
    // Add history entries for each stage up to the current one
    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = deliveryStages[i];
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() - (currentStageIndex - i));
      
      // Add random hours to make times different
      eventDate.setHours(9 + Math.floor(Math.random() * 8));
      eventDate.setMinutes(Math.floor(Math.random() * 60));
      
      let location, description;
      
      switch (stage.key) {
        case 'order_placed':
          location = 'Online';
          description = 'Your order has been received and is being prepared.';
          break;
        case 'processing':
          location = 'Warehouse, CA';
          description = 'Your order is being prepared for shipment.';
          break;
        case 'shipped':
          location = 'Distribution Center, NV';
          description = 'Your package has been shipped and is on its way.';
          break;
        case 'out_for_delivery':
          location = 'Local Carrier Facility';
          description = 'Your package is out for delivery today.';
          break;
        case 'delivered':
          location = 'Delivery Address';
          description = 'Your package has been delivered.';
          break;
        default:
          location = 'Unknown';
          description = 'Status update';
      }
      
      history.push({
        status: stage.key,
        label: stage.label,
        timestamp: eventDate,
        location,
        description
      });
    }
    
    // Sort history with newest events first
    history.sort((a, b) => b.timestamp - a.timestamp);
    setPackageHistory(history);
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Determine if a stage is completed, active, or upcoming
  const getStageStatus = (stageKey) => {
    const stageIndex = deliveryStages.findIndex(stage => stage.key === stageKey);
    const currentIndex = deliveryStages.findIndex(stage => stage.key === currentStatus);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'upcoming';
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle print tracking info
  const handlePrint = () => {
    window.print();
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/track-order/${searchTerm.trim()}`);
    }
  };
  
  // Error message based on error type
  const getErrorMessage = () => {
    switch (errorType) {
      case 'not_found':
        return (
          <div className="mb-4">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tracking Information Not Found</h1>
            <p className="text-gray-600 mb-2">{error || `We couldn't find any information for tracking number ${trackingNumber}.`}</p>
            <p className="text-sm text-gray-500">This may be because:</p>
            <ul className="text-sm text-gray-500 list-disc pl-5 mt-2">
              <li>The order number or tracking number was entered incorrectly</li>
              <li>The order was placed very recently and hasn't been processed yet</li>
              <li>The order was placed more than 90 days ago</li>
            </ul>
          </div>
        );
      case 'invalid_format':
        return (
          <div className="mb-4">
            <ShieldAlert size={40} className="mx-auto text-amber-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Tracking Format</h1>
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Order numbers typically start with "ORD-" followed by numbers. 
              Tracking numbers are typically alphanumeric and may contain hyphens.
            </p>
          </div>
        );
      case 'server_error':
        return (
          <div className="mb-4">
            <HelpCircle size={40} className="mx-auto text-blue-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Server Error</h1>
            <p className="text-gray-600 mb-2">We're having trouble connecting to our tracking system.</p>
            <p className="text-sm text-gray-500">Please try again later or contact customer support for assistance.</p>
          </div>
        );
      default:
        return (
          <div className="mb-4">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tracking Information Not Found</h1>
            <p className="text-gray-600 mb-6">{error || `We couldn't find any information for tracking number ${trackingNumber}.`}</p>
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
        <Footer />
      </>
    );
  }
  
  if (error || !orderInfo) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 min-h-[60vh]">
          <div className="text-center mb-8">
            {getErrorMessage()}
          </div>

          {/* Search form to try again with different tracking number */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-lg font-semibold mb-4">Try searching again with a different tracking number</h2>
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4"
                  placeholder="Enter tracking number or order number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Track
              </button>
            </form>
            <div className="mt-3 text-sm text-gray-500">
              <p>Example formats:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Order number: ORD-12345</li>
                <li>Tracking number: TRK123456789XY</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate('/track')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Go to Tracking Page
            </button>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 mb-16">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Order Details
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600">Order #{orderInfo.orderNumber || orderInfo.id}</p>
            </div>
            
            <div className="flex mt-4 sm:mt-0 space-x-2">
              <button 
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Print tracking information"
              >
                <Printer size={18} />
              </button>
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Share tracking information"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Order Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b">
            <div className="flex flex-col sm:flex-row text-sm gap-4 sm:gap-8">
              <div>
                <p className="text-gray-500">Tracking Number</p>
                <p className="font-medium">{orderInfo.trackingNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Carrier</p>
                <p className="font-medium">{orderInfo.shippingMethod || 'Standard Shipping'}</p>
              </div>
              <div>
                <p className="text-gray-500">Order Date</p>
                <p className="font-medium">{orderInfo.orderDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Estimated Delivery</p>
                <p className="font-medium">{orderInfo.estimatedDelivery}</p>
              </div>
            </div>
          </div>
          
          {/* Progress Tracker */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Status</h2>
            
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-blue-600"
                  style={{ 
                    width: `${(deliveryStages.findIndex(stage => stage.key === currentStatus) / (deliveryStages.length - 1)) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Status Points */}
              <div className="relative flex justify-between">
                {deliveryStages.map((stage, index) => {
                  const status = getStageStatus(stage.key);
                  return (
                    <div key={stage.key} className="flex flex-col items-center z-10">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                          ${status === 'completed' ? 'bg-blue-600 text-white' : 
                            status === 'active' ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
                            'bg-gray-100 text-gray-400'}`}
                      >
                        {stage.icon}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-medium 
                          ${status !== 'upcoming' ? 'text-gray-900' : 'text-gray-500'}`}
                        >
                          {stage.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Package History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-medium text-gray-900">Tracking History</h2>
          </div>
          
          <div className="divide-y">
            {packageHistory.map((event, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="w-10 flex-shrink-0 flex justify-center pt-1">
                    {event.status === currentStatus ? (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock size={14} />
                      </div>
                    ) : (
                      <div className="w-2 h-2 mt-2 rounded-full bg-gray-400"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{event.label}</h3>
                      <p className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</p>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Location: {event.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Shipping Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-medium text-gray-900">Shipping Information</h2>
          </div>
          
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
                <MapPin size={16} className="text-gray-500" />
                Delivery Address
              </h3>
              <div className="text-sm text-gray-600">
                {orderInfo?.shippingAddress ? (
                  <>
                    <p className="font-medium">{orderInfo.shippingAddress.name}</p>
                    <p>{orderInfo.shippingAddress.street}</p>
                    {orderInfo.shippingAddress.addressLine2 && (
                      <p>{orderInfo.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {orderInfo.shippingAddress.city}
                      {orderInfo.shippingAddress.state && `, ${orderInfo.shippingAddress.state}`} 
                      {orderInfo.shippingAddress.zip && ` ${orderInfo.shippingAddress.zip}`}
                    </p>
                    <p>{orderInfo.shippingAddress.country}</p>
                    {orderInfo.shippingAddress.phone && (
                      <p className="mt-2 text-gray-500">
                        <Phone size={14} className="inline mr-1" />
                        {orderInfo.shippingAddress.phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Address information not available</p>
                )}
              </div>
            </div>
            
            {/* Items */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
                <Package size={16} className="text-gray-500" />
                Package Items
              </h3>
              {orderInfo?.items && orderInfo.items.length > 0 ? (
                <ul className="text-sm text-gray-600 space-y-2">
                  {orderInfo.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-gray-500">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No items available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-medium text-gray-900">Need Help?</h2>
          </div>
          
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">If you have any questions about your shipment, please contact our customer service.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="tel:+1234567890" 
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Phone size={16} />
                Call Support
              </a>
              
              <button 
                onClick={() => navigate('/sinosply-contact')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors"
              >
                Contact Us
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TrackOrderPage; 