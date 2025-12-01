import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Package,
  Truck,
  CreditCard,
  FileText,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useOrderStore } from '../store/orderStore';

/**
 * A reusable modal component for displaying detailed order information
 * 
 * @param {Object} props
 * @param {Object} props.orderDetails - The order details object containing all order information
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onViewReceipt - Function to call when the "View Receipt" button is clicked
 * @param {Function} props.onContinueShopping - Function to call when "Continue Shopping" button is clicked
 * @param {boolean} props.isOpen - Whether the modal is open
 * @returns {JSX.Element|null}
 */
const OrderDetailsModal = ({
  orderDetails,
  isOpen,
  onClose,
  onViewReceipt,
  onContinueShopping,
}) => {
  const [activeTab, setActiveTab] = useState('items');
  const navigate = useNavigate();
  const orderStore = useOrderStore();
  const orderInfo = orderDetails || orderStore.orderInfo;
  
  if (!isOpen) return null;
  
  const formatCurrency = (amount) => {
    // Handle various input formats and prevent NaN
    if (amount === undefined || amount === null) return '$0.00';
    
    // If it's already a formatted string with a currency symbol, return it
    if (typeof amount === 'string' && (amount.trim().startsWith('$') || amount.trim().startsWith('€'))) {
      return amount;
    }
    
    // Try to convert to a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    
    // Check if conversion resulted in a valid number
    if (isNaN(numericAmount)) return '$0.00';
    
    // Format the number as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericAmount);
  };

  const handleTrackOrder = () => {
    // Close the modal first
    onClose();
    
    // Navigate to track order page with tracking info
    navigate(`/track-order/${orderInfo.trackingNumber || orderInfo.orderNumber}`, {
      state: {
        orderInfo: {
          id: orderInfo.id || orderInfo.receiptId || orderInfo.orderNumber,
          orderNumber: orderInfo.orderNumber || orderInfo.id,
          trackingNumber: orderInfo.trackingNumber,
          date: orderInfo.date || new Date().toISOString(),
          orderDate: orderInfo.formattedOrderDate || orderInfo.orderDate || new Date().toLocaleDateString(),
          formattedOrderDate: orderInfo.formattedOrderDate || orderInfo.orderDate,
          status: orderInfo.status || 'processing',
          shippingMethod: orderInfo.shippingMethod || 'Standard Shipping',
          estimatedDelivery: orderInfo.estimatedDelivery || 'Not available',
          items: orderInfo.items || [],
          shippingAddress: orderInfo.shippingAddress || {}
        }
      }
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Simplified */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-medium text-gray-900">Order #{orderInfo.id || orderInfo.receiptId}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Order Meta - More compact */}
        <div className="px-4 py-3 bg-gray-50 text-sm grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{orderInfo.formattedOrderDate || orderInfo.orderDate}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {orderInfo.status || 'Processing'}
            </span>
          </div>
          <div>
            <p className="text-gray-500">Tracking</p>
            <p className="font-medium truncate">{orderInfo.trackingNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Delivery</p>
            <p className="font-medium">{orderInfo.estimatedDelivery || 'N/A'}</p>
          </div>
        </div>
        
        {/* Tabs - More minimal */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'items' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('items')}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Package size={14} />
              Items
            </span>
          </button>
          <button
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'shipping' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('shipping')}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Truck size={14} />
              Shipping
            </span>
          </button>
          <button
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'payment' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            <span className="flex items-center justify-center gap-1.5">
              <CreditCard size={14} />
              Payment
            </span>
          </button>
        </div>
        
        {/* Tab Content - scrollable area with cleaner design */}
        <div className="flex-1 overflow-y-auto">
          {/* Items Tab - More minimal */}
          {activeTab === 'items' && (
            <div className="p-4">
              {/* Order Items */}
              <div className="space-y-4">
                {orderInfo.items && orderInfo.items.length > 0 ? (
                  orderInfo.items.map((item, index) => {
                    // Safely extract price and quantity with fallbacks
                    const price = item.price !== undefined ? item.price : 0;
                    const quantity = item.quantity !== undefined ? item.quantity : 1;
                    
                    return (
                      <div key={index} className={`flex gap-3 ${index !== 0 ? 'pt-4 border-t' : ''}`}>
                        <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                            <p className="text-sm font-medium text-gray-900 ml-2">{formatCurrency(price * quantity)}</p>
                          </div>
                          {(item.color || item.size) && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {item.color && `Color: ${item.color}`} 
                              {item.size && item.color && ' | '} 
                              {item.size && `Size: ${item.size}`}
                            </p>
                          )}
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <p>Qty {quantity}</p>
                            <p>{formatCurrency(price)} each</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No items found</p>
                  </div>
                )}
              </div>
              
              {/* Order Summary - Cleaner design */}
              <div className="mt-6 space-y-1.5 pt-3 border-t text-sm">
                <div className="flex justify-between">
                  <p className="text-gray-500">Subtotal</p>
                  <p>{formatCurrency(orderInfo.subtotal || parseFloat(orderInfo.amount) || 0)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-500">Shipping</p>
                  <p>{orderInfo.shipping === 0 ? 'Free' : formatCurrency(orderInfo.shipping || 0)}</p>
                </div>
                {(orderInfo.tax !== undefined && orderInfo.tax !== null) && (
                  <div className="flex justify-between">
                    <p className="text-gray-500">Tax</p>
                    <p>{formatCurrency(orderInfo.tax || 0)}</p>
                  </div>
                )}
                {(orderInfo.discount !== undefined && orderInfo.discount > 0) && (
                  <div className="flex justify-between text-green-600">
                    <p>Discount</p>
                    <p>-{formatCurrency(orderInfo.discount)}</p>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1.5 mt-1.5 border-t">
                  <p>Total</p>
                  <p>{formatCurrency(
                    (orderInfo.subtotal || parseFloat(orderInfo.amount) || 0) + 
                    (orderInfo.shipping || 0) + 
                    (orderInfo.tax || 0) - 
                    (orderInfo.discount || 0)
                  )}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Shipping Tab - More minimal */}
          {activeTab === 'shipping' && (
            <div className="p-4 space-y-5">
              {/* Shipping Method - Simplified */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                  <Truck size={15} className="text-gray-500" />
                  Shipping Method
                </h4>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                  <p>{orderInfo.shippingMethod || 'Standard Shipping'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated delivery: {orderInfo.estimatedDelivery || 'Not available'}
                  </p>
                </div>
              </div>
              
              {/* Shipping Address - Cleaner */}
              {orderInfo.shippingAddress && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                    <address className="not-italic">
                      <p>{orderInfo.shippingAddress.name || 'Not provided'}</p>
                      <p>{orderInfo.shippingAddress.street || 'Address not provided'}</p>
                      <p>
                        {orderInfo.shippingAddress.city || 'City'}, {orderInfo.shippingAddress.state || 'State'} {orderInfo.shippingAddress.zip || 'Zip'}
                      </p>
                      <p>{orderInfo.shippingAddress.country || 'Country'}</p>
                      {orderInfo.shippingAddress.phone && (
                        <p className="mt-1 text-xs text-gray-600">{orderInfo.shippingAddress.phone}</p>
                      )}
                    </address>
                  </div>
                </div>
              )}
              
              {/* Tracking Info - Simplified */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tracking Information</h4>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                  <p>Tracking Number: {orderInfo.trackingNumber || 'Not available yet'}</p>
                  {orderInfo.trackingNumber && (
                    <button 
                      className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 transition-colors"
                      onClick={handleTrackOrder}
                    >
                      Track Order <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Tab - More minimal */}
          {activeTab === 'payment' && (
            <div className="p-4 space-y-5">
              {/* Payment Method - Simplified */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-gray-500" />
                  Payment Method
                </h4>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                  <p>{orderInfo.paymentMethod || 'Credit Card'}</p>
                  {orderInfo.cardDetails && (
                    <p className="text-xs text-gray-500 mt-1">
                      {orderInfo.cardDetails.brand || 'Card'} ending in {orderInfo.cardDetails.last4 || '****'}
                    </p>
                  )}
                  {orderInfo.transactionId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Transaction ID: {orderInfo.transactionId}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Billing Address - Cleaner */}
              {orderInfo.billingAddress && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Billing Address</h4>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                    <address className="not-italic">
                      <p>{orderInfo.billingAddress.name || 'Not provided'}</p>
                      <p>{orderInfo.billingAddress.street || 'Address not provided'}</p>
                      <p>
                        {orderInfo.billingAddress.city || 'City'}, {orderInfo.billingAddress.state || 'State'} {orderInfo.billingAddress.zip || 'Zip'}
                      </p>
                      <p>{orderInfo.billingAddress.country || 'Country'}</p>
                    </address>
                  </div>
                </div>
              )}
              
              {/* Receipt - Simplified */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Receipt</h4>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                  <p>Receipt ID: {orderInfo.receiptId || orderInfo.id}</p>
                  <button 
                    onClick={onViewReceipt}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    View Receipt <FileText size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal Footer - More minimal with responsive layout */}
        <div className="border-t p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
          <button
            onClick={onClose}
            className="order-2 sm:order-1 px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={onContinueShopping}
            className="order-1 sm:order-2 px-4 py-1.5 bg-blue-600 rounded-md text-white hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag size={14} />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 