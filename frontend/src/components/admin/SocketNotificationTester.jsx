import { useState } from 'react';
import { FaBell, FaPlay, FaStop, FaBug } from 'react-icons/fa';
import SocketDiagnostic from '../../services/socket-diagnostic';
import SocketService from '../../services/SocketService';
import { useNotificationStore } from '../../store/notificationStore';

/**
 * Socket Notification Tester Component
 * Used in development to test WebSocket notifications 
 */
const SocketNotificationTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);
  const [logs, setLogs] = useState([]);
  const { addNotification } = useNotificationStore();
  
  // Start the diagnostic
  const handleStartDiagnostic = () => {
    try {
      // Log message
      addLog('🔄 Starting socket diagnostic...');
      
      // Create diagnostic instance
      const socketDiagnostic = new SocketDiagnostic();
      setDiagnostic(socketDiagnostic);
      
      // Override console.log for the duration of the test
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        // Call original console.log
        originalConsoleLog(...args);
        
        // Add to our logs
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');
        addLog(message);
      };
      
      // Start diagnostic
      socketDiagnostic.start();
      setIsRunning(true);
      
      // Restore console.log after 30 seconds
      setTimeout(() => {
        console.log = originalConsoleLog;
      }, 30000);
    } catch (err) {
      console.error('Error starting diagnostic:', err);
      addLog(`❌ Error: ${err.message}`);
    }
  };
  
  // Stop the diagnostic
  const handleStopDiagnostic = () => {
    if (diagnostic) {
      diagnostic.stop();
      addLog('👋 Stopped socket diagnostic');
    }
    setIsRunning(false);
    setDiagnostic(null);
  };
  
  // Send a manual test notification
  const handleSendTestNotification = () => {
    try {
      addLog('📤 Sending manual test notification...');
      
      // Create a test order
      const testOrder = {
        _id: `manual-test-${Date.now()}`,
        orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'Test Customer',
        status: 'Processing',
        previousStatus: 'Pending',
        createdAt: new Date().toISOString()
      };
      
      // Use the socket service directly
      const socket = SocketService.getSocket();
      
      if (!socket) {
        addLog('❌ Socket not connected');
        
        // Try to create a notification directly
        addNotification({
          id: `manual-test-${Date.now()}`,
          title: 'Test Notification (Local)',
          message: 'This is a manual test notification created directly (no socket)',
          type: 'order_processing',
          timestamp: new Date().toISOString()
        });
        
        return;
      }
      
      // Emit a status change event
      socket.emit('status-change', {
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        previousStatus: 'Pending',
        newStatus: 'Processing',
        timestamp: new Date().toISOString()
      });
      
      addLog(`✅ Test notification sent for order ${testOrder.orderNumber}`);
    } catch (err) {
      console.error('Error sending test notification:', err);
      addLog(`❌ Error: ${err.message}`);
    }
  };
  
  // Add a log message
  const addLog = (message) => {
    setLogs(prev => {
      // Keep only the most recent 100 logs
      const newLogs = [...prev, { id: Date.now(), message }];
      if (newLogs.length > 100) {
        return newLogs.slice(newLogs.length - 100);
      }
      return newLogs;
    });
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('📋 Logs cleared');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FaBell className="mr-2 text-purple-500" /> 
          Socket Notification Tester
        </h3>
        <div className="flex space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStartDiagnostic}
              className="bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 text-sm flex items-center"
            >
              <FaPlay className="mr-1" /> Start Diagnostic
            </button>
          ) : (
            <button
              onClick={handleStopDiagnostic}
              className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 text-sm flex items-center"
            >
              <FaStop className="mr-1" /> Stop
            </button>
          )}
          
          <button
            onClick={handleSendTestNotification}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 text-sm flex items-center"
          >
            <FaBug className="mr-1" /> Send Test
          </button>
          
          <button
            onClick={clearLogs}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 text-sm"
          >
            Clear Logs
          </button>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-3 py-1 border-b text-xs text-gray-500">
          Diagnostic Logs
        </div>
        <div className="bg-gray-900 text-green-400 font-mono text-xs p-2 overflow-auto h-48">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Start the diagnostic to see output here.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-1">
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Note: Watch the browser console for more detailed logs. This tool helps test WebSocket notifications.
      </p>
    </div>
  );
};

export default SocketNotificationTester; 