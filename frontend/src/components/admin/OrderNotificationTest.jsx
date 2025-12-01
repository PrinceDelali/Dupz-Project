import { useState, useEffect } from 'react';
import { FaPlay, FaStop, FaRedo, FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import SocketService from '../../services/SocketService';
import { useOrderStore } from '../../store/orderStore';
import { useNotificationStore } from '../../store/notificationStore';
import apiConfig from '../../config/apiConfig';
import SocketNotificationTester from './SocketNotificationTester';

/**
 * Component to test real-time order notifications
 * This helps debug socket connection issues and verify event handling
 */
const OrderNotificationTest = () => {
  // State
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [socketId, setSocketId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testType, setTestType] = useState('socket'); // 'socket' or 'api'
  const [testInProgress, setTestInProgress] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mockOrder, setMockOrder] = useState({
    orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    totalAmount: 150.00,
    status: 'Pending',
    items: [{ name: 'Test Product', price: 150.00, quantity: 1 }]
  });
  
  // Access order store
  const { addOrder, updateOrderStatus } = useOrderStore();
  
  // Access notification store
  const { addOrderStatusNotification } = useNotificationStore();

  // Add a log entry with timestamp
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      id: Date.now(),
      timestamp,
      message,
      type
    }, ...prev].slice(0, 30)); // Keep only the latest 30 logs
  };
  
  // Clear logs
  const clearLogs = () => setLogs([]);

  // Initialize socket connection
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      addLog('No userId found in localStorage. Socket connection requires authentication.', 'error');
      return;
    }
    
    // Debug existing socket connection
    const existingSocket = SocketService.getSocket();
    if (existingSocket) {
      addLog('Found existing socket connection', 'info');
      if (existingSocket.connected) {
        setSocketStatus('connected');
        setSocketId(existingSocket.id);
        addLog(`Connected with ID: ${existingSocket.id}`, 'success');
      } else {
        addLog('Existing socket is disconnected', 'warning');
      }
    }
    
    // Setup socket event handlers for this component
    const setupSocketListeners = (socket) => {
      if (!socket) return;
      
      // Listen for specific events relevant to this component
      socket.on('connect', () => {
        setSocketStatus('connected');
        setSocketId(socket.id);
        addLog(`Socket connected with ID: ${socket.id}`, 'success');
      });
      
      socket.on('disconnect', () => {
        setSocketStatus('disconnected');
        setSocketId(null);
        addLog('Socket disconnected', 'error');
      });
      
      socket.on('connect_error', (error) => {
        setSocketStatus('error');
        addLog(`Connection error: ${error.message}`, 'error');
      });
      
      socket.on('admin-registered', ({ success }) => {
        addLog(`Admin registration ${success ? 'successful' : 'failed'}`, success ? 'success' : 'error');
      });
      
      // Listen for order events
      socket.on('new-order', ({ order }) => {
        addLog(`New order received: ${order.orderNumber || order._id}`, 'success');
        console.log('🔔 [OrderNotificationTest] New order received via socket:', order);
      });
      
      socket.on('order-updated', ({ order }) => {
        addLog(`Order update received: ${order.orderNumber || order._id}`, 'info');
        console.log('🔄 [OrderNotificationTest] Order update received via socket:', order);
      });

      // Listen for status notification events
      socket.on('status-notification', (notification) => {
        addLog(`Status notification received: ${notification.title}`, 'success');
        console.log('🔔 [OrderNotificationTest] Status notification received:', notification);
      });
    };
    
    // Setup socket connection and listeners
    addLog('Initializing socket connection...', 'info');
    const socket = SocketService.initializeSocket(userId);
    if (socket) {
      setupSocketListeners(socket);
      
      // Register as admin
      socket.emit('register-admin', userId);
      addLog('Sent register-admin event', 'info');
      
      // Test emit to verify bidirectional communication
      setTimeout(() => {
        socket.emit('test-connection', { message: 'Hello from OrderNotificationTest' });
        addLog('Sent test message to server', 'info');
      }, 2000);
    } else {
      addLog('Failed to initialize socket', 'error');
    }
    
    // Setup event listeners for order updates that come from HTTP
    const handleOrderStatusUpdated = (event) => {
      if (event.detail && event.detail.order) {
        const { order } = event.detail;
        addLog(`Received order-status-updated event: ${order.orderNumber}`, 'info');
        console.log('🔔 [OrderNotificationTest] Received order-status-updated event:', order);
      }
    };
    
    window.addEventListener('order-status-updated', handleOrderStatusUpdated);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('order-status-updated', handleOrderStatusUpdated);
    };
  }, []);
  
  // Run a socket test
  const runSocketTest = () => {
    setTestInProgress(true);
    addLog('Starting socket notification test...', 'info');
    
    const socket = SocketService.getSocket();
    if (!socket || !socket.connected) {
      addLog('Socket not connected, cannot run test', 'error');
      setTestInProgress(false);
      return;
    }
    
    // Create test order with unique ID
    const testOrder = {
      ...mockOrder,
      _id: `test-${Date.now()}`,
      orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };
    
    addLog(`Emitting test order: ${testOrder.orderNumber}`, 'info');
    console.log('📤 [OrderNotificationTest] Sending test order:', testOrder);
    
    // Emit the order event
    socket.emit('new-order', { order: testOrder });
    
    // Also try adding to store directly
    try {
      addOrder(testOrder);
      addLog('Added test order to store directly', 'success');
    } catch (error) {
      addLog(`Failed to add to store: ${error.message}`, 'error');
      console.error('[OrderNotificationTest] Store error:', error);
    }
    
    // Try to trigger a notification
    try {
      addOrderStatusNotification(testOrder);
      addLog('Triggered notification for test order', 'success');
    } catch (error) {
      addLog(`Failed to trigger notification: ${error.message}`, 'error');
    }
    
    // Simulate order status update after 3 seconds
    setTimeout(() => {
      const updatedOrder = {
        ...testOrder,
        status: 'Processing',
        updatedAt: new Date().toISOString()
      };
      
      addLog(`Emitting order update: ${updatedOrder.orderNumber} → ${updatedOrder.status}`, 'info');
      
      // Emit regular order update
      socket.emit('order-updated', { order: updatedOrder });
      
      // Also emit status change event
      socket.emit('status-change', {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        previousStatus: mockOrder.status,
        newStatus: updatedOrder.status,
        timestamp: new Date().toISOString()
      });
      
      addLog('Emitted status-change event', 'info');
      
      // Update in store
      try {
        updateOrderStatus(updatedOrder._id, 'Processing');
        addLog('Updated order status in store', 'success');
      } catch (error) {
        addLog(`Failed to update store: ${error.message}`, 'error');
      }
      
      setTestInProgress(false);
    }, 3000);
  };
  
  // Run HTTP notification test
  const runHttpTest = () => {
    setTestInProgress(true);
    addLog('Starting HTTP notification test...', 'info');
    
    // Create custom event to simulate order update
    const testOrder = {
      ...mockOrder,
      _id: `http-test-${Date.now()}`,
      orderNumber: `HTTP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };
    
    // Dispatch custom event
    try {
      const event = new CustomEvent('order-status-updated', {
        detail: { order: testOrder }
      });
      
      addLog(`Dispatching custom event: ${testOrder.orderNumber}`, 'info');
      window.dispatchEvent(event);
      
      // Also try adding to store directly
      addOrder(testOrder);
      addLog('Added test order to store', 'success');
      
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
    
    // End test after delay
    setTimeout(() => {
      setTestInProgress(false);
    }, 3000);
  };
  
  // Toggle advanced view
  const toggleAdvancedView = () => {
    setShowAdvanced(prev => !prev);
  };

  // Test status change notification
  const testStatusChangeNotification = () => {
    setTestInProgress(true);
    addLog('Testing status change notification...', 'info');
    
    const socket = SocketService.getSocket();
    if (!socket || !socket.connected) {
      addLog('Socket not connected, cannot run test', 'error');
      setTestInProgress(false);
      return;
    }
    
    // Create test order with unique ID
    const testOrder = {
      ...mockOrder,
      _id: `status-test-${Date.now()}`,
      orderNumber: `STATUS-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };
    
    // Emit status change directly
    socket.emit('status-change', {
      orderId: testOrder._id,
      orderNumber: testOrder.orderNumber,
      previousStatus: 'Pending',
      newStatus: 'Processing',
      timestamp: new Date().toISOString()
    });
    
    addLog('Emitted status-change event', 'success');
    
    // End test after delay
    setTimeout(() => {
      setTestInProgress(false);
    }, 3000);
  };
  
  // Reconnect socket
  const reconnectSocket = () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      addLog('No userId found, cannot reconnect', 'error');
      return;
    }
    
    // First disconnect if already connected
    SocketService.disconnectSocket();
    addLog('Disconnected existing socket', 'info');
    
    // Allow socket to properly disconnect
    setTimeout(() => {
      addLog('Reconnecting socket...', 'info');
      const socket = SocketService.initializeSocket(userId);
      
      if (socket) {
        addLog('Socket reconnect requested', 'success');
      } else {
        addLog('Failed to reconnect socket', 'error');
      }
    }, 1000);
  };
  
  const getStatusClass = () => {
    switch (socketStatus) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'disconnected': return 'bg-red-100 text-red-800 border-red-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FaBell className="mr-2 text-purple-500" /> Order Notification Testing
        </h3>
        <div className={`px-2 py-1 text-xs rounded border ${getStatusClass()}`}>
          {socketStatus === 'connected' && <FaCheck className="inline-block mr-1" />}
          Socket: {socketStatus}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Simple Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTestType('socket')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${testType === 'socket' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Socket Test
          </button>
          
          <button
            onClick={() => setTestType('api')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${testType === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            HTTP Event Test
          </button>
          
          <button
            onClick={testType === 'socket' ? runSocketTest : runHttpTest}
            disabled={testInProgress}
            className="ml-auto px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {testInProgress ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <FaPlay className="mr-2" /> Run Test
              </>
            )}
          </button>
          
          <button
            onClick={testStatusChangeNotification}
            disabled={testInProgress}
            className="px-3 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaBell className="mr-2" /> Test Status Notification
          </button>
          
          <button
            onClick={reconnectSocket}
            className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600"
          >
            <FaRedo className="mr-2 inline-block" /> Reconnect
          </button>
          
          <button
            onClick={toggleAdvancedView}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 ml-auto md:ml-0"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
        
        {/* Advanced socket tester */}
        {showAdvanced && (
          <div className="mt-4 mb-4">
            <SocketNotificationTester />
          </div>
        )}
        
        {/* Log output */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Event Log</h4>
            <button
              onClick={clearLogs}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-3 py-1 border-b text-xs text-gray-500 flex justify-between">
              <span>Time</span>
              <span>Message</span>
            </div>
            <div className="h-40 overflow-y-auto p-2">
              {logs.length === 0 ? (
                <div className="text-center text-gray-400 py-4">No events yet</div>
              ) : (
                <ul>
                  {logs.map(log => (
                    <li key={log.id} className={`text-xs mb-1 pb-1 border-b border-gray-100 flex
                      ${log.type === 'error' ? 'text-red-600' : ''}
                      ${log.type === 'success' ? 'text-green-600' : ''}
                      ${log.type === 'warning' ? 'text-orange-600' : ''}
                      ${log.type === 'info' ? 'text-gray-600' : ''}
                    `}>
                      <span className="w-20 flex-shrink-0">{log.timestamp}</span>
                      <span className="flex-grow">{log.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderNotificationTest;