import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  CheckCheck, 
  ChevronDown,
  PlusCircle,
  Image as ImageIcon,
  Smile,
  File,
  X as XIcon,
  Upload,
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import io from 'socket.io-client';

// Define Socket.io URL based on environment
const getSocketUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // Try to connect to local dedicated chat server
    return 'http://localhost:4000';
  }
  
  // For production, use the host's chat server endpoint
  // This assumes we deploy the chat server under /chat-server path
  return `${window.location.protocol}//${window.location.host}/chat-server`;
};

// Dedicated function to handle reconnection
const createSocketConnection = (sessionId, user, isAuthenticated) => {
  try {
    const socketUrl = getSocketUrl();
    console.log(`Connecting to Socket.io server: ${socketUrl}`);
    
    // Create Socket.io instance with improved options
    const socket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: true,
      query: {
        sessionId,
        userType: 'customer',
        timestamp: Date.now(),
        // Include user info if authenticated
        ...(isAuthenticated && user ? {
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email
        } : {})
      }
    });
    
    // Add event listeners for reconnection - outside of the component for cleaner code
    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Socket.io reconnection attempt ${attempt}`);
    });

    socket.io.on("reconnect_error", (error) => {
      console.error("Socket.io reconnection error:", error);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("Socket.io reconnection failed");
    });
    
    socket.io.on("error", (error) => {
      console.error("Socket.io transport error:", error);
    });
    
    // Debug all events in development
    if (process.env.NODE_ENV === 'development') {
      socket.onAny((event, ...args) => {
        if (event !== 'heartbeat') { // Skip logging heartbeats
          console.log(`[SOCKET EVENT] ${event}:`, args);
        }
      });
    }
    
    return socket;
  } catch (error) {
    console.error("Error creating Socket.io connection:", error);
    return null;
  }
};

const CustomerSupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileUploadProgress, setFileUploadProgress] = useState({});
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimerRef = useRef(null);
  
  // Get user data from auth store
  const { user, isAuthenticated } = useAuthStore();
  
  // Get chat store methods and state
  const { 
    socket,
    setSocket,
    isConnected,
    setConnectionState,
    initSession,
    addMessage,
    sendMessage,
    markSessionAsRead
  } = useChatStore();
  
  // Get session-specific data
  const sessionId = useChatStore(state => state.activeSessionId);
  const sessions = useChatStore(state => state.sessions);
  const messages = useChatStore(state => 
    state.activeSessionId ? state.sessions[state.activeSessionId]?.messages || [] : []
  );
  const unread = useChatStore(state => {
    return state.activeSessionId ? state.sessions[state.activeSessionId]?.unreadCount || 0 : 0;
  });
  
  // Set up customer session ID and Socket.io connection
  useEffect(() => {
    // Generate or retrieve session ID, now using user ID if authenticated
    let sid = localStorage.getItem('sinosply_chat_session');
    if (!sid || (isAuthenticated && user && !sid.includes(user._id))) {
      // Create a new session ID, incorporating user ID if authenticated
      if (isAuthenticated && user) {
        sid = `customer-${user._id}-${Date.now()}`;
      } else {
      sid = 'customer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      localStorage.setItem('sinosply_chat_session', sid);
    }
    
    // Initialize session in store
    initSession(sid, isAuthenticated && user ? {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      userId: user._id,
      isAuthenticated: true
    } : {
      name: 'Guest Customer',
      isAuthenticated: false
    });
    
    useChatStore.setState({ activeSessionId: sid });
    
    // Connect to Socket.io server
    connectSocket(sid);
    
    // Clean up Socket.io connection on component unmount
    return () => {
      cleanupConnection();
    };
  }, [isAuthenticated, user]);
  
  // Separate function to clean up the connection
  const cleanupConnection = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
  };
  
  // Connect to the socket server
  const connectSocket = (sid) => {
    try {
      // Clean up existing connections first
      cleanupConnection();
      
      // Create new socket connection
      const socket = createSocketConnection(sid, user, isAuthenticated);
      
      if (!socket) {
        setConnectionState(false, "Failed to create socket connection");
        scheduleReconnect(sid);
        return;
      }
      
      // Store socket reference
      socketRef.current = socket;
      setSocket(socket);
      
      // Connection established
      socket.on('connect', () => {
        console.log(`Socket.io connected with ID: ${socket.id}, Transport: ${socket.io.engine.transport.name}`);
        setConnectionState(true, null);
        setReconnecting(false);
        
              // Send an initial message to identify this client
        socket.emit('init', {
                sessionId: sid,
                userType: 'customer',
          timestamp: new Date().toISOString(),
          clientInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
          // Include user data if authenticated
          userData: isAuthenticated && user ? {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            isAuthenticated: true
          } : {
            isAuthenticated: false
          }
        });
              
              // Send any pending messages from the store
        sendPendingMessages(sid);
      });
      
      // Connection error with more details
      socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error.message);
        setConnectionState(false, `Connection error: ${error.message}`);
        scheduleReconnect(sid);
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        setConnectionState(false);
        
        // Attempt to reconnect if not closing
        if (reason !== 'io client disconnect') {
          scheduleReconnect(sid);
          }
      });
      
      // Heartbeat check from server
      socket.on('heartbeat', (data) => {
        // Respond to server heartbeat to keep connection alive
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
      });
      
      // Message from server
      socket.on('message', (data) => {
        try {
          console.log('Received Socket.io message:', data);
          
          // Process messages from admin
              if (data.sender === 'admin') {
            const newAdminMessage = { 
              id: data.messageId, 
              text: data.content, 
              sender: 'support',
              time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: data.timestamp,
              read: isOpen && !minimized,
              fileType: data.fileType,
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize
            };
            
                addMessage(sid, newAdminMessage);
              }
        } catch (error) {
          console.error("Error processing Socket.io message:", error);
        }
      });
      
      // Typing indicator
      socket.on('typing', (data) => {
        if (data.userType === 'admin') {
              setTyping(data.isTyping);
        }
      });
      
      // Message history
      socket.on('history', (data) => {
        try {
              if (Array.isArray(data.messages)) {
                // Reset current messages and add history
                const historyMessages = data.messages.map(msg => ({
                  id: msg.messageId,
                  text: msg.content, 
                  sender: msg.sender === 'admin' ? 'support' : 'user',
                  time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: msg.timestamp,
              read: true,
              fileType: msg.fileType,
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileSize: msg.fileSize
                }));
                
                // Update session with history
                useChatStore.setState(state => ({
                  sessions: {
                    ...state.sessions,
                    [sid]: {
                      ...state.sessions[sid],
                      messages: historyMessages,
                    }
                  }
                }));
          }
        } catch (error) {
          console.error("Error processing history:", error);
        }
      });

      // File upload progress
      socket.on('upload_progress', (data) => {
        if (data.messageId && data.progress) {
          setFileUploadProgress(prev => ({
            ...prev,
            [data.messageId]: Math.min(data.progress, 100)
          }));
        }
      });

      // File upload complete
      socket.on('upload_complete', (data) => {
        if (data.messageId) {
          setFileUploadProgress(prev => ({
            ...prev,
            [data.messageId]: 100
          }));

          // Update the message in store with file URL
          if (data.fileUrl) {
            useChatStore.setState(state => {
              const updatedSessions = { ...state.sessions };
              const session = updatedSessions[sid];
              
              if (session) {
                const updatedMessages = session.messages.map(msg => 
                  msg.id === data.messageId 
                    ? { 
                        ...msg, 
                        fileUrl: data.fileUrl,
                        status: 'delivered' 
                      } 
                    : msg
                );
                
                updatedSessions[sid] = {
                  ...session,
                  messages: updatedMessages
                };
              }
              
              return { sessions: updatedSessions };
            });
          }
        }
      });

      // File upload error
      socket.on('upload_error', (data) => {
        console.error("File upload error:", data);
        setUploadError(data.error || "Failed to upload file");
        
        // Remove upload progress
        if (data.messageId) {
          setFileUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[data.messageId];
            return updated;
          });
        }
      });
      
      // Error from server
      socket.on('error', (data) => {
        console.error("Server error:", data);
        if (data.type === 'upload_error') {
          setUploadError(data.message || "File upload error");
        }
      });
      
    } catch (error) {
      console.error("Error connecting to Socket.io:", error);
      setConnectionState(false, error.message);
      scheduleReconnect(sid);
    }
  };
  
  // Schedule reconnect attempt
  const scheduleReconnect = (sid) => {
    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    setReconnecting(true);
    
    // Try to reconnect after a short delay
    reconnectTimerRef.current = setTimeout(() => {
      console.log("Attempting to reconnect...");
      connectSocket(sid);
    }, 3000);
  };
  
  // Send any unsent messages from the store
  const sendPendingMessages = (sid) => {
    const pendingMessages = sessions[sid]?.messages || [];
    if (pendingMessages.length > 0 && socketRef.current && socketRef.current.connected) {
      pendingMessages.forEach(msg => {
        if (msg.sender === 'user' && !msg.sent) {
          socketRef.current.emit('message', {
            messageId: msg.id,
            sessionId: sid,
            content: msg.text,
            sender: 'customer',
            timestamp: msg.timestamp || new Date().toISOString(),
            fileType: msg.fileType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize
          });
          
          // Update sent status in the store
          useChatStore.setState(state => {
            const updatedSessions = { ...state.sessions };
            const updatedMessages = updatedSessions[sid].messages.map(m => 
              m.id === msg.id ? { ...m, sent: true } : m
            );
            
            updatedSessions[sid] = {
              ...updatedSessions[sid],
              messages: updatedMessages
            };
            
            return { sessions: updatedSessions };
          });
        }
      });
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check file size limit (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setUploadError(`File size exceeds limit (10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      
      // Filter out oversized files
      const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);
      setSelectedFiles(validFiles);
    } else {
      setSelectedFiles(files);
      setUploadError(null);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Close attachment menu
    setShowAttachmentMenu(false);
  };

  // Trigger file input click
  const handleAttachFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return <ImageIcon className="w-4 h-4" />;
    }
    
    // PDF files
    if (extension === 'pdf') {
      return <FileText className="w-4 h-4" />;
    }
    
    // Default file icon
    return <File className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Upload files
  const uploadFiles = async () => {
    if (!socketRef.current || !socketRef.current.connected || !sessionId || selectedFiles.length === 0) {
      return;
    }

    for (const file of selectedFiles) {
      // Create a message ID
      const messageId = `customer-file-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      // Get file type
      const extension = file.name.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
      const fileType = isImage ? 'image' : 'file';
      
      // Create a message
      const messageObj = {
        id: messageId,
        text: isImage ? 'Sent an image' : `Sent a file: ${file.name}`,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        sent: false,
        fileType,
        fileName: file.name,
        fileSize: file.size,
        fileData: null  // Will be populated after upload
      };
      
      // Add message to store
      addMessage(sessionId, messageObj);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        
        // Send file via Socket.io
        socketRef.current.emit('upload_file', {
          messageId,
          sessionId,
          fileName: file.name,
          fileType,
          fileSize: file.size,
          fileData: base64Data,
          timestamp: new Date().toISOString()
        });
        
        // Initialize progress
        setFileUploadProgress(prev => ({
          ...prev,
          [messageId]: 0
        }));
      };
      
      reader.readAsDataURL(file);
    }
    
    // Clear selected files
    setSelectedFiles([]);
  };
        
  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && !minimized && sessionId && unread > 0) {
      markSessionAsRead(sessionId);
    }
  }, [isOpen, minimized, sessionId, unread]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !minimized && messages?.length) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark messages as read when opening chat
      if (sessionId) {
        markSessionAsRead(sessionId);
      }
    } else if (minimized) {
      setMinimized(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    // If there are selected files, upload them
    if (selectedFiles.length > 0) {
      uploadFiles();
      return;
    }
    
    if (!newMessage.trim() || !isConnected) {
      return;
    }
    
    // Generate a message ID
    const messageId = `customer-msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    
    // Create the message object
    const messageObj = {
      id: messageId, 
      text: newMessage.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      sent: false // Will be updated when confirmed
    };
    
    // Add message to store
    addMessage(sessionId, messageObj);
    
    // Try to send via Socket.io
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message', {
      messageId: messageId,
      sessionId: sessionId,
        content: newMessage.trim(),
      sender: 'customer',
      timestamp: new Date().toISOString()
      });
        
        // Update sent status
        useChatStore.setState(state => {
          const updatedSessions = { ...state.sessions };
          const updatedMessages = updatedSessions[sessionId].messages.map(msg => 
            msg.id === messageId ? { ...msg, sent: true } : msg
          );
          
          updatedSessions[sessionId] = {
            ...updatedSessions[sessionId],
            messages: updatedMessages
          };
          
          return { sessions: updatedSessions };
        });
    }
    
    // Clear input field
    setNewMessage('');
    
    // Send typing = false
    sendTypingStatus(false);
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (e.target.value.trim()) {
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
    if (socketRef.current && socketRef.current.connected && sessionId) {
      socketRef.current.emit('typing', {
          sessionId: sessionId,
          isTyping,
          userType: 'customer',
          timestamp: new Date().toISOString()
      });
    }
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setMinimized(!minimized);
    
    if (!minimized && sessionId) {
      markSessionAsRead(sessionId);
    }
  };

  // Toggle attachment menu
  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    if (message.fileType === 'image' && message.fileUrl) {
      // Render image
      return (
        <div className="mb-1">
          <img 
            src={message.fileUrl} 
            alt={message.fileName || "Image"}
            className="max-w-full rounded-lg max-h-48 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
            }}
          />
          {message.fileName && (
            <div className="text-xs mt-1 opacity-70 flex items-center">
              <span>{message.fileName}</span>
              {message.fileSize && (
                <span className="ml-1">({formatFileSize(message.fileSize)})</span>
              )}
            </div>
          )}
        </div>
      );
    } else if (message.fileType === 'file' && message.fileUrl) {
      // Render file
      return (
        <div className="mb-1">
          <a 
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-2 rounded bg-black/5 hover:bg-black/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mr-2">
              {getFileIcon(message.fileName || 'file.txt')}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{message.fileName}</div>
              {message.fileSize && (
                <div className="text-xs opacity-70">{formatFileSize(message.fileSize)}</div>
              )}
            </div>
            <div className="ml-2">
              <Download className="w-4 h-4 opacity-70" />
            </div>
          </a>
        </div>
      );
    } else if (fileUploadProgress[message.id] !== undefined && fileUploadProgress[message.id] < 100) {
      // Render upload progress
      return (
        <div className="mb-1">
          <div className="flex items-center p-2 rounded bg-black/5">
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mr-2">
              <Upload className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{message.fileName}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${fileUploadProgress[message.id]}%` }}
                ></div>
              </div>
              <div className="text-xs mt-0.5 opacity-70">
                {fileUploadProgress[message.id]}% • Uploading...
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default to text message
    return <div className="text-sm">{message.text}</div>;
  };

  // Chat container variants for animations
  const chatContainerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.9,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating chat button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="bg-black text-white p-4 rounded-full shadow-lg flex items-center justify-center relative"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={chatContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-20 right-0 w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '600px' }}
          >
            {/* Chat header */}
            <div className="bg-black text-white p-3 flex items-center justify-between cursor-pointer" onClick={toggleMinimize}>
              <div className="flex items-center">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mr-3">
                  <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => e.target.src = 'https://via.placeholder.com/30?text=S'} />
                </div>
                <div>
                  <h3 className="font-semibold">Sinosply Support</h3>
                  <div className="flex items-center text-xs">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>{isConnected ? 'Online' : 'Reconnecting...'}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${minimized ? 'rotate-180' : ''}`} />
            </div>

            {/* Chat body */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-80 overflow-y-auto p-4 bg-gray-50" onClick={() => inputRef.current?.focus()}>
                    {/* Display welcome message if no messages */}
                    {messages.length === 0 && (
                      <div className="mb-4 flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
                          <div className="text-sm">Hello! Welcome to Sinosply. How can we assist you today?</div>
                          <div className="text-xs mt-1 opacity-70 flex justify-end items-center">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.sender === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'
                          }`}
                        >
                          {renderMessageContent(message)}
                          <div className="text-xs mt-1 opacity-70 flex justify-end items-center">
                            {message.time}
                            {message.sender === 'user' && <CheckCheck className={`w-3 h-3 ml-1 ${message.sent ? 'text-blue-400' : 'text-gray-400'}`} />}
                          </div>
                        </motion.div>
                      </div>
                    ))}

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

                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="p-2 border-t border-gray-200 bg-gray-50 max-h-24 overflow-y-auto">
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative bg-white rounded p-1 border border-gray-300 flex items-center">
                            <div className="w-6 h-6 flex-shrink-0 mr-1">
                              {getFileIcon(file.name)}
                            </div>
                            <span className="text-xs truncate max-w-[140px]">{file.name}</span>
                            <button 
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="ml-1 p-1 rounded-full hover:bg-gray-200"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload error message */}
                  {uploadError && (
                    <div className="px-3 py-2 border-t border-red-200 bg-red-50 text-red-700 text-xs flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span>{uploadError}</span>
                      <button 
                        className="ml-auto p-1 hover:bg-red-100 rounded"
                        onClick={() => setUploadError(null)}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Chat input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        className="text-gray-500 p-2 hover:text-gray-700 relative"
                        onClick={toggleAttachmentMenu}
                      >
                        <PlusCircle className="w-5 h-5" />
                        
                        {/* Attachment menu */}
                        {showAttachmentMenu && (
                          <div className="absolute bottom-10 left-0 bg-white rounded-lg shadow-lg p-2 border border-gray-200 w-48">
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center"
                              onClick={handleAttachFile}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              <span>Upload image</span>
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center"
                              onClick={handleAttachFile}
                            >
                              <File className="w-4 h-4 mr-2" />
                              <span>Upload file</span>
                            </button>
                          </div>
                        )}
                      </button>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                      />
                      
                      <button 
                        type="button"
                        className="text-gray-500 p-2 hover:text-gray-700"
                        onClick={handleAttachFile}
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder={selectedFiles.length > 0 ? "Send files..." : isConnected ? "Type a message..." : "Reconnecting to chat..."}
                        className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none px-2 py-1"
                        value={newMessage}
                        onChange={handleInputChange}
                        disabled={!isConnected}
                      />
                      <button type="button" className="text-gray-500 p-2 hover:text-gray-700">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        className={`ml-2 p-2 rounded-full ${
                          (newMessage.trim() || selectedFiles.length > 0) && isConnected ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                        disabled={!(newMessage.trim() || selectedFiles.length > 0) || !isConnected}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerSupportChat; 