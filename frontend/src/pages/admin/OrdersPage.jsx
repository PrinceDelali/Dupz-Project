import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEllipsisV, FaDownload, FaSyncAlt } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import OrdersTable from '../../components/admin/orders/OrdersTable';
import OrderDetailsModal from '../../components/admin/orders/OrderDetailsModal';
import OrderFilterPanel from '../../components/admin/orders/OrderFilterPanel';
import OrderStatsCards from '../../components/admin/orders/OrderStatsCards';
import OrderBulkActions from '../../components/admin/orders/OrderBulkActions';
import { generateDummyOrders } from '../../utils/dummyData';
import apiConfig from '../../config/apiConfig';
import { useSidebar } from '../../context/SidebarContext';

const OrdersPage = () => {
  const { collapsed } = useSidebar();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0, 
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    totalRevenue: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Function to fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call:
      // const response = await axios.get('${apiConfig.baseURL}/admin/orders');
      // setOrders(response.data.data);
      
      // Using dummy data for now
      const dummyOrders = generateDummyOrders(75);
      setOrders(dummyOrders);
      applyFiltersAndSort(dummyOrders);
      calculateOrderStats(dummyOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort(orders);
  }, [filters, searchTerm, sortField, sortDirection]);

  const calculateOrderStats = (orderData) => {
    const stats = {
      total: orderData.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      totalRevenue: 0
    };

    orderData.forEach(order => {
      stats[order.status.toLowerCase()]++;
      
      // Only count revenue for non-cancelled/refunded orders
      if (!['cancelled', 'refunded'].includes(order.status.toLowerCase())) {
        stats.totalRevenue += order.totalAmount;
      }
    });

    setOrderStats(stats);
  };

  const applyFiltersAndSort = (orderData) => {
    let result = [...orderData];
    
    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(order => 
        order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let compareDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          compareDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          compareDate.setDate(compareDate.getDate() - 1);
          compareDate.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(compareDate);
          endOfYesterday.setHours(23, 59, 59, 999);
          result = result.filter(order => 
            new Date(order.createdAt) >= compareDate && 
            new Date(order.createdAt) <= endOfYesterday
          );
          break;
        case 'last7days':
          compareDate.setDate(compareDate.getDate() - 7);
          break;
        case 'last30days':
          compareDate.setDate(compareDate.getDate() - 30);
          break;
        case 'thisMonth':
          compareDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          const lastMonth = now.getMonth() - 1;
          const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const month = lastMonth < 0 ? 11 : lastMonth;
          compareDate = new Date(year, month, 1);
          const lastDayOfLastMonth = new Date(year, month + 1, 0);
          result = result.filter(order => 
            new Date(order.createdAt) >= compareDate && 
            new Date(order.createdAt) <= lastDayOfLastMonth
          );
          break;
        default:
          break;
      }
      
      // For ranges that are simple "since date" filters
      if (['today', 'last7days', 'last30days', 'thisMonth'].includes(filters.dateRange)) {
        result = result.filter(order => new Date(order.createdAt) >= compareDate);
      }
    }
    
    // Apply payment method filter
    if (filters.paymentMethod !== 'all') {
      result = result.filter(order => 
        order.paymentMethod.toLowerCase() === filters.paymentMethod.toLowerCase()
      );
    }
    
    // Apply amount range filter
    if (filters.minAmount) {
      result = result.filter(order => order.totalAmount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter(order => order.totalAmount <= parseFloat(filters.maxAmount));
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle nested fields like customer.name
      if (sortField.includes('.')) {
        const [parent, child] = sortField.split('.');
        aValue = a[parent][child];
        bValue = b[parent][child];
      }
      
      // Handle string vs number sorting
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
    
    setFilteredOrders(result);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for dates, ascending for others
      setSortField(field);
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (newFilters) => {
    setFilters({...filters, ...newFilters});
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const toggleOrderSelection = (orderNumber) => {
    if (selectedOrders.includes(orderNumber)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderNumber));
    } else {
      setSelectedOrders([...selectedOrders, orderNumber]);
    }
  };

  const toggleAllOrders = () => {
    const visibleOrders = getCurrentPageOrders().map(order => order.orderNumber);
    const allSelected = visibleOrders.every(id => selectedOrders.includes(id));
    
    if (allSelected) {
      // Remove all current page orders from selection
      setSelectedOrders(selectedOrders.filter(id => !visibleOrders.includes(id)));
    } else {
      // Add all current page orders to selection
      const newSelection = [...new Set([...selectedOrders, ...visibleOrders])];
      setSelectedOrders(newSelection);
    }
  };

  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) return;
    
    setLoading(true);
    
    try {
      // In a real app, this would call the API
      // await axios.post('${apiConfig.baseURL}/admin/orders/bulk-action', {
      //   orderIds: selectedOrders,
      //   action
      // });
      
      // Simulate API call
      setTimeout(() => {
        // Update local state to reflect the changes
        const updatedOrders = orders.map(order => {
          if (selectedOrders.includes(order.orderNumber)) {
            switch (action) {
              case 'mark-processing':
                return { ...order, status: 'Processing' };
              case 'mark-shipped':
                return { ...order, status: 'Shipped' };
              case 'mark-delivered':
                return { ...order, status: 'Delivered' };
              case 'mark-cancelled':
                return { ...order, status: 'Cancelled' };
              default:
                return order;
            }
          }
          return order;
        });
        
        setOrders(updatedOrders);
        applyFiltersAndSort(updatedOrders);
        calculateOrderStats(updatedOrders);
        setSelectedOrders([]);
        setLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderNumber, newStatus) => {
    setLoading(true);
    
    try {
      // In a real app, this would call the API
      // await axios.put(`${apiConfig.baseURL}/admin/orders/${orderNumber}/status`, {
      //   status: newStatus
      // });
      
      // Simulate API call
      setTimeout(() => {
        // Update local state to reflect the change
        const updatedOrders = orders.map(order => {
          if (order.orderNumber === orderNumber) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        applyFiltersAndSort(updatedOrders);
        calculateOrderStats(updatedOrders);
        
        // If the order being updated is the one in the modal, update it there too
        if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  
  // Dynamic content area margin based on sidebar state
  const getContentMargin = () => {
    // On mobile, no left margin
    if (window.innerWidth < 768) {
      return "ml-0";
    }
    // On medium screens with collapsed sidebar
    if (collapsed) {
      return "md:ml-20";
    }
    // On large screens with expanded sidebar
    return "md:ml-20 lg:ml-64";
  };

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <div className={`flex-1 min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 w-full transition-all duration-300 ${getContentMargin()}`}>
        <div className="mx-auto w-full max-w-full sm:max-w-7xl">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4">Orders Management</h1>
          
          {loading ? (
            <LoadingOverlay />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <OrderStatsCards stats={orderStats} />
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-2 sm:p-4 border-b space-y-2">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg flex items-center justify-center transition-colors ${
                          showFilters ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FaFilter className="mr-2" />
                        Filters
                      </button>
                      
                      <button
                        className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                        onClick={fetchOrders}
                      >
                        <FaSyncAlt className="mr-2" />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                      
                      <button
                        className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                        onClick={() => {/* Export functionality would go here */}}
                      >
                        <FaDownload className="mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    </div>
                  </div>
                  
                  {showFilters && (
                    <OrderFilterPanel 
                      filters={filters} 
                      onFilterChange={handleFilterChange} 
                    />
                  )}
                  
                  {selectedOrders.length > 0 && (
                    <OrderBulkActions 
                      selectedCount={selectedOrders.length}
                      onAction={handleBulkAction}
                    />
                  )}
                  
                  <div className="overflow-x-auto w-full">
                    <OrdersTable
                      orders={getCurrentPageOrders()}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      onViewOrder={handleViewOrder}
                      selectedOrders={selectedOrders}
                      onToggleOrderSelection={toggleOrderSelection}
                      onToggleAllOrders={toggleAllOrders}
                      onUpdateStatus={handleUpdateOrderStatus}
                      itemsPerPage={itemsPerPage}
                      allSelected={getCurrentPageOrders().length > 0 && 
                        getCurrentPageOrders().every(order => 
                          selectedOrders.includes(order.orderNumber)
                        )}
                    />
                  </div>
                  
                  <div className="px-3 py-3 sm:px-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <label className="text-xs sm:text-sm text-gray-600">Show:</label>
                      <select
                        className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-xs sm:text-sm"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                        Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {
                          Math.min(currentPage * itemsPerPage, filteredOrders.length)
                        } of {filteredOrders.length} orders
                      </span>
                    </div>
                    
                    <nav className="flex items-center justify-between w-full sm:w-auto">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border ${
                            currentPage === 1
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Prev
                        </button>
                        
                        <div className="flex mx-1 sm:mx-2">
                          {/* Simplified mobile pagination to just show current page */}
                          <div className="sm:hidden">
                            <span className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md">
                              {currentPage} / {totalPages}
                            </span>
                          </div>

                          {/* Desktop pagination */}
                          <div className="hidden sm:flex">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-1 mx-1 text-sm rounded-md ${
                                    currentPage === pageNum
                                      ? 'bg-purple-600 text-white'
                                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                              <>
                                <span className="mx-1 text-gray-500 text-sm self-center">...</span>
                                <button
                                  onClick={() => handlePageChange(totalPages)}
                                  className="px-3 py-1 mx-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  {totalPages}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border ${
                            currentPage === totalPages || totalPages === 0
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </div>
  );
};

export default OrdersPage; 