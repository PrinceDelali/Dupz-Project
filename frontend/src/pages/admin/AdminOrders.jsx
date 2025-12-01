import { useState, useEffect } from 'react';
import { FaSearch, FaSort, FaFilter, FaEye, FaPencilAlt, FaInfoCircle, FaTimes, FaBox, FaUser, FaMapMarkerAlt, FaCreditCard, FaTruck, FaSave, FaCheck, FaSync, FaFileInvoiceDollar, FaExternalLinkAlt, FaDownload, FaSearchPlus, FaSearchMinus, FaBell, FaTrash } from 'react-icons/fa';
import { useOrderStore } from '../../store/orderStore';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import axios from 'axios';
import apiConfig from '../../config/apiConfig';
import NotificationTester from '../../components/admin/NotificationTester';
import { useNotificationStore } from '../../store/notificationStore';
import SocketService from '../../services/SocketService';
import OrderNotificationTest from '../../components/admin/OrderNotificationTest';

// Skeleton loader for order rows
const OrderRowSkeleton = () => {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <div className="h-5 bg-gray-200 rounded-full w-5"></div>
          <div className="h-5 bg-gray-200 rounded-full w-5"></div>
        </div>
      </td>
    </tr>
  );
};

// Mobile skeleton for card view
const OrderCardSkeleton = () => {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded-full w-8"></div>
          <div className="h-8 bg-gray-200 rounded-full w-8"></div>
        </div>
      </div>
    </div>
  );
};



// Mobile Order Card component
const OrderCard = ({ order, onViewDetails, onEditOrder, onStatusChange, showStatusDropdown, toggleStatusDropdown, getUserForOrder, getCustomerEmail, formatDate, formatPrice, openReceiptViewer }) => {
  const getStatusClass = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex justify-between mb-2">
        <h4 className="font-medium text-sm">{order.orderNumber}</h4>
        <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-500">Customer:</p>
          <p className="font-medium truncate">{getUserForOrder(order) ? 
            `${getUserForOrder(order).firstName || ''} ${getUserForOrder(order).lastName || ''}`.trim() : 
            order.customerName || 'Unknown'}</p>
          <p className="text-gray-500 truncate">{getCustomerEmail(order)}</p>
        </div>
        <div>
          <p className="text-gray-500">Amount:</p>
          <p className="font-medium">{formatPrice(order.totalAmount)}</p>
          <p className="text-gray-500">{Array.isArray(order.items) ? order.items.length : 0} items</p>
        </div>
      </div>
      
      {/* Receipt indicator */}
      {order.paymentReceipt && (order.paymentReceipt.imageData || order.paymentReceipt.link) && (
        <div className="mb-3 flex items-center">
          <FaFileInvoiceDollar className="text-purple-500 mr-1" />
          <span className="text-xs text-purple-600">
            {order.paymentReceipt.imageData ? 'Receipt image available' : 'Receipt link available'}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="relative">
          <span 
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${getStatusClass(order.status)}`}
            onClick={() => toggleStatusDropdown(order._id)}
          >
            {order.status || 'Unknown'}
          </span>
          
          {/* Status dropdown */}
          {showStatusDropdown[order._id] && (
            <div className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <ul className="py-1">
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map(status => (
                  <li 
                    key={status}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
                      ${order.status === status ? 'bg-gray-50 font-medium' : ''}
                    `}
                    onClick={() => onStatusChange(order._id, status)}
                  >
                    {status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {order.paymentReceipt && order.paymentReceipt.imageData && (
            <button 
              className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100"
              onClick={() => openReceiptViewer(order.paymentReceipt.imageData)}
              aria-label="View receipt"
            >
              <FaFileInvoiceDollar className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"
            onClick={() => onViewDetails(order._id)}
            aria-label="View details"
          >
            <FaEye className="w-3.5 h-3.5" />
          </button>
          <button 
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
            onClick={() => onEditOrder(order._id)}
            aria-label="Edit order"
          >
            <FaPencilAlt className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [statusChangeOrder, setStatusChangeOrder] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [userDetailsCache, setUserDetailsCache] = useState({}); // Cache for user details by userId
  // New state for receipt viewer modal
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [currentReceiptImage, setCurrentReceiptImage] = useState('');
  const [imageZoomLevel, setImageZoomLevel] = useState(100);
  // Add new state for the notification tester
  const [showNotificationTester, setShowNotificationTester] = useState(false);
  // Add this new state and function
  const [isStorageQuotaError, setIsStorageQuotaError] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearingOrders, setClearingOrders] = useState(false);
  
  // Function to clear local storage cache
  const handleClearOrderStorage = () => {
    try {
      // First try to use the orderStore's cleanup function
      if (useOrderStore.getState().cleanupOrderStorage) {
        console.log('[AdminOrders] Using orderStore cleanup function');
        const cleanedOrders = useOrderStore.getState().cleanupOrderStorage();
        setSuccessMessage(`Order storage cleaned up successfully! Reduced to ${cleanedOrders.length} orders.`);
        setIsStorageQuotaError(false);
        setError(null);
        setFilteredOrders(cleanedOrders); // Update UI with cleaned orders
        
        // Refresh data display after a short delay
        setTimeout(() => {
          filterAndSortOrders();
        }, 500);
        
        return;
      }
      
      // Fallback: manually clear storage
      localStorage.removeItem('sinosply-order-storage');
      localStorage.removeItem('sinosply-orders');
      setSuccessMessage('Order storage cleared successfully! Refreshing...');
      setIsStorageQuotaError(false);
      setError(null);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error clearing storage:', err);
      setError(`Failed to clear storage: ${err.message}`);
    }
  };

  // Status options for the dropdown
  const ORDER_STATUSES = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded'
  ];

  // Get orders from the store
  const {
    orders,
    getOrders,
    initializeWithSampleOrder,
    clearOrders,
    addOrder,
    selectOrder,
    clearSelectedOrder,
    selectedOrder,
    updateOrder,
    updateOrderStatus,
    fetchOrders
  } = useOrderStore();

  // Add this line with the other hook calls
  const { addOrderStatusNotification } = useNotificationStore();
  
  // Initialize socket connection for real-time updates
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    if (userId) {
      // Initialize the socket connection
      console.log('🔄 [AdminOrders] Initializing real-time order updates');
      const socket = SocketService.initializeSocket(userId);
      
      // Add more debug logging
      if (socket) {
        console.log('🔌 [AdminOrders] Socket initialization requested, socket object:', socket.id);
        
        // Check socket connection status
        console.log('🔌 [AdminOrders] Socket connected status:', socket.connected);
        
        // Add more direct event listeners for debugging
        socket.on('connect', () => {
          console.log('🔌 [AdminOrders] Socket connected event fired! ID:', socket.id);
        });
        
        socket.on('disconnect', () => {
          console.log('🔌 [AdminOrders] Socket disconnected event fired!');
        });
        
        socket.on('connect_error', (error) => {
          console.error('🔌 [AdminOrders] Socket connection error:', error.message);
        });
      } else {
        console.error('🔌 [AdminOrders] Failed to initialize socket - returned null/undefined');
      }
      
      // Set up listeners for real-time order updates
      SocketService.listenForOrders(
        // New order callback
        (newOrder) => {
          console.log('📦 [AdminOrders] Received new order via socket:', newOrder?.orderNumber);
          setSuccessMessage(`New order ${newOrder.orderNumber || ''} received!`);
          
          // Update the order store directly
          try {
            const orderStore = useOrderStore.getState();
            if (orderStore && orderStore.addOrder) {
              orderStore.addOrder(newOrder);
              console.log('✅ [AdminOrders] Order added to store');
              
              // Update the filtered orders
              filterAndSortOrders();
            }
          } catch (storeError) {
            console.error('❌ [AdminOrders] Error updating order store:', storeError);
          }
        },
        // Order update callback
        (updatedOrder) => {
          console.log('📝 [AdminOrders] Received order update via socket:', updatedOrder?.orderNumber);
          
          // Update the order store directly
          try {
            const orderStore = useOrderStore.getState();
            if (orderStore && orderStore.updateOrder) {
              orderStore.updateOrder(updatedOrder._id, updatedOrder);
              console.log('✅ [AdminOrders] Order updated in store');
              
              // Update the filtered orders
              filterAndSortOrders();
            }
          } catch (storeError) {
            console.error('❌ [AdminOrders] Error updating order store:', storeError);
          }
        }
      );
      
      // Clean up socket connection on component unmount
      return () => {
        console.log('🔌 [AdminOrders] Disconnecting socket');
        SocketService.disconnectSocket();
      };
    } else {
      console.warn('🔌 [AdminOrders] No userId found in localStorage, cannot initialize socket');
    }
  }, []);  // Empty dependency array means this runs once on mount
  
  // Also listen for custom events from HTTP requests
  useEffect(() => {
    const handleOrderStatusUpdated = (event) => {
      if (event.detail && event.detail.order) {
        const { order } = event.detail;
        console.log('🔔 [AdminOrders] Received order-status-updated event:', order);
        setSuccessMessage(`Order ${order.orderNumber} status updated to ${order.status}!`);
        
        // Refresh order list
        filterAndSortOrders();
      }
    };
    
    window.addEventListener('order-status-updated', handleOrderStatusUpdated);
    
    return () => {
      window.removeEventListener('order-status-updated', handleOrderStatusUpdated);
    };
  }, []);

  // Check viewport width on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // First load - fetch all orders from the API
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        console.log('Loading all orders...');
        const result = await fetchOrders();
        
        // Don't initialize with sample data anymore, just show empty state if no orders
        if (!result.success) {
          console.log('Failed to load orders from API');
          // Removed error message since orders are loading correctly
        } else {
          console.log(`Loaded ${result.data ? result.data.length : 0} orders`);
          
          if (result.data && result.data.length > 0) {
            // Fetch user details for each order
            await fetchUserDetailsForOrders(result.data);
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        // Only set error in case of actual exception, not for expected states
      } finally {
        setIsLoading(false);
        
        // Apply initial filtering
        filterAndSortOrders();
      }
    };
    
    loadOrders();
  }, []);

  // Fetch user details for an array of orders
  const fetchUserDetailsForOrders = async (orders) => {
    try {
      const uniqueUserIds = [...new Set(orders
        .filter(order => order.user) // Only consider orders with user IDs
        .map(order => order.user))]; // Extract user IDs
      
      console.log(`Fetching user details for ${uniqueUserIds.length} unique users`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found for fetching user details');
        return;
      }
      
      // Create a temporary cache for this batch
      const userCache = { ...userDetailsCache };
      
      // Fetch user details for each unique user ID
      for (const userId of uniqueUserIds) {
        if (!userCache[userId]) {
          try {
            const response = await axios.get(`${apiConfig.baseURL}/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success && response.data.data) {
              userCache[userId] = response.data.data;
              console.log(`Fetched user details for ${userId}`);
            }
          } catch (err) {
            console.error(`Failed to fetch user details for ${userId}:`, err);
          }
        }
      }
      
      // Update the cache with all fetched user details
      setUserDetailsCache(userCache);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  
  // Get user details for a specific order
  const getUserForOrder = (order) => {
    if (!order) return null;
    
    const userId = order.user;
    if (!userId) return null;
    
    return userDetailsCache[userId] || null;
  };

  // Handle filter changes
  useEffect(() => {
    filterAndSortOrders();
  }, [orders, statusFilter, searchTerm, sortField, sortDirection]);

  // Filter and sort orders based on current criteria
  const filterAndSortOrders = () => {
    setIsLoading(true);
    
    try {
      // Start with all orders
      let result = [...orders];
      
      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        result = result.filter(order => 
          order.status && order.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(order => 
          (order.orderNumber && order.orderNumber.toLowerCase().includes(term)) ||
          (order.customerName && order.customerName.toLowerCase().includes(term)) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(term)) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(term))
        );
    }
      
      // Apply sorting
      result.sort((a, b) => {
        if (sortField === 'createdAt') {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortField === 'totalAmount') {
          const amountA = parseFloat(a.totalAmount || 0);
          const amountB = parseFloat(b.totalAmount || 0);
          return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
        } else if (sortField === 'status') {
          return sortDirection === 'asc'
            ? (a.status || '').localeCompare(b.status || '')
            : (b.status || '').localeCompare(a.status || '');
        } else if (sortField === 'customerName') {
          return sortDirection === 'asc'
            ? (a.customerName || '').localeCompare(b.customerName || '')
            : (b.customerName || '').localeCompare(a.customerName || '');
        }
        return 0;
      });
      
      setFilteredOrders(result);
    } catch (err) {
      setError('Error filtering orders: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format price for display
  const formatPrice = (price) => {
    try {
    return `GH₵${parseFloat(price).toFixed(2)}`;
    } catch (e) {
      return 'GH₵0.00';
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle refresh - update to also refresh user details
  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    
    // Set a timeout to simulate network request for better UX
    setTimeout(async () => {
      try {
        // If we have orders, fetch fresh user details
        if (orders.length > 0) {
          await fetchUserDetailsForOrders(orders);
        }
        
        filterAndSortOrders();
        setSuccessMessage('Order list refreshed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(`Error refreshing orders: ${err.message}`);
      } finally {
        setIsRefreshing(false);
      }
    }, 1000);
  };

  // Handle view order details
  const handleViewOrderDetails = (orderId) => {
    selectOrder(orderId);
    setIsEditMode(false);
    setShowOrderModal(true);
  };

  // Handle edit order
  const handleEditOrder = (orderId) => {
    selectOrder(orderId);
    const order = orders.find(o => o._id === orderId);
    setEditedOrder({...order});
    setIsEditMode(true);
    setShowOrderModal(true);
  };

  // Handle changes to the edited order
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedOrder(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedOrder(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Save edited order
  const handleSaveOrder = () => {
    setIsLoading(true);
    try {
      const updated = updateOrder(editedOrder._id, editedOrder);
      if (updated) {
        setSuccessMessage('Order updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsEditMode(false);
    }
    } catch (err) {
      setError(`Error updating order: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (orderId) => {
    setShowStatusDropdown(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    setIsLoading(true);
    console.log(`[AdminOrders] Changing order ${orderId} status to ${newStatus}`);
    
    try {
      // Find the order to get previous status and customer info
      const orderToUpdate = orders.find(o => o._id === orderId);
      if (!orderToUpdate) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      
      const previousStatus = orderToUpdate.status;
      const customerEmail = orderToUpdate.customerEmail;
      const orderNumber = orderToUpdate.orderNumber;
      
      console.log(`[AdminOrders] Order ${orderNumber}: ${previousStatus} -> ${newStatus}`);
      
      // First - update status in the database/store to ensure it's saved
      try {
        // Use the enhanced updateOrderStatus which syncs with server
        const updatedOrder = updateOrderStatus(orderId, newStatus);
      
        if (updatedOrder) {
          console.log(`[AdminOrders] Successfully updated order status in database:`, updatedOrder);
          
          // Show initial success message (will update with email status later)
          setSuccessMessage(`Order #${orderNumber} status updated to ${newStatus}!`);
        
          // Log the update
          console.log(`[AdminOrders] Updated order ${orderNumber} status to ${newStatus}`);
        
          // Emit the status change via Socket.io
          try {
            console.log('[AdminOrders] Emitting socket notification for status update');
            SocketService.emitOrderStatusChange(updatedOrder, previousStatus);
          } catch (socketError) {
            console.error('[AdminOrders] Error emitting socket notification:', socketError);
            // Continue anyway, this is not critical
          }
          
          // Trigger in-app notification
          try {
            console.log('[AdminOrders] Triggering in-app notification for status update');
            addOrderStatusNotification(updatedOrder);
            
            // Also dispatch an event for the notification service
            if (window.dispatchEvent && CustomEvent) {
              const event = new CustomEvent('order-status-updated', { 
                detail: { order: updatedOrder } 
              });
              window.dispatchEvent(event);
            }
          } catch (notificationError) {
            console.error('[AdminOrders] Failed to trigger in-app notification:', notificationError);
            // Continue anyway, this is not critical
          }
        
          // Send email notification to customer if email is available
          if (customerEmail) {
            try {
              console.log(`[AdminOrders] Sending status update email to customer: ${customerEmail}`);
              
              // The sendStatusUpdateEmail now returns a result object
              const emailResult = await sendStatusUpdateEmail(updatedOrder, previousStatus, customerEmail);
              
              if (emailResult.success) {
                console.log(`[AdminOrders] Email sent successfully to ${customerEmail}`);
                // Update success message to include email confirmation
                setSuccessMessage(`Order #${orderNumber} status updated to ${newStatus} and email notification sent!`);
              } else {
                console.error(`[AdminOrders] Email failed: ${emailResult.error}`);
                // Still show success for the status update but mention email failure
                setSuccessMessage(`Order #${orderNumber} status updated to ${newStatus}, but email notification failed.`);
              }
              
              // Clear message after 5 seconds
              setTimeout(() => setSuccessMessage(''), 5000);
            } catch (emailError) {
              console.error('[AdminOrders] Error sending email:', emailError);
              // Still show success for the status update but mention email failure
              setSuccessMessage(`Order #${orderNumber} status updated to ${newStatus}, but email notification failed.`);
              setTimeout(() => setSuccessMessage(''), 5000);
            }
          } else {
            console.log('[AdminOrders] No customer email available, skipping email notification');
            // Clear default success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        } else {
          console.error(`[AdminOrders] Failed to update order ${orderNumber} status to ${newStatus}`);
          setError(`Failed to update order #${orderNumber} status.`);
        }
      } catch (storageError) {
        console.error('[AdminOrders] Storage error:', storageError);
        
        // Handle localStorage quota exceeded error specifically
        if (storageError.message && storageError.message.includes('quota')) {
          setIsStorageQuotaError(true);
          setError(`Storage quota exceeded. Please clear some data to continue updating orders.`);
          
          // Try to handle this without disrupting the UI by using in-memory updates only
          const ordersCopy = [...orders];
          const orderIndex = ordersCopy.findIndex(o => o._id === orderId);
          
          if (orderIndex !== -1) {
            // Update in-memory only to preserve UI state
            ordersCopy[orderIndex] = {
              ...ordersCopy[orderIndex],
              status: newStatus,
              updatedAt: new Date().toISOString()
            };
            
            // Update filtered orders state directly
            const filteredCopy = [...filteredOrders];
            const filteredIndex = filteredCopy.findIndex(o => o._id === orderId);
            if (filteredIndex !== -1) {
              filteredCopy[filteredIndex] = {
                ...filteredCopy[filteredIndex],
                status: newStatus,
                updatedAt: new Date().toISOString()
              };
              setFilteredOrders(filteredCopy);
            }
            
            // Show success message but warn about persistence
            setSuccessMessage(`Order status updated to ${newStatus} in the UI only. Please clear storage to save permanently.`);
            setTimeout(() => setSuccessMessage(''), 5000);
            
            // Also try to sync the change to the server directly
            const syncToServer = async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  console.warn('[AdminOrders] No auth token found for direct server sync');
                  return;
                }
                
                console.log(`[AdminOrders] Directly syncing order status to server as fallback: ${orderId} -> ${newStatus}`);
                
                // Fix the URL to prevent double API path
                const baseUrlWithoutTrailingSlash = apiConfig.baseURL.replace(/\/$/, '');
                const orderStatusEndpoint = `${baseUrlWithoutTrailingSlash}/orders/${orderId}/status`;
                
                console.log(`[AdminOrders] Using endpoint: ${orderStatusEndpoint}`);
                
                await axios.put(
                  orderStatusEndpoint,
                  { status: newStatus },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log(`[AdminOrders] Direct server sync successful`);
                
                // Try to emit socket notification even in this error case
                try {
                  const updatedOrder = {
                    ...ordersCopy[orderIndex],
                    status: newStatus
                  };
                  SocketService.emitOrderStatusChange(updatedOrder, previousStatus);
                } catch (socketError) {
                  console.error('[AdminOrders] Error emitting socket notification during recovery:', socketError);
                }
                
                // Also try to send email notification in this case
                if (customerEmail) {
                  // Get the updated order for email
                  const orderForEmail = {
                    ...ordersCopy[orderIndex],
                    status: newStatus
                  };
                  await sendStatusUpdateEmail(orderForEmail, previousStatus, customerEmail);
                }
              } catch (syncError) {
                console.error('[AdminOrders] Direct server sync failed:', syncError);
              }
            };
            
            // Try to sync in background
            syncToServer();
          }
        } else {
          throw storageError; // Re-throw if it's a different type of error
        }
      }
      
      // Close dropdown
      setShowStatusDropdown(prev => ({
        ...prev,
        [orderId]: false
      }));
    } catch (err) {
      console.error('[AdminOrders] Error updating status:', err);
      
      // Check if it's a quota error
      if (err.message && err.message.includes('quota')) {
        setIsStorageQuotaError(true);
        setError(`Storage quota exceeded. You need to clear some data to continue. Click the "Clear Order Storage" button below.`);
      } else {
        setError(`Error updating status: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send status update email to customer
  const sendStatusUpdateEmail = async (order, previousStatus, email) => {
    try {
      // Validate required data
      if (!order || !order.orderNumber) {
        console.error('[AdminOrders] Invalid order data, cannot send status update email');
        return { success: false, error: 'Invalid order data' };
      }
      
      if (!email) {
        console.error('[AdminOrders] No email address provided, cannot send status update email');
        return { success: false, error: 'Customer email missing' };
      }
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[AdminOrders] No token found, cannot send status update email');
        return { success: false, error: 'Authentication token missing' };
      }
      
      console.log('[AdminOrders] Preparing to send status update email to customer:', {
        email,
        orderNumber: order.orderNumber,
        previousStatus: previousStatus || 'Unknown',
        newStatus: order.status
      });
      
      // Clean up order data to avoid sending unnecessary large objects
      const orderDataForEmail = {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: email,
        status: order.status,
        items: Array.isArray(order.items) ? order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) : [],
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber || null,
        shippingMethod: order.shippingMethod || 'Standard',
        estimatedDelivery: order.estimatedDelivery || null,
        createdAt: order.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      // Retry mechanism for network issues
      let retries = 2;
      let response = null;
      
      while (retries >= 0) {
        try {
          console.log(`[AdminOrders] Sending status update email to ${email} (attempt ${2-retries+1})...`);
      
      // Make API call to send status update email
          response = await axios.post(
        `${apiConfig.baseURL}/email/order-status-update`,
        {
          email,
              orderDetails: orderDataForEmail,
          previousStatus
        },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000 // 10 second timeout
            }
      );
      
          // If successful, break out of retry loop
          break;
        } catch (requestError) {
          retries--;
          
          // If we have retries left, wait before trying again
          if (retries >= 0) {
            console.warn(`[AdminOrders] Email request failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      } else {
            // No retries left, throw to outer catch
            throw requestError;
          }
        }
      }
      
      if (response?.data?.success) {
        console.log('[AdminOrders] ✅ Status update email sent successfully', {
          orderNumber: order.orderNumber,
          status: order.status,
          recipient: email,
          messageId: response.data.messageId
        });
        return { success: true, messageId: response.data.messageId };
      } else {
        console.error('[AdminOrders] ❌ Failed to send status update email:', response?.data?.error || 'Unknown error');
        return { success: false, error: response?.data?.error || 'Failed to send email' };
      }
    } catch (error) {
      console.error('[AdminOrders] ❌ Error sending status update email:', error.message);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  // Close modal and clear selected order
  const closeOrderModal = () => {
    setShowOrderModal(false);
    clearSelectedOrder();
    setIsEditMode(false);
    setEditedOrder(null);
  };

  // Get pagination indices
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Calculate order statistics
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

    // Orders in the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || 0);
      return orderDate >= sevenDaysAgo;
    });
    
    const recentRevenue = recentOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount || 0), 0);
    
    return {
      totalOrders,
      totalRevenue,
      recentOrders: recentOrders.length,
      recentRevenue
    };
  };
  
  const stats = getOrderStats();

  // Format customer name for display
  const formatCustomerName = (order) => {
    // Try to get user details from cache
    const userDetails = getUserForOrder(order);
    
    if (userDetails) {
      // Use real user account info if available
      return `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'Unknown';
    } else {
      // Fall back to order's customer name
      return order.customerName || 'Unknown';
    }
  };
  
  // Get customer email from user details or order
  const getCustomerEmail = (order) => {
    const userDetails = getUserForOrder(order);
    
    if (userDetails) {
      return userDetails.email;
    } else {
      return order.customerEmail || 'No email';
    }
  };

  // Open receipt viewer modal
  const openReceiptViewer = (imageData) => {
    setCurrentReceiptImage(imageData);
    setReceiptViewerOpen(true);
    // Reset zoom level when opening a new image
    setImageZoomLevel(100);
  };

  // Close receipt viewer modal
  const closeReceiptViewer = () => {
    setReceiptViewerOpen(false);
    setCurrentReceiptImage('');
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setImageZoomLevel(prev => Math.min(prev + 25, 200)); // Max 200%
  };

  const handleZoomOut = () => {
    setImageZoomLevel(prev => Math.max(prev - 25, 50)); // Min 50%
  };

  // Download receipt image
  const downloadReceiptImage = () => {
    if (!currentReceiptImage) return;
    
    try {
      // Create anchor element and trigger download
      const link = document.createElement('a');
      link.href = currentReceiptImage;
      link.download = `receipt-${selectedOrder?.orderNumber || 'image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading image:', err);
      alert('Failed to download image');
    }
  };

  // Handle receipt image display - optimize for large images
  const handleReceiptImage = (paymentReceipt) => {
    if (!paymentReceipt) return null;
    
    if (paymentReceipt.type === 'image' && paymentReceipt.imageData) {
      // Check if the image data is very large (might cause browser slowdowns)
      const imageDataSize = paymentReceipt.imageData.length;
      const sizeInMB = (imageDataSize / 1024 / 1024).toFixed(2);
      
      if (imageDataSize > 1 * 1024 * 1024) { // 1MB warning threshold
        return (
          <div className="mt-2">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">Receipt Image ({sizeInMB}MB):</p>
            <div className="border border-gray-200 rounded-md p-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2 text-xs text-yellow-800">
                This is a large image ({sizeInMB}MB). Click the button below to view.
              </div>
              <button
                onClick={() => openReceiptViewer(paymentReceipt.imageData)}
                className="bg-blue-500 text-white text-xs rounded-md py-1 px-2 hover:bg-blue-600"
              >
                View Full Receipt
              </button>
            </div>
          </div>
        );
      } else {
        // Regular size image, show directly with option to view larger
        return (
          <div className="mt-2">
            <p className="text-xs sm:text-gray-500 mb-1">Receipt Image:</p>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="relative group">
                <img 
                  src={paymentReceipt.imageData} 
                  alt="Payment Receipt" 
                  className="max-w-full h-auto max-h-48 object-contain cursor-pointer"
                  onClick={() => openReceiptViewer(paymentReceipt.imageData)}
                  onError={(e) => {e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Invalid+Image";}}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="bg-white bg-opacity-75 p-2 rounded-full"
                    onClick={() => openReceiptViewer(paymentReceipt.imageData)}
                  >
                    <FaSearchPlus className="text-gray-800" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    } else if (paymentReceipt.type === 'reference' && paymentReceipt.note) {
      // Show reference note
      return (
        <div className="mt-2">
          <p className="text-xs sm:text-gray-500 mb-1">Receipt Note:</p>
          <div className="border border-gray-200 rounded-md p-2 bg-gray-50 text-xs">
            {paymentReceipt.note}
          </div>
        </div>
      );
    } else if (paymentReceipt.type === 'link' && paymentReceipt.link) {
      // Show link
      return (
        <div className="mt-2">
          <p className="text-xs sm:text-gray-500 mb-1">Receipt Link:</p>
          <a 
            href={paymentReceipt.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
          >
            <span className="truncate max-w-xs">{paymentReceipt.link}</span>
            <FaExternalLinkAlt className="ml-1 h-3 w-3" />
          </a>
        </div>
      );
    }
    
    return (
      <p className="text-xs sm:text-sm text-gray-500">No receipt details available</p>
    );
  };

  // Toggle notification tester
  const toggleNotificationTester = () => {
    setShowNotificationTester(prev => !prev);
  };

  // Test notification system on component mount
  useEffect(() => {
    console.log('[AdminOrders] Testing notification system');
    
    // 1. Check if notification store is available
    if (addOrderStatusNotification) {
      console.log('[AdminOrders] Notification store is available');
      
      // Wait 2 seconds before sending test notification
      const timer = setTimeout(() => {
        try {
          const testOrder = {
            _id: `test-${Date.now()}`,
            orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'Processing',
            items: [{ name: 'Test Product' }],
            totalAmount: 99.99
          };
          
          console.log('[AdminOrders] Sending test notification for order:', testOrder);
          addOrderStatusNotification(testOrder);
          console.log('[AdminOrders] Test notification sent');
        } catch (err) {
          console.error('[AdminOrders] Error sending test notification:', err);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      console.error('[AdminOrders] Notification store is not available');
    }
  }, [addOrderStatusNotification]);

  // Create a custom button to manually trigger a test notification
  const triggerTestNotification = () => {
    try {
      console.log('[AdminOrders] Manually triggering test notification');
      const testOrder = {
        _id: `manual-test-${Date.now()}`,
        orderNumber: `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Shipped',
        items: [{ name: 'Manual Test Product' }],
        totalAmount: 149.99
      };
      
      // Create notification
      const notification = addOrderStatusNotification(testOrder);
      console.log('[AdminOrders] Manual test notification created:', notification);
      
      // Also try the global test function if available
      try {
        if (useNotificationStore.getState().addTestNotification) {
          console.log('[AdminOrders] Calling addTestNotification directly');
          useNotificationStore.getState().addTestNotification();
        }
      } catch (e) {
        console.error('[AdminOrders] Error calling addTestNotification:', e);
      }
      
      // Also try to dispatch a custom event
      try {
        const event = new CustomEvent('order-status-updated', {
          detail: { order: testOrder }
        });
        window.dispatchEvent(event);
        console.log('[AdminOrders] Dispatched custom event');
      } catch (e) {
        console.error('[AdminOrders] Error dispatching event:', e);
      }
      
      alert('Test notification triggered. Check the notification bell and console.');
    } catch (err) {
      console.error('[AdminOrders] Failed to trigger test notification:', err);
      alert('Failed to trigger notification. See console for details.');
    }
  };

  // Function to handle clear all orders
  const handleClearAllOrders = async () => {
    if (window.confirm("WARNING! This will permanently delete ALL orders from the database. This action cannot be undone. Are you sure you want to proceed?")) {
      setClearingOrders(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication error: No token found');
          setClearingOrders(false);
          return;
        }

        // Call the API endpoint
        const response = await axios.delete(
          `${apiConfig.baseURL}/admin/orders/clear-all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          // Clear orders from store
          clearOrders();
          
          // Double check localStorage is cleared too
          localStorage.removeItem('sinosply-order-storage');
          
          // Reset filtered orders
          setFilteredOrders([]);
          
          // Show success message
          setSuccessMessage(`Successfully cleared ${response.data.deletedCount} orders from the database`);
          
          // Reset page to 1
          setCurrentPage(1);
        } else {
          setError(`Failed to clear orders: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Error clearing orders:', error);
        setError(`Error clearing orders: ${error.response?.data?.error || error.message}`);
      } finally {
        setClearingOrders(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="hidden md:block md:fixed md:w-64 md:h-full">
        <Sidebar />
      </div>
      
      <div className="w-full md:ml-64 max-w-full">
        {isLoading && <LoadingOverlay />}
        
        <div className="p-3 sm:p-6 overflow-x-auto">
          <div className="mb-4 sm:mb-8">
                      <div className="flex justify-between items-center flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Orders Management</h1>
            
            {/* Tools buttons - only visible on mobile */}
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 md:hidden">
              <button 
                onClick={toggleNotificationTester}
                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors"
              >
                <FaInfoCircle className="inline mr-1" />
                <span>{showNotificationTester ? 'Hide' : 'Show'} Tester</span>
              </button>
              
              <button 
                onClick={triggerTestNotification}
                className="text-xs px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md transition-colors"
              >
                <FaBell className="inline mr-1" />
                <span>Test Notify</span>
              </button>

              {/* Add the clear all orders button */}
              <button 
                onClick={handleClearAllOrders}
                disabled={clearingOrders}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
              >
                <FaTrash className="inline mr-1" />
                <span>{clearingOrders ? 'Clearing...' : 'Clear All'}</span>
              </button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all customer orders</p>
          
          {/* Add centered tools for desktop view */}
          <div className="hidden md:flex justify-center my-4">
            <div className="flex gap-3">
              <button 
                onClick={toggleNotificationTester}
                className="text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors"
              >
                <FaInfoCircle className="inline mr-1" />
                <span>{showNotificationTester ? 'Hide' : 'Show'} Tester</span>
              </button>
              
              <button 
                onClick={triggerTestNotification}
                className="text-sm px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md transition-colors"
              >
                <FaBell className="inline mr-1" />
                <span>Test Notify</span>
              </button>

              <button 
                onClick={handleClearAllOrders}
                disabled={clearingOrders}
                className="text-sm px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
              >
                <FaTrash className="inline mr-1" />
                <span>{clearingOrders ? 'Clearing...' : 'Clear All'}</span>
              </button>
            </div>
          </div>
          </div>
          
          {/* Notification Tester */}
          {showNotificationTester && (
            <div className="mb-6">
              <OrderNotificationTest />
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium text-gray-500">Total Orders</h3>
              <p className="text-base sm:text-xl font-bold truncate">{stats.totalOrders}</p>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-xs font-medium text-gray-500">Total Revenue</h3>
              <p className="text-base sm:text-xl font-bold truncate">{formatPrice(stats.totalRevenue)}</p>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-xs font-medium text-gray-500">Recent Orders (7d)</h3>
              <p className="text-base sm:text-xl font-bold truncate">{stats.recentOrders}</p>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h3 className="text-xs font-medium text-gray-500">Recent Revenue (7d)</h3>
              <p className="text-base sm:text-xl font-bold truncate">{formatPrice(stats.recentRevenue)}</p>
            </div>
          </div>
          
          {/* Filters and Search - Improved Mobile Layout */}
          <div className="space-y-3 mb-4 sm:mb-6">
            {/* Search Bar */}
            <div className="w-full">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FaSearch />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 md:hidden"
                >
                  Search
                </button>
              </form>
            </div>
            
            {/* Filters - more responsive layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <FaFilter className="mr-2 text-gray-500 hidden xs:inline" />
                <select
                  className="border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="mr-1 text-gray-500 whitespace-nowrap text-xs sm:text-sm hidden xs:inline">Show:</span>
                <select
                  className="border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              
              <button
                className={`px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center col-span-2 md:col-span-1 mt-1 md:mt-0 ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <FaSync className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} size="0.8em" />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Success message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
              <FaCheck className="mr-2" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* Error message - only show for actual errors, not expected states */}
          {error && error !== 'Failed to load orders. Please try again later.' && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 sm:mb-6">
              <h3 className="font-semibold mb-2">Error:</h3>
              <p className="text-sm">{error}</p>
              
              {isStorageQuotaError ? (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <button 
                    className="text-sm px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={handleClearOrderStorage}
                  >
                    Clear Order Storage
                  </button>
                  <p className="text-xs text-red-600">
                    This will remove cached order data and refresh the page.
                    Your account data will not be affected.
                  </p>
                </div>
              ) : (
              <button 
                className="mt-2 text-sm px-3 py-1 bg-red-200 text-red-800 rounded-md hover:bg-red-300"
                onClick={handleRefresh}
              >
                Try Again
              </button>
              )}
            </div>
          )}
          
          {/* Orders Table (Desktop) / Cards (Mobile) */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto w-full">
              <div className="overflow-x-auto">
                <table className="table-auto divide-y divide-gray-200" style={{width: "100%", minWidth: "1100px"}}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('customerName')}
                      >
                        <div className="flex items-center">
                          Customer
                          {sortField === 'customerName' && (
                            <FaSort className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Info
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                          {sortField === 'createdAt' && (
                            <FaSort className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {sortField === 'totalAmount' && (
                            <FaSort className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {sortField === 'status' && (
                            <FaSort className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isRefreshing ? (
                      // Show skeleton loaders while refreshing
                      Array.from({ length: itemsPerPage }).map((_, index) => (
                        <OrderRowSkeleton key={index} />
                      ))
                    ) : currentOrders.length > 0 ? (
                      currentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 truncate">{formatCustomerName(order)}</div>
                            <div className="text-sm text-gray-500 truncate">{getCustomerEmail(order)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 truncate">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">
                              {Array.isArray(order.items) ? order.items.length : 0} items
                            </div>
                            {order.trackingNumber && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                Tracking: {order.trackingNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative">
                              <span 
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer
                              ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'Processing' ? 'bg-purple-100 text-purple-800' : ''}
                              ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                              ${order.status === 'Refunded' ? 'bg-gray-100 text-gray-800' : ''}
                                `}
                                onClick={() => toggleStatusDropdown(order._id)}
                              >
                                {order.status || 'Unknown'}
                            </span>
                              
                              {/* Status dropdown */}
                              {showStatusDropdown[order._id] && (
                                <div className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                  <ul className="py-1">
                                    {ORDER_STATUSES.map(status => (
                                      <li 
                                        key={status}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
                                          ${order.status === status ? 'bg-gray-50 font-medium' : ''}
                                        `}
                                        onClick={() => handleStatusChange(order._id, status)}
                                      >
                                        {status}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {order.paymentReceipt && order.paymentReceipt.imageData ? (
                              <button 
                                onClick={() => openReceiptViewer(order.paymentReceipt.imageData)}
                                className="inline-flex items-center justify-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md px-2 py-1"
                                title="View Receipt"
                              >
                                <FaFileInvoiceDollar className="mr-1" /> View
                              </button>
                            ) : order.paymentReceipt && order.paymentReceipt.link ? (
                              <a 
                                href={order.paymentReceipt.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded-md px-2 py-1"
                                title="Open Receipt Link"
                              >
                                <FaExternalLinkAlt className="mr-1" /> Link
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Details"
                                onClick={() => handleViewOrderDetails(order._id)}
                              >
                                <FaEye />
                              </button>
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Order"
                                onClick={() => handleEditOrder(order._id)}
                              >
                                <FaPencilAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-xs sm:text-sm text-gray-500">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <FaBox className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
                          <p className="text-sm text-gray-500 max-w-md mx-auto">
                            There are no orders in the system yet. Orders will appear here when customers make purchases.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile View - Cards */}
            <div className="md:hidden p-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Orders</h3>
              
              {isRefreshing ? (
                // Skeleton cards for mobile
                Array.from({ length: 3 }).map((_, index) => (
                  <OrderCardSkeleton key={index} />
                ))
              ) : currentOrders.length > 0 ? (
                currentOrders.map(order => (
                  <OrderCard 
                    key={order._id}
                    order={order}
                    onViewDetails={handleViewOrderDetails}
                    onEditOrder={handleEditOrder}
                    onStatusChange={handleStatusChange}
                    showStatusDropdown={showStatusDropdown}
                    toggleStatusDropdown={toggleStatusDropdown}
                    getUserForOrder={getUserForOrder}
                    getCustomerEmail={getCustomerEmail}
                    formatDate={formatDate}
                    formatPrice={formatPrice}
                    openReceiptViewer={openReceiptViewer}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-100">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FaBox className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                    There are no orders in the system yet. Orders will appear here when customers make purchases.
                  </p>
                </div>
              )}
            </div>
            
            {/* Pagination - Keep existing pagination code */}
            {totalPages > 1 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 overflow-x-auto">
                <div className="flex justify-between sm:hidden mb-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between max-w-full">
                  <div className="truncate">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastOrder, filteredOrders.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredOrders.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Display a window of 5 pages, centered on the current page if possible
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer total pages, show all
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near the start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // If near the end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show window of 5 pages centered on current page
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                              ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                            {pageNum}
                        </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Details/Edit Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start md:items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl mx-auto w-full md:w-4/5 lg:max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto mt-0 md:mt-0">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white px-3 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center z-10">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {isEditMode ? 'Edit Order: ' : 'Order: '}
                  <span className="text-purple-600">#{isEditMode ? editedOrder.orderNumber : selectedOrder.orderNumber}</span>
                </h3>
                <div className="flex items-center space-x-2">
                  {isEditMode && (
                    <button 
                      className="text-green-600 hover:text-green-700 px-2 sm:px-3 py-1 bg-green-100 rounded-md flex items-center text-xs sm:text-sm"
                      onClick={handleSaveOrder}
                    >
                      <FaSave className="mr-1" /> Save
                    </button>
                  )}
                  <button 
                    className="text-gray-400 hover:text-gray-500 p-1"
                    onClick={closeOrderModal}
                    aria-label="Close"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                {/* Order Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      Created on: {formatDate(isEditMode ? editedOrder.createdAt : selectedOrder.createdAt)}
                    </div>
                    
                    {isEditMode ? (
                      <div className="mt-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          className="border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          name="status"
                          value={editedOrder.status || ''}
                          onChange={handleEditChange}
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                          ${selectedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${selectedOrder.status === 'Processing' ? 'bg-purple-100 text-purple-800' : ''}
                          ${selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${selectedOrder.status === 'Refunded' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {selectedOrder.status || 'Unknown'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 sm:mt-0">
                    {isEditMode ? (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <input
                          type="number"
                          className="border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          name="totalAmount"
                          value={editedOrder.totalAmount || 0}
                          onChange={handleEditChange}
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <div className="text-lg sm:text-xl font-bold text-gray-900">
                        {formatPrice(selectedOrder.totalAmount)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Info Sections */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <FaUser className="text-gray-500 mr-2" />
                      <h4 className="text-sm sm:text-md font-medium">Customer Information</h4>
                    </div>
                    
                    {isEditMode ? (
                      <div className="pl-2 sm:pl-6 space-y-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="customerName"
                            value={editedOrder.customerName || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="customerEmail"
                            value={editedOrder.customerEmail || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-6">
                        <p className="text-sm font-medium">{formatCustomerName(selectedOrder)}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{getCustomerEmail(selectedOrder)}</p>
                        {/* Show user ID if available */}
                        {selectedOrder.user && (
                          <p className="text-xs sm:text-sm text-gray-500">User ID: {selectedOrder.user}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Shipping Info */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <h4 className="text-sm sm:text-md font-medium">Shipping Information</h4>
                    </div>
                    
                    {isEditMode ? (
                      <div className="pl-2 sm:pl-6 space-y-2">
                        {editedOrder.shippingAddress && (
                          <>
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
                              <input
                                type="text"
                                className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                name="shippingAddress.street"
                                value={editedOrder.shippingAddress.street || ''}
                                onChange={handleEditChange}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                  type="text"
                                  className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  name="shippingAddress.city"
                                  value={editedOrder.shippingAddress.city || ''}
                                  onChange={handleEditChange}
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                  type="text"
                                  className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  name="shippingAddress.state"
                                  value={editedOrder.shippingAddress.state || ''}
                                  onChange={handleEditChange}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Zip</label>
                                <input
                                  type="text"
                                  className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  name="shippingAddress.zip"
                                  value={editedOrder.shippingAddress.zip || ''}
                                  onChange={handleEditChange}
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                  type="text"
                                  className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  name="shippingAddress.country"
                                  value={editedOrder.shippingAddress.country || ''}
                                  onChange={handleEditChange}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-6">
                        {selectedOrder.shippingAddress ? (
                          <>
                            <p className="text-sm">{selectedOrder.shippingAddress.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{selectedOrder.shippingAddress.street}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">{selectedOrder.shippingAddress.country}</p>
                            {selectedOrder.shippingAddress.phone && (
                              <p className="text-xs sm:text-sm text-gray-500">Phone: {selectedOrder.shippingAddress.phone}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500">No shipping address provided</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Info */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <FaCreditCard className="text-gray-500 mr-2" />
                      <h4 className="text-sm sm:text-md font-medium">Payment Information</h4>
                    </div>
                    
                    {isEditMode ? (
                      <div className="pl-2 sm:pl-6 space-y-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                          <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="paymentMethod"
                            value={editedOrder.paymentMethod || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                        {editedOrder.paymentDetails && (
                          <>
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                name="paymentDetails.status"
                                value={editedOrder.paymentDetails.status || ''}
                                onChange={handleEditChange}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                              <input
                                type="text"
                                className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                                name="paymentDetails.transactionId"
                                value={editedOrder.paymentDetails.transactionId || ''}
                                onChange={handleEditChange}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-6">
                        <p className="text-sm font-medium">Method: {selectedOrder.paymentMethod || 'Unknown'}</p>
                        {selectedOrder.paymentDetails && (
                          <>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Status: {selectedOrder.paymentDetails.status || 'Unknown'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Transaction ID: {selectedOrder.paymentDetails.transactionId || 'N/A'}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Receipt */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <FaFileInvoiceDollar className="text-gray-500 mr-2" />
                      <h4 className="text-sm sm:text-md font-medium">Payment Receipt</h4>
                    </div>
                    
                    {isEditMode ? (
                      <div className="pl-2 sm:pl-6 space-y-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Receipt Type</label>
                          <select
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="paymentReceipt.type"
                            value={(editedOrder.paymentReceipt && editedOrder.paymentReceipt.type) || 'none'}
                            onChange={handleEditChange}
                          >
                            <option value="none">None</option>
                            <option value="image">Image</option>
                            <option value="link">Link</option>
                          </select>
                        </div>
                        
                        {editedOrder.paymentReceipt && editedOrder.paymentReceipt.type === 'link' && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Receipt Link</label>
                            <input
                              type="text"
                              className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                              name="paymentReceipt.link"
                              value={editedOrder.paymentReceipt.link || ''}
                              onChange={handleEditChange}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-6">
                        {selectedOrder.paymentReceipt ? (
                          <>
                            <p className="text-sm font-medium mb-2">
                              Receipt Type: {selectedOrder.paymentReceipt.type === 'image' ? 'Image' : 
                                             selectedOrder.paymentReceipt.type === 'link' ? 'Link' : 'None'}
                            </p>
                            
                            {handleReceiptImage(selectedOrder.paymentReceipt)}
                            
                            {selectedOrder.paymentReceipt.uploadedAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Uploaded: {new Date(selectedOrder.paymentReceipt.uploadedAt).toLocaleString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500">No receipt information available</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Tracking Info */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <FaTruck className="text-gray-500 mr-2" />
                      <h4 className="text-sm sm:text-md font-medium">Tracking Information</h4>
                    </div>
                    
                    {isEditMode ? (
                      <div className="pl-2 sm:pl-6 space-y-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                          <input
                            type="text"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="trackingNumber"
                            value={editedOrder.trackingNumber || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
                          <select
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="shippingMethod"
                            value={editedOrder.shippingMethod || 'standard'}
                            onChange={handleEditChange}
                          >
                            <option value="standard">Standard</option>
                            <option value="express">Express</option>
                            <option value="nextday">Next Day</option>
                            <option value="international">International</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Est. Delivery Date</label>
                          <input
                            type="date"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="estimatedDelivery"
                            value={editedOrder.estimatedDelivery ? new Date(editedOrder.estimatedDelivery).toISOString().split('T')[0] : ''}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-6">
                        <p className="text-sm font-medium">
                          {selectedOrder.trackingNumber 
                            ? `Tracking #: ${selectedOrder.trackingNumber}` 
                            : 'No tracking number'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Shipping Method: {selectedOrder.shippingMethod || 'Standard'}
                        </p>
                        {selectedOrder.estimatedDelivery && (
                          <p className="text-xs sm:text-sm text-gray-500">
                            Est. Delivery: {formatDate(selectedOrder.estimatedDelivery)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="mt-6 sm:mt-8">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <FaBox className="text-gray-500 mr-2" />
                    <h4 className="text-base sm:text-lg font-medium">Order Items</h4>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qty
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items && selectedOrder.items.length > 0 ? (
                            selectedOrder.items.map((item, index) => (
                              <tr key={item._id || index} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                  <div className="flex items-center">
                                    {item.image && (
                                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-4">
                                        <img 
                                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover" 
                                          src={item.image} 
                                          alt={item.name} 
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                                        {item.name}
                                      </div>
                                      {(item.color || item.size) && (
                                        <div className="text-xs text-gray-500">
                                          {item.color && `Color: ${item.color}`}
                                          {item.color && item.size && ` | `}
                                          {item.size && `Size: ${item.size}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-medium">
                                  {formatPrice(item.price)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                                No items found in this order
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {/* Order Summary */}
                <div className="mt-6 sm:mt-8 bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Order Summary</h4>
                  
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                          <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="subtotal"
                            value={editedOrder.subtotal || 0}
                            onChange={handleEditChange}
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tax</label>
                          <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="tax"
                            value={editedOrder.tax || 0}
                            onChange={handleEditChange}
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Shipping</label>
                          <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="shipping"
                            value={editedOrder.shipping || 0}
                            onChange={handleEditChange}
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount</label>
                          <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-1 w-full focus:ring-blue-500 focus:border-blue-500 text-sm"
                            name="discount"
                            value={editedOrder.discount || 0}
                            onChange={handleEditChange}
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-500">Subtotal:</span>
                        <span className="text-xs sm:text-sm">{formatPrice(selectedOrder.subtotal || 0)}</span>
                      </div>
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">Tax:</span>
                          <span className="text-xs sm:text-sm">{formatPrice(selectedOrder.tax)}</span>
                        </div>
                      )}
                      {selectedOrder.shipping > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">Shipping:</span>
                          <span className="text-xs sm:text-sm">{formatPrice(selectedOrder.shipping)}</span>
                        </div>
                      )}
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">Discount:</span>
                          <span className="text-xs sm:text-sm text-red-500">-{formatPrice(selectedOrder.discount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span className="text-sm sm:text-base">Total:</span>
                        <span className="text-sm sm:text-base">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
                {isEditMode ? (
                  <>
                    <button
                      className="mr-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none text-sm"
                      onClick={closeOrderModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center text-sm"
                      onClick={handleSaveOrder}
                    >
                      <FaSave className="mr-1" /> Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="mr-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center text-sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <FaPencilAlt className="mr-1" /> Edit
                    </button>
                    <button
                      className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none text-sm"
                      onClick={closeOrderModal}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Receipt Viewer Modal */}
        {receiptViewerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-lg sm:max-w-4xl max-h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <h3 className="text-base sm:text-lg font-medium">Receipt Image</h3>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button 
                    onClick={handleZoomOut} 
                    className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                    disabled={imageZoomLevel <= 50}
                    title="Zoom Out"
                  >
                    <FaSearchMinus className="text-xs sm:text-sm" />
                  </button>
                  <span className="text-xs sm:text-sm font-medium">{imageZoomLevel}%</span>
                  <button 
                    onClick={handleZoomIn} 
                    className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                    disabled={imageZoomLevel >= 200}
                    title="Zoom In"
                  >
                    <FaSearchPlus className="text-xs sm:text-sm" />
                  </button>
                  <button 
                    onClick={downloadReceiptImage} 
                    className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 ml-1 sm:ml-2"
                    title="Download Receipt"
                  >
                    <FaDownload className="text-xs sm:text-sm" />
                  </button>
                  <button 
                    onClick={closeReceiptViewer} 
                    className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 ml-1 sm:ml-2"
                    title="Close"
                  >
                    <FaTimes className="text-xs sm:text-sm" />
                  </button>
                </div>
              </div>
              
              {/* Mobile Zoom Controls - Touch friendly */}
              <div className="flex justify-center p-2 bg-gray-50 md:hidden">
                <button 
                  onClick={handleZoomOut}
                  className="bg-gray-200 px-4 py-2 rounded-l-lg text-gray-700"
                  disabled={imageZoomLevel <= 50}
                >
                  <FaSearchMinus className="inline mr-1" /> Zoom Out
                </button>
                <div className="px-4 py-2 bg-white border-t border-b border-gray-300 font-medium">
                  {imageZoomLevel}%
                </div>
                <button 
                  onClick={handleZoomIn}
                  className="bg-gray-200 px-4 py-2 rounded-r-lg text-gray-700"
                  disabled={imageZoomLevel >= 200}
                >
                  <FaSearchPlus className="inline mr-1" /> Zoom In
                </button>
              </div>
              
              {/* Modal Body - Image Container */}
              <div className="p-2 overflow-auto flex-grow flex items-center justify-center bg-gray-100">
                {currentReceiptImage ? (
                  <div className="overflow-auto max-h-full flex items-center justify-center">
                    <img 
                      src={currentReceiptImage} 
                      alt="Receipt" 
                      className="max-w-full"
                      style={{ transform: `scale(${imageZoomLevel / 100})` }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300?text=Image+Failed+to+Load";
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    Failed to load receipt image
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="border-t p-3 sm:p-4 flex justify-between">
                <button 
                  onClick={downloadReceiptImage}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 sm:flex items-center hidden"
                >
                  <FaDownload className="mr-1" /> Download
                </button>
                <button 
                  onClick={closeReceiptViewer}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 