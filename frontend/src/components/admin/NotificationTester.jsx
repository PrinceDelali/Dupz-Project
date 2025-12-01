import { useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { FaBell, FaCheckCircle, FaBox, FaShippingFast, FaTimesCircle } from 'react-icons/fa';

const NotificationTester = () => {
  const { addNotification } = useNotificationStore();
  const [status, setStatus] = useState('Processing');
  const [orderId, setOrderId] = useState('test-order-123');
  const [orderNumber, setOrderNumber] = useState('ORD-12345');

  const notificationTypes = [
    { value: 'Processing', label: 'Order Processing', icon: <FaBox className="text-blue-500" /> },
    { value: 'Shipped', label: 'Order Shipped', icon: <FaShippingFast className="text-purple-500" /> },
    { value: 'Delivered', label: 'Order Delivered', icon: <FaCheckCircle className="text-green-500" /> },
    { value: 'Cancelled', label: 'Order Cancelled', icon: <FaTimesCircle className="text-red-500" /> },
  ];

  // Map status to notification type
  const mapStatusToType = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'order_delivered';
      case 'processing':
        return 'order_processing';
      case 'shipped':
        return 'order_shipped';
      case 'cancelled':
        return 'order_cancelled';
      default:
        return 'order_status';
    }
  };

  // Get message for the notification
  const getMessage = (status, orderNumber) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return `Your order #${orderNumber} has been delivered! Thank you for shopping with us.`;
      case 'processing':
        return `Your order #${orderNumber} is now being processed and prepared for shipping.`;
      case 'shipped':
        return `Great news! Your order #${orderNumber} has been shipped and is on its way.`;
      case 'cancelled':
        return `Your order #${orderNumber} has been cancelled. Please contact customer support for more information.`;
      default:
        return `The status of your order #${orderNumber} has been updated to ${status}.`;
    }
  };

  const sendTestNotification = () => {
    // Create a mock order update notification
    const notification = {
      id: `order-${orderId}-${status.toLowerCase()}-${Date.now()}`,
      title: `Order ${status}`,
      message: getMessage(status, orderNumber),
      type: mapStatusToType(status),
      link: `/profile?tab=orders&order=${orderId}`,
      data: { orderId },
      timestamp: new Date().toISOString(),
    };

    // Add notification to store
    addNotification(notification);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Notification Tester</h2>
      <p className="text-sm text-gray-500 mb-4">
        Use this tool to test notifications. This will create a notification as if an order status was updated.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Number
          </label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g. ORD-12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order ID
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g. 635e68c70b5db143ffb765a"
          />
        </div>

        <button
          onClick={sendTestNotification}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Send Test Notification
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
        <div className="flex items-start p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex-shrink-0 mr-3">
            {notificationTypes.find(t => t.value === status)?.icon || <FaBell />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {`Order ${status}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getMessage(status, orderNumber)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTester; 