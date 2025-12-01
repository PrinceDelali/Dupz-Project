import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaEye, FaUserEdit, FaTrash, FaSync, FaCheck, FaDownload, FaDatabase, FaExclamationTriangle, FaWifi, FaNetworkWired, FaCommentDots } from 'react-icons/fa';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useCustomersStore } from '../../store/customersStore';
import AdminChatPanel from '../../components/admin/AdminChatPanel';
import { useChatStore } from '../../store/chatStore';

// Format time ago for display
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Skeleton loader for customer rows
const CustomerRowSkeleton = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="p-4 border-b animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="ml-3">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="flex space-x-2">
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-5 gap-4 px-6 py-4 animate-pulse">
      <div className="col-span-2">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="ml-4">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-20 self-center"></div>
      <div className="self-center">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="flex justify-center space-x-3 self-center">
        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

// Network status indicator component
const NetworkStatus = ({ isOnline, isCached, lastUpdate, isRefreshing }) => {
  const timeAgo = lastUpdate ? formatTimeAgo(lastUpdate) : 'never';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="text-xs flex items-center bg-gray-50 px-2 py-1 rounded-md">
      {isOnline ? (
        <FaNetworkWired className="text-green-500 mr-1" title="Online" />
      ) : (
        <FaWifi className="text-red-500 mr-1" title="Offline" />
      )}
      
      {isRefreshing ? (
        <FaSync className="text-blue-500 animate-spin mr-1" title="Syncing" />
      ) : isCached ? (
        <FaDatabase className="text-blue-400 mr-1" title="Cached Data" />
      ) : (
        <FaDatabase className="text-green-500 mr-1" title="Live Data" />
      )}
      
      <span className="ml-1">
        {isOnline ? 'Online' : 'Offline'}{isMobile ? '' : ' • '}{!isMobile && (isCached ? 'Using cache' : 'Live data')}{isMobile ? '' : ' • '}{!isMobile && `Updated ${timeAgo}`}
      </span>
    </div>
  );
};

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Get chat store for unread count
  const totalUnreadChats = useChatStore(state => state.getTotalUnreadCount());
  
  // Get store state and actions
  const { 
    customers, 
    totalPages, 
    currentPage, 
    isLoading,
    isBackgroundRefreshing,
    error,
    fetchCustomers, 
    forceRefresh,
    deleteCustomer,
    selectCustomer,
    lastFetchTime,
    isCacheStale
  } = useCustomersStore();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      console.log("[NETWORK] Browser reports online status");
      setIsOnline(true);
      setNetworkError(null);
      
      // When connection is restored, refresh data
      if (isCacheStale()) {
        console.log("[NETWORK] Connection restored and cache is stale, refreshing data");
        handleRefresh();
      }
    };
    
    const handleOffline = () => {
      console.log("[NETWORK] Browser reports offline status");
      setIsOnline(false);
      setNetworkError("You are currently offline. Showing cached data.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isCacheStale]);
  
  // Fetch customers on initial load only
  useEffect(() => {
    const loadCustomers = async () => {
      console.log("[CUSTOMERS PAGE] Initial data load");
      try {
        await fetchCustomers(currentPage, 10, searchTerm);
        setNetworkError(null);
        setRetryCount(0);
      } catch (err) {
        console.error("[CUSTOMERS PAGE] Error loading customers:", err);
        
        // Check if it's a network error
        if (!err.response && err.message.includes('Network Error')) {
          setNetworkError("Cannot connect to server. Using cached data if available.");
          setIsOnline(false);
        }
      }
    };
    
    loadCustomers();
    // Empty dependency array to ensure it only runs once on mount
  }, []);
  
  // Handle page change as a separate effect
  useEffect(() => {
    // Skip on initial render
    const handlePageChange = async () => {
      if (currentPage > 1) {
        console.log(`[CUSTOMERS PAGE] Changing to page ${currentPage}`);
        try {
          await fetchCustomers(currentPage, 10, searchTerm);
        } catch (err) {
          console.error("[CUSTOMERS PAGE] Page change error:", err);
        }
      }
    };
    
    handlePageChange();
  }, [currentPage]);

  // Calculate cache status
  const isCacheExpired = isCacheStale();
  const cacheTimeAgo = lastFetchTime 
    ? formatTimeAgo(lastFetchTime) 
    : 'never';

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(1, 10, searchTerm)
      .catch(err => {
        console.error("[CUSTOMERS PAGE] Search error:", err);
        if (!err.response && err.message.includes('Network Error')) {
          setNetworkError("Cannot connect to server. Searching in cached data only.");
        }
      });
  };

  // Handle refresh with retry logic
  const handleRefresh = () => {
    setIsRefreshing(true);
    setNetworkError(null);
    
    forceRefresh(currentPage, 10, searchTerm)
      .then(() => {
        setSuccessMessage('Customer list refreshed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setRetryCount(0);
        setIsOnline(true);
      })
      .catch(err => {
        console.error('[CUSTOMERS PAGE] Error refreshing customers:', err);
        
        // Network error handling
        if (!err.response && err.message.includes('Network Error')) {
          setNetworkError("Cannot connect to server. Please check your internet connection.");
          setIsOnline(false);
        } else if (err.response && err.response.status >= 500) {
          setNetworkError(`Server error (${err.response.status}): ${err.response.data.message || 'Unknown error'}`);
        } else {
          setNetworkError(`Error: ${err.message}`);
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };
  
  // Retry connecting to the server
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setNetworkError(null);
    handleRefresh();
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      // Just update the page in store, the useEffect will handle the fetch
      console.log(`[CUSTOMERS PAGE] Page change requested to: ${page}`);
      useCustomersStore.setState({ currentPage: page });
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (id) => {
    if (!isOnline) {
      alert("You are offline. Cannot delete customers while offline.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteCustomer(id);
        setSuccessMessage('Customer deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('[CUSTOMERS PAGE] Error deleting user:', error);
        
        // Specific error handling for deletes
        if (!error.response && error.message.includes('Network Error')) {
          alert("Network error. Cannot delete customer while offline.");
        } else if (error.response && error.response.status === 404) {
          alert("Customer not found. It may have been already deleted.");
        } else {
          alert(`Error deleting customer: ${error.message}`);
        }
      }
    }
  };

  // Handle view customer
  const handleViewCustomer = (id) => {
    selectCustomer(id);
    // You can add navigation to a detail page if needed
    // navigate(`/admin/customers/${id}`);
  };

  // Determine data source for status display
  const isUsingCachedData = isCacheExpired || !!networkError || !isOnline;

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        {isLoading && !isRefreshing && <LoadingOverlay />}
        
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-auto mb-4 md:mb-0">
              <form onSubmit={handleSearch} className="w-full">
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FaSearch />
                </div>
                <button type="submit" className="hidden">Search</button>
              </form>
            </div>
            
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap justify-center w-full' : 'gap-4'}`}>
              {/* Chat button */}
              <button
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center relative ${isMobile ? 'flex-1' : ''}`}
                onClick={() => setChatPanelOpen(true)}
              >
                <FaCommentDots className="mr-2" />
                {isMobile ? 'Chat' : 'Customer Chat'}
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalUnreadChats}
                  </span>
                )}
              </button>
              
              {/* Network/Cache status indicator */}
              {!isMobile && (
              <NetworkStatus 
                isOnline={isOnline}
                isCached={isUsingCachedData}
                lastUpdate={lastFetchTime}
                isRefreshing={isBackgroundRefreshing || isRefreshing}
              />
              )}
              
              <button
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''} ${isMobile ? 'flex-1' : ''}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <FaDownload className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : isMobile ? 'Refresh' : 'Refresh Data'}
              </button>
            </div>
          </div>
          
          {/* Mobile network status indicator */}
          {isMobile && (
            <div className="mb-4">
              <NetworkStatus 
                isOnline={isOnline}
                isCached={isUsingCachedData}
                lastUpdate={lastFetchTime}
                isRefreshing={isBackgroundRefreshing || isRefreshing}
              />
            </div>
          )}
          
          {/* Success message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
              <FaCheck className="mr-2 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}
          
          {/* Network error message */}
          {networkError && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center'}`}>
                <div className={`${isMobile ? '' : 'flex-shrink-0'}`}>
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className={`${isMobile ? '' : 'ml-3 flex-grow'}`}>
                  <p className="text-sm text-yellow-700">{networkError}</p>
                  {!isOnline && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Showing cached data from {formatTimeAgo(lastFetchTime)}
                    </p>
                  )}
                </div>
                <div className={`${isMobile ? 'w-full' : 'ml-auto pl-3'}`}>
                  <button 
                    onClick={handleRetry}
                    disabled={isRefreshing}
                    className={`px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded hover:bg-yellow-200 focus:outline-none ${isMobile ? 'w-full' : ''}`}
                  >
                    {isRefreshing ? 'Trying...' : `Retry${retryCount > 0 ? ` (${retryCount})` : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* MongoDB/API error message */}
          {error && !networkError && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2 flex items-center">
                <FaExclamationTriangle className="mr-2" /> Database Error:
              </h3>
              <p className="text-sm">{error}</p>
              <div className="mt-2 flex space-x-2">
                <button 
                  className={`text-sm px-3 py-1 bg-red-200 text-red-800 rounded-md hover:bg-red-300 ${isMobile ? 'w-full' : ''}`}
                  onClick={handleRefresh}
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop View - Table Header */}
            {!isMobile && (
              <div className="bg-gray-50 grid grid-cols-5 gap-4 px-6 py-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider col-span-2">
                  Customer
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Date
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Actions
                </div>
              </div>
            )}
              
              <div className="bg-white divide-y divide-gray-200">
                {isRefreshing ? (
                  // Show skeleton loaders while refreshing
                  Array.from({ length: 5 }).map((_, index) => (
                  <CustomerRowSkeleton key={index} isMobile={isMobile} />
                  ))
                ) : customers.length > 0 ? (
                  customers.map((customer) => (
                  <div key={customer._id} className={isMobile ? 
                    "p-4 border-b hover:bg-gray-50" : 
                    "grid grid-cols-5 gap-4 px-6 py-4 hover:bg-gray-50"
                  }>
                    {isMobile ? (
                      // Mobile Card View
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {customer.firstName ? customer.firstName.charAt(0) : '?'}
                              {customer.lastName ? customer.lastName.charAt(0) : ''}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            customer.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {customer.role || 'user'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="text-gray-500">
                            Joined: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                          <div className="flex space-x-4">
                            <button 
                              className="text-blue-600 hover:text-blue-900 p-1"
                              onClick={() => handleViewCustomer(customer._id)}
                              title="View Customer"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit Customer"
                              disabled={!isOnline}
                            >
                              <FaUserEdit className={!isOnline ? 'opacity-50' : ''} />
                            </button>
                            <button 
                              className={`text-red-600 p-1 ${isOnline ? 'hover:text-red-900' : 'opacity-50 cursor-not-allowed'}`}
                              onClick={isOnline ? () => handleDelete(customer._id) : undefined}
                              title={isOnline ? "Delete Customer" : "Cannot delete while offline"}
                              disabled={!isOnline}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Desktop Table View
                      <>
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {customer.firstName ? customer.firstName.charAt(0) : '?'}
                            {customer.lastName ? customer.lastName.charAt(0) : ''}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 self-center">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div className="text-sm self-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          customer.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.role || 'user'}
                        </span>
                      </div>
                      <div className="flex justify-center space-x-3 self-center">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewCustomer(customer._id)}
                          title="View Customer"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Edit Customer"
                          disabled={!isOnline}
                        >
                          <FaUserEdit className={!isOnline ? 'opacity-50' : ''} />
                        </button>
                        <button 
                          className={`text-red-600 ${isOnline ? 'hover:text-red-900' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={isOnline ? () => handleDelete(customer._id) : undefined}
                          title={isOnline ? "Delete Customer" : "Cannot delete while offline"}
                          disabled={!isOnline}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      </>
                    )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-1">No customers found</h3>
                    <p className="text-gray-500">Customers will appear here once they register</p>
                  </div>
                )}
            </div>
            
            {customers.length > 0 && totalPages > 1 && (
              <div className={`${isMobile ? 'px-4' : 'px-6'} py-4 flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} border-t`}>
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded ${isMobile ? 'flex-1 justify-center' : ''} ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 border rounded ${isMobile ? 'flex-1 justify-center' : ''} ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Chat Panel */}
      {chatPanelOpen && (
        <AdminChatPanel onClose={() => setChatPanelOpen(false)} className={isMobile ? "w-full" : ""} />
      )}
    </div>
  );
};

export default CustomersPage;