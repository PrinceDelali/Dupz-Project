import { useState } from 'react';
import { 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaEye, 
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaShippingFast,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaCreditCard,
  FaUser,
  FaBoxes
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const OrdersTable = ({ 
  orders, 
  sortField, 
  sortDirection, 
  onSort, 
  onViewOrder,
  selectedOrders,
  onToggleOrderSelection,
  onToggleAllOrders,
  onUpdateStatus,
  allSelected
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const handleSortClick = (field) => {
    onSort(field);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getPaymentBadgeClass = (method) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'paypal':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'bank transfer':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'cash on delivery':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };
  
  const toggleActionMenu = (orderNumber, e) => {
    e?.stopPropagation();
    if (showActionMenu === orderNumber) {
      setShowActionMenu(null);
    } else {
      setShowActionMenu(orderNumber);
    }
  };
  
  const handleUpdateStatus = (orderNumber, newStatus) => {
    onUpdateStatus(orderNumber, newStatus);
    setShowActionMenu(null);
  };

  const renderActionMenu = (order) => (
    <div 
      className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={() => onViewOrder(order)}
        >
          <FaEye className="mr-2" /> View Details
        </button>
        
        {order.status !== 'Processing' && (
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleUpdateStatus(order.orderNumber, 'Processing')}
          >
            <FaBoxOpen className="mr-2" /> Mark Processing
          </button>
        )}
        
        {order.status !== 'Shipped' && !(order.status === 'Cancelled' || order.status === 'Delivered') && (
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleUpdateStatus(order.orderNumber, 'Shipped')}
          >
            <FaShippingFast className="mr-2" /> Mark Shipped
          </button>
        )}
        
        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => handleUpdateStatus(order.orderNumber, 'Delivered')}
          >
            <FaCheckCircle className="mr-2" /> Mark Delivered
          </button>
        )}
        
        {order.status !== 'Cancelled' && (
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            onClick={() => handleUpdateStatus(order.orderNumber, 'Cancelled')}
          >
            <FaTimesCircle className="mr-2" /> Cancel Order
          </button>
        )}
      </div>
    </div>
  );

  // Mobile card view
  const renderMobileCards = () => {
    if (orders.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          No orders found matching your criteria
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {orders.map(order => (
          <div 
            key={order.orderNumber}
            className="bg-white border rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mr-3"
                  checked={selectedOrders.includes(order.orderNumber)}
                  onChange={() => onToggleOrderSelection(order.orderNumber)}
                />
                <div>
                  <span className="text-gray-900 font-medium">{order.orderNumber}</span>
                  <span 
                    className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  className="text-purple-600 hover:text-purple-900 p-2"
                  onClick={() => onViewOrder(order)}
                >
                  <FaEye />
                </button>
                <div className="relative">
                  <button
                    className="text-gray-500 hover:text-gray-900 p-2"
                    onClick={(e) => toggleActionMenu(order.orderNumber, e)}
                  >
                    <FaEllipsisV />
                  </button>
                  {showActionMenu === order.orderNumber && renderActionMenu(order)}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start">
                  <FaUser className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Customer</div>
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCalendarAlt className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Order Date</div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCreditCard className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Payment</div>
                    <div>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPaymentBadgeClass(order.paymentMethod)}`}
                      >
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaBoxes className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Items & Total</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
              
              {order.items.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-2">Order Items</div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items.slice(0, 4).map((item, index) => (
                      <img 
                        key={index}
                        className="h-8 w-8 rounded-md ring-2 ring-white" 
                        src={item.image} 
                        alt={item.name}
                        title={item.name}
                      />
                    ))}
                    {order.items.length > 4 && (
                      <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left w-12">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                checked={allSelected && orders.length > 0}
                onChange={onToggleAllOrders}
                disabled={orders.length === 0}
              />
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('orderNumber')}
          >
            <div className="flex items-center space-x-1">
              <span>Order ID</span>
              <span>{renderSortIcon('orderNumber')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('customer.name')}
          >
            <div className="flex items-center space-x-1">
              <span>Customer</span>
              <span>{renderSortIcon('customer.name')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('createdAt')}
          >
            <div className="flex items-center space-x-1">
              <span>Date</span>
              <span>{renderSortIcon('createdAt')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('status')}
          >
            <div className="flex items-center space-x-1">
              <span>Status</span>
              <span>{renderSortIcon('status')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('totalAmount')}
          >
            <div className="flex items-center space-x-1">
              <span>Total</span>
              <span>{renderSortIcon('totalAmount')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => handleSortClick('paymentMethod')}
          >
            <div className="flex items-center space-x-1">
              <span>Payment</span>
              <span>{renderSortIcon('paymentMethod')}</span>
            </div>
          </th>
          <th 
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Items
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {orders.length === 0 ? (
          <tr>
            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
              No orders found matching your criteria
            </td>
          </tr>
        ) : (
          orders.map(order => (
            <tr 
              key={order.orderNumber}
              className={`${hoveredRow === order.orderNumber ? 'bg-gray-50' : ''} transition-colors`}
              onMouseEnter={() => setHoveredRow(order.orderNumber)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  checked={selectedOrders.includes(order.orderNumber)}
                  onChange={() => onToggleOrderSelection(order.orderNumber)}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-gray-900 font-medium">{order.orderNumber}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <img 
                      className="h-8 w-8 rounded-full" 
                      src={order.customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.customer.name)}&background=random`} 
                      alt={order.customer.name} 
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span 
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeClass(order.status)}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</div>
                <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPaymentBadgeClass(order.paymentMethod)}`}
                >
                  {order.paymentMethod}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <img 
                      key={index}
                      className="h-6 w-6 rounded-md ring-2 ring-white" 
                      src={item.image} 
                      alt={item.name}
                      title={item.name}
                    />
                  ))}
                  {order.items.length > 3 && (
                    <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-sm">
                <div className="flex items-center justify-end space-x-2 relative">
                  <button
                    className="text-purple-600 hover:text-purple-900 p-1"
                    onClick={() => onViewOrder(order)}
                  >
                    <FaEye />
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-900 p-1"
                    onClick={(e) => toggleActionMenu(order.orderNumber, e)}
                  >
                    <FaEllipsisV />
                  </button>
                  
                  {showActionMenu === order.orderNumber && renderActionMenu(order)}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
      {/* Mobile view */}
      <div className="sm:hidden">
        {renderMobileCards()}
      </div>
      
      {/* Desktop view */}
      <div className="hidden sm:block">
        {renderDesktopTable()}
      </div>
    </div>
  );
};

export default OrdersTable; 