import { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaCheck } from 'react-icons/fa';

const OrderFilterPanel = ({ filters, onFilterChange, onClose }) => {
  const [tempFilters, setTempFilters] = useState({ ...filters });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
  };
  
  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
      paymentMethod: 'all',
      minAmount: '',
      maxAmount: '',
    };
    setTempFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];
  
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' }
  ];
  
  const paymentMethodOptions = [
    { value: 'all', label: 'All Payment Methods' },
    { value: 'credit card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank transfer', label: 'Bank Transfer' },
    { value: 'cash on delivery', label: 'Cash on Delivery' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-end"
      onClick={onClose}
    >
      <div 
        className="bg-white h-full w-full max-w-md overflow-y-auto shadow-xl animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Filter Orders</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <FaTimes />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Order Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                name="status"
                value={tempFilters.status}
                onChange={handleInputChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="relative">
                <select
                  name="dateRange"
                  value={tempFilters.dateRange}
                  onChange={handleInputChange}
                  className="w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={tempFilters.paymentMethod}
                onChange={handleInputChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                {paymentMethodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Amount Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      name="minAmount"
                      value={tempFilters.minAmount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full py-2 pl-7 pr-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      name="maxAmount"
                      value={tempFilters.maxAmount}
                      onChange={handleInputChange}
                      placeholder="No max"
                      className="w-full py-2 pl-7 pr-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center"
              >
                <FaCheck className="mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilterPanel; 