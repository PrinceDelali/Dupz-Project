import { useState, useEffect, useRef } from 'react';
import { Send, MinusCircle, X, ArrowLeft, CheckCheck } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

// Define Socket.io URL based on environment
const getSocketUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // Try to connect to local server
    return 'http://localhost:4000';
  }
  
  // For production, use window.location origin to ensure same-origin connection
  return `${window.location.protocol}//${window.location.host}`;
};

const AdminChatPanel = ({ onClose, className }) => {
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSessionList, setShowSessionList] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Get chat store methods and state
  const { 
    socket,
    setSocket,
    isConnected,
    setConnectionState,
    addMessage,
    sendMessage,
    markSessionAsRead,
    activeSessionId,
    setActiveSession
  } = useChatStore();
  
  // Get sessions data
  const sessions = useChatStore(state => state.getSortedSessions());
  const messages = useChatStore(state => 
    state.activeSessionId ? state.sessions[state.activeSessionId]?.messages || [] : []
  );
  const totalUnreadCount = useChatStore(state => state.getTotalUnreadCount());
  
  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // When switching to desktop view, always show the sessions list
      if (!mobile) {
        setShowSessionList(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Connect to Socket.io as admin
  useEffect(() => {
    // Connect to Socket.io server as admin
    connectSocket();
    
    // Clean up Socket.io connection on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  const connectSocket = () => {
    try {
      const socketUrl = getSocketUrl();
      console.log(`[ADMIN] Connecting to Socket.io server: ${socketUrl}`);
      
      // Create Socket.io instance with improved options
      const socket = io(socketUrl, {
        reconnectionAttempts: 10, // Increase reconnection attempts
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, // Cap the delay at 5 seconds
        timeout: 20000, // Increase connection timeout
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        upgrade: true, // Allow transport upgrade (polling -> websocket)
        forceNew: true, // Force a new connection
        query: {
          userType: 'admin',
          timestamp: Date.now() // Add timestamp to prevent caching
        }
      });
      
      // Store socket reference
      socketRef.current = socket;
      setSocket(socket);
      
      // Enhanced connection debugging
      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`[ADMIN] Socket.io reconnection attempt ${attempt}`);
      });

      socket.io.on("reconnect_error", (error) => {
        console.error("[ADMIN] Socket.io reconnection error:", error);
      });

      socket.io.on("reconnect_failed", () => {
        console.error("[ADMIN] Socket.io reconnection failed");
        setConnectionState(false, "Reconnection failed after multiple attempts");
      });
      
      socket.io.on("error", (error) => {
        console.error("[ADMIN] Socket.io transport error:", error);
      });
      
      // Connection established
      socket.on('connect', () => {
        console.log(`[ADMIN] Socket.io connected with ID: ${socket.id}, Transport: ${socket.io.engine.transport.name}`);
        setConnectionState(true, null);
        
        // Send admin init message
        socket.emit('init', {
                userType: 'admin',
          timestamp: new Date().toISOString(),
          clientInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        });
      });
      
      // Connection error with more details
      socket.on('connect_error', (error) => {
        console.error('[ADMIN] Socket.io connection error:', error);
        console.error('[ADMIN] Socket.io connection error message:', error.message);
        console.error('[ADMIN] Socket.io connection error description:', error.description);
        setConnectionState(false, `Connection error: ${error.message}`);
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('[ADMIN] Socket.io disconnected:', reason);
        setConnectionState(false);
      });
          
      // Message from customer
      socket.on('message', (data) => {
        try {
              // Handle messages from customers
              if (data.sender === 'customer' && data.sessionId) {
                const customerMessage = { 
                  id: data.messageId, 
                  text: data.content, 
                  sender: 'user',
                  time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: data.timestamp
                };
                
                // Add message to store
                addMessage(data.sessionId, customerMessage);
              }
        } catch (error) {
          console.error("[ADMIN] Error processing Socket.io message:", error);
        }
      });
      
      // New customer message notification
      socket.on('new_customer_message', (data) => {
        // This event is specifically for alerting admins of new messages
        console.log('[ADMIN] New customer message:', data);
        
        if (data.sessionId && data.message) {
          // Ensure the session exists
          const { sessions } = useChatStore.getState();
          if (!sessions[data.sessionId]) {
            useChatStore.getState().initSession(data.sessionId, {});
            console.log(`[ADMIN] Created new session for message: ${data.sessionId}`);
          }
          
          // Format the message for the store
          const customerMessage = { 
            id: data.message.messageId, 
            text: data.message.content, 
            sender: 'user',
            time: new Date(data.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: data.message.timestamp
          };
          
          // Add message to store
          useChatStore.getState().addMessage(data.sessionId, customerMessage);
        }
      });
      
      // Customer typing status
      socket.on('typing', (data) => {
              if (data.sessionId === activeSessionId) {
                setTyping(data.isTyping);
              }
      });
              
      // Sessions update
      socket.on('sessions_update', (data) => {
        console.log('[ADMIN] Received sessions update:', data);
        // Server sends list of active sessions
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(session => {
            // Initialize each session in the store
            useChatStore.getState().initSession(
              session.sessionId, 
              session.customerInfo || {}
            );
            
            // If session contains messages, add them to the store
            if (session.messages && session.messages.length > 0) {
              session.messages.forEach(msg => {
                const messageObj = {
                  id: msg.messageId || `imported-${Date.now()}-${Math.random()}`,
                  text: msg.content,
                  sender: msg.sender === 'admin' ? 'support' : 'user',
                  time: new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  timestamp: msg.timestamp,
                  sent: true
                };
                
                // Only add the message if it doesn't already exist
                const existingMessages = useChatStore.getState().sessions[session.sessionId]?.messages || [];
                const messageExists = existingMessages.some(m => m.id === messageObj.id);
                
                if (!messageExists) {
                  useChatStore.getState().addMessage(session.sessionId, messageObj);
        }
              });
            }
          });
        }
      });
      
      // Customer connected notification
      socket.on('customer_connected', (data) => {
        console.log('[ADMIN] Customer connected:', data);
        
        // Initialize session if it doesn't exist
        const { sessions } = useChatStore.getState();
        if (!sessions[data.sessionId]) {
          useChatStore.getState().initSession(data.sessionId, data.customerInfo || {});
          console.log(`[ADMIN] Created new session for connected customer: ${data.sessionId}`);
        }
        
        // Add status message to the chat
        const statusMessage = {
          id: `status-${Date.now()}`,
          text: 'Customer has connected',
          sender: 'system',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          isStatus: true
        };
        
        useChatStore.getState().addMessage(data.sessionId, statusMessage);
      });
      
      // Customer disconnected notification
      socket.on('customer_disconnected', (data) => {
        console.log('[ADMIN] Customer disconnected:', data);
        
        // Add status message to the chat if the session exists
        const { sessions } = useChatStore.getState();
        if (sessions[data.sessionId]) {
          const statusMessage = {
            id: `status-${Date.now()}`,
            text: 'Customer has disconnected',
            sender: 'system',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            isStatus: true
          };
          
          useChatStore.getState().addMessage(data.sessionId, statusMessage);
        }
      });
      
    } catch (error) {
      console.error("[ADMIN] Error connecting to Socket.io:", error);
      setConnectionState(false, error.message);
    }
  };
  
  // Handle session selection
  const handleSelectSession = (sessionId) => {
    console.log(`[ADMIN] Selecting session: ${sessionId}`);
    setActiveSession(sessionId);
    markSessionAsRead(sessionId);
    
    // Notify Socket.io server about selected session
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('select_session', {
        sessionId: sessionId
      });
    }
    
    // On mobile, hide the session list when a session is selected
    if (isMobile) {
      setShowSessionList(false);
      
      // Focus on input field after a short delay to allow component to render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };
  
  // Toggle session list visibility on mobile
  const toggleSessionList = () => {
    setShowSessionList(prev => !prev);
    
    // If showing session list on mobile, reset active session focus
    if (isMobile && !showSessionList && activeSessionId) {
      // Small delay to allow UI to update before attempting to focus
      setTimeout(() => {
        const sessionElement = document.getElementById(`session-${activeSessionId}`);
        if (sessionElement) {
          sessionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (activeSessionId && messages.length) {
      scrollToBottom();
    }
  }, [messages, activeSessionId]);
  
  // Mark messages as read when active session changes
  useEffect(() => {
    if (activeSessionId) {
      markSessionAsRead(activeSessionId);
    }
  }, [activeSessionId]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected || !activeSessionId) {
      return;
    }
    
    // Send message using the store's method for admin messages
    const success = sendMessage(activeSessionId, newMessage.trim(), 'admin_message');
    
    if (success) {
      // Clear input field after sending
      setNewMessage('');
      // Send typing = false
      sendTypingStatus(false);
    }
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (e.target.value.trim() && activeSessionId) {
      sendTypingStatus(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to send typing = false after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 3000);
    } else {
      // Send typing = false immediately when input is cleared
      sendTypingStatus(false);
    }
  };
  
  const sendTypingStatus = (isTyping) => {
    if (socketRef.current && socketRef.current.connected && activeSessionId) {
      socketRef.current.emit('typing', {
          sessionId: activeSessionId,
          isTyping,
        userType: 'admin',
          timestamp: new Date().toISOString()
      });
    }
  };
  
  const formatSessionTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, return time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, return month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // If older, return full date
    return date.toLocaleDateString();
  };

  // Calculate unread count for a specific session
  const getSessionUnreadCount = (sessionId) => {
    return useChatStore.getState().sessions[sessionId]?.unreadCount || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-lg shadow-xl w-full ${isMobile ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[80vh]'} flex overflow-hidden ${className || ''}`}
      >
        {/* Chat sessions sidebar */}
        <AnimatePresence mode="wait">
          {(!isMobile || (isMobile && showSessionList)) && (
            <motion.div 
              key="session-list"
              initial={isMobile ? { x: -300, opacity: 0 } : { opacity: 1 }}
              animate={isMobile ? { x: 0, opacity: 1 } : { opacity: 1 }}
              exit={isMobile ? { x: -300, opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`${isMobile ? 'w-full' : 'w-1/4'} bg-gray-50 border-r border-gray-200 flex flex-col ${isMobile ? 'absolute inset-0 z-10' : ''}`}
            >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Customer Chats</h3>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
              title="Close Chat Panel"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No active chat sessions</p>
              </div>
            ) : (
              sessions.map(session => {
                const lastMessage = session.messages[session.messages.length - 1];
                const unreadCount = session.unreadCount || 0;
                    
                    console.log(`[ADMIN] Rendering session: ${session.id}, Messages: ${session.messages.length}, Unread: ${unreadCount}`);
                
                return (
                  <div 
                    key={session.id}
                        id={`session-${session.id}`}
                    className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                      activeSessionId === session.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {session.customerInfo?.name || `Customer ${session.id.substring(0, 8)}...`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatSessionTime(session.lastActive)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {lastMessage?.text || 'No messages yet'}
                    </div>
                    
                    {unreadCount > 0 && (
                      <div className="flex justify-end">
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                          {unreadCount} new
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 bg-gray-100 border-t border-gray-200 text-sm">
            <div className="flex justify-between items-center">
              <span>{sessions.length} Active Sessions</span>
              <span>{totalUnreadCount > 0 ? `${totalUnreadCount} Unread` : 'All Read'}</span>
            </div>
            
            <div className={`mt-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected - Trying to reconnect...'}
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Chat window */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`chat-view-${showSessionList ? 'hidden' : 'visible'}`}
            initial={isMobile ? { x: 300, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`${isMobile ? (showSessionList ? 'hidden' : 'w-full') : 'w-3/4'} flex flex-col relative`}
          >
          {activeSessionId ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                    {isMobile && (
                  <button 
                        className="mr-3 p-2 rounded-full hover:bg-gray-100"
                        onClick={toggleSessionList}
                  >
                    <ArrowLeft size={18} />
                  </button>
                    )}
                  
                  <div>
                    <h3 className="font-semibold">
                      {useChatStore.getState().sessions[activeSessionId]?.customerInfo?.name || 
                       `Customer ${activeSessionId.substring(0, 12)}...`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Session ID: {activeSessionId.substring(0, 12)}...
                    </p>
                  </div>
                </div>
                  
                  {isMobile && (
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={onClose}
                    >
                      <X size={18} />
                    </button>
                  )}
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="text-gray-500">
                      <p className="mb-1">No messages in this conversation yet.</p>
                      <p className="text-sm">Send a message to start the conversation.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                        className={`mb-4 flex ${
                          message.sender === 'support' 
                            ? 'justify-end' 
                            : message.sender === 'system' 
                              ? 'justify-center' 
                              : 'justify-start'
                        }`}
                    >
                        {message.sender === 'system' ? (
                          <div className="bg-gray-100 text-gray-600 text-xs py-1 px-3 rounded-full">
                            {message.text}
                          </div>
                        ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.sender === 'support' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <div className="text-sm">{message.text}</div>
                        <div className="text-xs mt-1 opacity-70 flex justify-end items-center">
                          {message.time}
                          {message.sender === 'support' && <CheckCheck className="w-3 h-3 ml-1" />}
                        </div>
                      </motion.div>
                        )}
                    </div>
                  ))
                )}
                
                {typing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="bg-gray-200 rounded-2xl rounded-tl-none px-4 py-2">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={isConnected ? "Type a message..." : "Reconnecting to chat..."}
                    className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={!isConnected || !activeSessionId}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-r-lg ${
                      newMessage.trim() && isConnected && activeSessionId ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                    disabled={!newMessage.trim() || !isConnected || !activeSessionId}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="mb-4">
                <MessageIcon className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a Chat to Start Messaging
              </h3>
              <p className="text-gray-500 max-w-md">
                  {isMobile ? 
                    "Browse customer conversations and select one to start messaging." :
                    "Choose a customer conversation from the sidebar to view and respond to messages."}
              </p>
                {isMobile && !showSessionList && (
                  <button
                    onClick={toggleSessionList}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md"
                  >
                    View Conversations
                  </button>
                )}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Message icon for empty state
const MessageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

export default AdminChatPanel; 