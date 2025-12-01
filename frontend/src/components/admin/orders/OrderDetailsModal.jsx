import { useState } from 'react';
import { FaTimes, FaPrint, FaEnvelope, FaExternalLinkAlt, FaEdit, FaCheck, FaDownload, FaShippingFast } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const OrderDetailsModal = ({ order, onClose, onUpdateStatus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(order.notes || '');
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  
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

  const handleSaveNotes = () => {
    // In a real app, you would save the notes to the server here
    setIsEditing(false);
  };
  
  const handleStatusChange = async (newStatus) => {
    setIsStatusUpdating(true);
    try {
      await onUpdateStatus(order.orderNumber, newStatus);
      setSelectedStatus(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsStatusUpdating(false);
    }
  };
  
  const handlePrintOrder = () => {
    window.print();
  };
  
  const handleSendEmail = () => {
    // In a real app, you would implement email sending here
    alert(`Email would be sent to ${order.customer.email}`);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
            <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrintOrder}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Print Order"
            >
              <FaPrint />
            </button>
            <button 
              onClick={handleSendEmail}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Email Customer"
            >
              <FaEnvelope />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Order Information */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Order Summary</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)} border`}>
                  {order.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date Placed</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Items</p>
                  <p className="font-medium">{order.items.length}</p>
                </div>
              </div>
            </div>
            
            {/* Order Items */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-md object-cover" 
                                src={item.image || 'https://via.placeholder.com/150'} 
                                alt={item.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Subtotal
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Shipping
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(order.shippingCost || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Tax
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(order.taxAmount || 0)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan="3" className="px-6 py-4 text-base font-semibold text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Order Notes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">Order Notes</h3>
                {isEditing ? (
                  <button 
                    onClick={handleSaveNotes}
                    className="text-sm flex items-center text-purple-600 hover:text-purple-800"
                  >
                    <FaCheck className="mr-1" /> Save
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sm flex items-center text-purple-600 hover:text-purple-800"
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  rows={4}
                  placeholder="Add notes about this order..."
                ></textarea>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg min-h-[100px] text-sm text-gray-700">
                  {notes || <span className="text-gray-400 italic">No notes for this order.</span>}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Customer</h3>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium mr-3">
                  {order.customer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">{order.customer.email}</p>
                </div>
              </div>
              <div className="text-sm">
                <p><span className="text-gray-500">Customer ID:</span> {order.customer.id}</p>
                <p><span className="text-gray-500">Phone:</span> {order.customer.phone || 'Not provided'}</p>
                <p className="mt-2 text-purple-600 hover:text-purple-800 flex items-center">
                  <FaExternalLinkAlt className="mr-1" />
                  <a href="#" className="text-sm">View Customer Profile</a>
                </p>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Shipping Details</h3>
              <div className="text-sm mb-4">
                <p className="font-medium">{order.shipping?.name || order.customer.name}</p>
                <p>{order.shipping?.address?.line1}</p>
                {order.shipping?.address?.line2 && <p>{order.shipping.address.line2}</p>}
                <p>{order.shipping?.address?.city}, {order.shipping?.address?.state} {order.shipping?.address?.postalCode}</p>
                <p>{order.shipping?.address?.country}</p>
                <p className="mt-2">
                  <span className="text-gray-500">Shipping Method:</span> {order.shipping?.method || 'Standard Shipping'}
                </p>
                {order.shipping?.trackingNumber && (
                  <p>
                    <span className="text-gray-500">Tracking:</span> {order.shipping.trackingNumber}
                  </p>
                )}
              </div>
              
              {order.status === 'Shipped' && order.shipping?.trackingNumber && (
                <a 
                  href="#" 
                  className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaShippingFast className="mr-1" />
                  Track Package
                </a>
              )}
            </div>
            
            {/* Order Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Update Order Status</h3>
              <div className="space-y-2">
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isStatusUpdating || status === selectedStatus}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                      status === selectedStatus
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Download Links */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Documents</h3>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Download Invoice
                </a>
                <a 
                  href="#" 
                  className="block py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Download Packing Slip
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 