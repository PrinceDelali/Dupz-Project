import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaPaperclip, FaSmile, 
         FaCheckDouble, FaCheck, FaCircle, FaPhoneAlt, FaVideo, FaBars, FaArrowLeft,
         FaDownload, FaFile, FaFilePdf, FaFileImage, FaFileCode } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import { useChatStore } from '../../store/chatStore';

// Function to generate initials avatar from name
const getInitialsAvatar = (name) => {
  // Default colors
  const colors = [
    '#FF5733', '#33A8FF', '#33FF57', '#A833FF', '#FF33A8',
    '#33FFA8', '#FF5733', '#337DFF', '#FF3E33', '#33FFD4'
  ];
  
  // Get initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Generate consistent color based on name
  const colorIndex = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    
  return {
    initials,
    backgroundColor: colors[colorIndex]
  };
};

const ChatsPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, priority
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const activeCustomers = useRef(new Map());
  
  // Get chat store methods and state
  const { 
    sessions,
    setActiveSession,
    addActiveAdminSession,
    removeActiveAdminSession,
    addMessage,
    sendMessage,
    markSessionAsRead,
    setConnectionState,
    setSocket
  } = useChatStore();

  const quickReplies = [
    "Thanks for reaching out to us!",
    "Let me check that for you right away.",
    "Your order will be shipped within 24 hours.",
    "Is there anything else I can help you with?",
    "I'll need a bit more information to assist you better.",
  ];

  // Get Socket.io URL based on environment
  const getSocketUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      // Try to connect to local dedicated chat server
      return 'http://localhost:4000';
    }
    
    // For production, use the host's chat server endpoint
    // This assumes we deploy the chat server under /chat-server path
    return `${window.location.protocol}//${window.location.host}/chat-server`;
  };

  // Create a configurable socket connection
  const createSocketConnection = () => {
    try {
      const socketUrl = getSocketUrl();
      console.log(`[SOCKET] Admin connecting to Socket.io: ${socketUrl}`);
      
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
          userType: 'admin',
          timestamp: Date.now()
        }
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

  // Set up Socket.io connection
  useEffect(() => {
    connectSocketIO();
    
    // Initialize with empty state and wait for real data
    setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => {
      cleanupConnection();
    };
  }, []);
  
  // Cleanup function to handle all disconnect logic
  const cleanupConnection = () => {
    if (socketRef.current) {
      // Leave all active sessions before disconnecting
      if (selectedChat) {
        socketRef.current.emit('leave_session', { sessionId: selectedChat._id });
      }
      
      socketRef.current.disconnect();
    }
    
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  
  const connectSocketIO = () => {
    try {
      // Clean up existing socket if needed
      cleanupConnection();
      
      // Create Socket.io instance with improved options
      const socket = createSocketConnection();
      
      if (!socket) {
        setConnected(false);
        setConnectionState(false, "Failed to create socket connection");
        scheduleReconnect();
        return;
      }
      
      // Store socket reference
      socketRef.current = socket;
      setSocket(socket);
      
      // Connection established
      socket.on('connect', () => {
        console.log(`[SOCKET] Connected with ID: ${socket.id}`);
        setConnected(true);
        setReconnecting(false);
        setConnectionState(true, null);
        
              // Send an initial message to identify this client as admin
        socket.emit('init', {
                userType: 'admin',
                timestamp: new Date().toISOString()
        });
        
        // Request all active chat sessions
        socket.emit('get_sessions');
      });
      
      // Heartbeat check from server
      socket.on('heartbeat', (data) => {
        // Respond to server heartbeat to keep connection alive
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
      });
      
      // Connection error
      socket.on('connect_error', (error) => {
        console.error('[SOCKET] Connection error:', error);
        setConnected(false);
        setConnectionState(false, error.message);
        scheduleReconnect();
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('[SOCKET] Disconnected:', reason);
        setConnected(false);
        setConnectionState(false, null);
        
        // Attempt to reconnect after delay
        if (reason !== 'io client disconnect') {
          scheduleReconnect();
        }
      });
      
      // Init acknowledgement
      socket.on('init_ack', (data) => {
        console.log('[SOCKET] Initialization acknowledged by server:', data);
      });
      
      // Session updates
      socket.on('sessions_update', (sessions) => {
        console.log('[SOCKET] Received sessions update:', sessions);
        
        if (Array.isArray(sessions) && sessions.length > 0) {
          // Process each session and update chat store
          sessions.forEach(session => {
            // Update customer info
            const customerInfo = session.customerInfo || {
              name: 'Guest Customer',
              email: 'guest@example.com'
            };
            
            // Initialize session in the chat store
            useChatStore.getState().initSession(session.sessionId, customerInfo);
            
            // Update messages if needed
            if (session.messages && session.messages.length > 0) {
              // Add any new messages from server
              const existingMessages = useChatStore.getState().sessions[session.sessionId]?.messages || [];
              const existingIds = existingMessages.map(m => m.id);
              
              session.messages.forEach(msg => {
                if (!existingIds.includes(msg.messageId)) {
                  // Convert format
                  const message = {
                    id: msg.messageId,
                    text: msg.content,
                    sender: msg.sender === 'admin' ? 'support' : 'user',
                    timestamp: msg.timestamp,
                    time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fileType: msg.fileType,
                    fileUrl: msg.fileUrl,
                    fileName: msg.fileName,
                    fileSize: msg.fileSize
                  };
                  
                  // Add to chat store
                  useChatStore.getState().addMessage(session.sessionId, message);
                }
              });
            }
            
            // Update typing indicator state
            if (selectedChat && selectedChat._id === session.sessionId) {
              setIsTyping(session.typing || false);
            }
          });
        }
      });
      
      // Customer connected notification
      socket.on('customer_connected', (data) => {
        console.log('[SOCKET] Customer connected:', data);
        if (data.sessionId) {
          // Update customer info if available
          if (data.customerInfo) {
            useChatStore.getState().initSession(data.sessionId, data.customerInfo);
          }
          
          // Update customer status in chats list
          updateCustomerStatus(data.sessionId, true);
        }
      });
      
      // Customer info updated
      socket.on('customer_updated', (data) => {
        console.log('[SOCKET] Customer info updated:', data);
        if (data.sessionId && data.customerInfo) {
          useChatStore.getState().initSession(data.sessionId, data.customerInfo);
        }
      });
      
      // Customer disconnected notification
      socket.on('customer_disconnected', (data) => {
        console.log('[SOCKET] Customer disconnected:', data);
        if (data.sessionId) {
          // Update customer status in chats list
          updateCustomerStatus(data.sessionId, false);
        }
      });
      
      // Message from server
      socket.on('message', (data) => {
        try {
          console.log('[SOCKET] Received message:', data);
          
          // Process message and add to the chat store
          if (data.sessionId && data.content) {
            const messageObj = {
              id: data.messageId,
              text: data.content,
              sender: data.sender === 'admin' ? 'support' : 'user',
              timestamp: data.timestamp,
              time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fileType: data.fileType,
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize
            };
            
            // Add message to the chat store
            useChatStore.getState().addMessage(data.sessionId, messageObj);
            
            // If message is from a customer & we're viewing this chat, add to UI directly
            if (data.sender === 'customer' && selectedChat && selectedChat._id === data.sessionId) {
              const newMessage = {
                _id: data.messageId,
                content: data.content,
                sender: 'user',
                createdAt: new Date(data.timestamp),
                status: 'read',
                fileType: data.fileType,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize
              };
              
              setMessages(prevMessages => [...prevMessages, newMessage]);
            }
            
            // Reset typing indicator when message is received
            if (data.sender === 'customer' && selectedChat && selectedChat._id === data.sessionId) {
              setIsTyping(false);
            }
          }
        } catch (error) {
          console.error("[SOCKET] Error processing message:", error);
        }
      });
      
      // New customer message notification
      socket.on('new_customer_message', (data) => {
        console.log('[SOCKET] New customer message notification:', data);
        if (data.message && data.sessionId) {
          // Update customer info if provided
          if (data.customerInfo) {
            useChatStore.getState().initSession(data.sessionId, data.customerInfo);
          }
          
          // Add message to chat store
          const messageObj = {
            id: data.message.messageId,
            text: data.message.content,
            sender: 'user',
            timestamp: data.message.timestamp,
            time: new Date(data.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileType: data.message.fileType,
            fileUrl: data.message.fileUrl,
            fileName: data.message.fileName,
            fileSize: data.message.fileSize
          };
          
          // Add to chat store
          useChatStore.getState().addMessage(data.sessionId, messageObj);
          
          // If we're currently viewing this chat, add to UI directly
          if (selectedChat && selectedChat._id === data.sessionId) {
        const newMessage = {
              _id: data.message.messageId,
              content: data.message.content,
          sender: 'user',
              createdAt: new Date(data.message.timestamp),
              status: 'read',
              fileType: data.message.fileType,
              fileUrl: data.message.fileUrl,
              fileName: data.message.fileName,
              fileSize: data.message.fileSize
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
            // Mark as read since we're viewing it
            socket.emit('mark_as_read', { sessionId: data.sessionId });
          }
        }
      });
      
      // History response
      socket.on('history', (data) => {
        console.log('[SOCKET] Received message history:', data);
        
        if (Array.isArray(data.messages) && data.messages.length > 0 && data.sessionId) {
          // Format messages for UI display
          const formattedMessages = data.messages.map(msg => ({
            _id: msg.messageId,
            content: msg.content,
            sender: msg.sender === 'admin' ? 'admin' : 'user',
            createdAt: new Date(msg.timestamp),
            status: 'read',
            fileType: msg.fileType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize
          }));
          
          console.log(`[SOCKET] Loaded ${formattedMessages.length} messages for session ${data.sessionId}`);
          
          // Update UI if this is the currently selected chat
          if (selectedChat && selectedChat._id === data.sessionId) {
            setMessages(formattedMessages);
          }
        }
      });
      
      // Typing indicator
      socket.on('typing', (data) => {
        console.log('[SOCKET] Typing indicator:', data);
        if (data.userType === 'customer' && selectedChat && selectedChat._id === data.sessionId) {
          setIsTyping(data.isTyping);
        }
      });
      
      // Error from server
      socket.on('error', (data) => {
        console.error('[SOCKET] Server error:', data);
      });
      
    } catch (error) {
      console.error("[SOCKET] Error connecting to Socket.io:", error);
      setConnected(false);
      setConnectionState(false, error.message);
      scheduleReconnect();
    }
  };
  
  // Schedule reconnect attempt
  const scheduleReconnect = () => {
    // Clear any existing reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    setReconnecting(true);
    
    // Try to reconnect after a short delay
    reconnectTimerRef.current = setTimeout(() => {
      console.log("[SOCKET] Attempting to reconnect...");
      connectSocketIO();
    }, 3000);
  };
  
  // Convert chat store sessions to the format needed for the UI
  useEffect(() => {
    // Convert sessions from chat store to chats format
    const chatList = Object.entries(sessions).map(([sessionId, sessionData]) => {
      // Get the last message if available
      const lastMessage = sessionData.messages && sessionData.messages.length > 0 
        ? sessionData.messages[sessionData.messages.length - 1].text 
        : 'No messages yet';
      
      // Process customer info - use real data if available, fall back to defaults
      const customerInfo = sessionData.customerInfo || {};
      const isAuthenticated = customerInfo.isAuthenticated || false;
      const userId = customerInfo.userId || null;
      
      let firstName, lastName, email, avatar;
      
      if (isAuthenticated && customerInfo.name) {
        // Split name into first and last name components
        const nameParts = customerInfo.name.split(' ');
        firstName = nameParts[0] || 'User';
        lastName = nameParts.slice(1).join(' ') || `#${sessionId.slice(-5)}`;
        email = customerInfo.email || 'customer@example.com';
        
        // Create avatar from name if needed
        const { initials, backgroundColor } = getInitialsAvatar(customerInfo.name);
        avatar = customerInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(backgroundColor.substring(1))}&color=fff`;
      } else {
        // Use generic info for non-authenticated users
        firstName = 'Guest';
        lastName = `Customer #${sessionId.slice(-5)}`;
        email = 'guest@example.com';
        avatar = 'https://randomuser.me/api/portraits/lego/1.jpg';
      }
      
      return {
      _id: sessionId,
      user: {
        _id: sessionId,
          firstName,
          lastName,
          email,
          avatar,
        online: true,
          lastSeen: new Date(sessionData.lastActive),
          isAuthenticated
      },
      lastMessage: lastMessage,
        unread: sessionData.unreadCount > 0,
        priority: sessionData.priority || 'normal',
        updatedAt: new Date(sessionData.lastActive)
      };
    });
    
    // Update UI state with converted data
    if (chatList.length > 0) {
      console.log(`[CHAT] Updating UI with ${chatList.length} chats from store`);
      setChats(chatList);
    }
  }, [sessions]);
  
  // Update customer online status
  const updateCustomerStatus = (sessionId, isOnline) => {
    setChats(prevChats => {
      const updatedChats = [...prevChats];
      const chatIndex = updatedChats.findIndex(chat => chat._id === sessionId);
      
      if (chatIndex >= 0) {
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          user: {
            ...updatedChats[chatIndex].user,
            online: isOnline,
            lastSeen: new Date()
          }
        };
        return updatedChats;
      }
      
      // If customer not in list yet, create a new entry only if they're online
      if (isOnline) {
            const newChat = {
              _id: sessionId,
              user: {
                _id: sessionId,
                firstName: 'Customer',
                lastName: `#${sessionId.slice(-5)}`,
                email: 'customer@example.com',
                avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
            online: true,
                lastSeen: new Date()
              },
          lastMessage: 'New customer connected',
          unread: true,
              priority: 'normal',
          updatedAt: new Date()
        };
        return [...prevChats, newChat];
      }
      
      return prevChats;
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle chat selection with mobile view toggle
  const handleChatSelect = (chat) => {
    console.log(`[CHAT] Selecting chat: ${chat._id}`);
    
    // If already selected, don't do anything
    if (selectedChat && selectedChat._id === chat._id) {
      return;
    }
    
    // Leave previous session if any
    if (socketRef.current && socketRef.current.connected && selectedChat) {
      socketRef.current.emit('leave_session', { sessionId: selectedChat._id });
    }
    
    // Set selected chat
    setSelectedChat(chat);
    
    // Update active session in chat store
    setActiveSession(chat._id);
    addActiveAdminSession(chat._id);
    
    // Join the socket room for this chat session
    if (socketRef.current && socketRef.current.connected) {
      console.log(`[SOCKET] Joining session room: ${chat._id}`);
      socketRef.current.emit('select_session', {
        sessionId: chat._id
      });
      
      // Mark as read on server
      socketRef.current.emit('mark_as_read', {
        sessionId: chat._id
      });
    }
    
    // Load messages for the selected chat
    if (chat && chat._id) {
      // Get messages from chat store
      const storedSession = sessions[chat._id];
      
      if (storedSession && storedSession.messages && storedSession.messages.length > 0) {
        console.log(`[CHAT] Loading ${storedSession.messages.length} messages from store for ${chat._id}`);
        
        // Convert to message format
        const formattedMessages = storedSession.messages.map(msg => ({
              _id: msg.id,
              content: msg.text,
          sender: msg.sender === 'support' ? 'admin' : 'user',
          createdAt: new Date(msg.timestamp || msg.time),
              status: 'read'
        }));
        
        setMessages(formattedMessages);
        
        // Mark as read in chat store
        markSessionAsRead(chat._id);
      } else {
        // Request message history from server
        console.log(`[SOCKET] Requesting message history for ${chat._id}`);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('get_history', {
            sessionId: chat._id
          });
        } else {
          // Fallback to empty messages array
          setMessages([]);
        }
      }
      
      // Reset other states
      setShowSearchResults(false);
      setSearchTerm('');
      
      // Scroll to bottom of messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // For mobile, hide the chat list and show the message view
      if (isMobile) {
        setShowChatList(false);
        
        // Focus on message input after a delay to allow rendering
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 500);
      }
      
      // Mark as read in UI
      if (chat.unread) {
        const updatedChats = chats.map(c => 
          c._id === chat._id ? { ...c, unread: false } : c
        );
        setChats(updatedChats);
      }
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 2) {
      // Search in chat users
      const filtered = chats.filter(chat => {
        const fullName = `${chat.user.firstName} ${chat.user.lastName}`.toLowerCase();
        return fullName.includes(term.toLowerCase()) || 
               chat.user.email.toLowerCase().includes(term.toLowerCase()) ||
               chat.lastMessage.toLowerCase().includes(term.toLowerCase());
      });
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const filterChatsByTab = (chats) => {
    switch(activeTab) {
      case 'unread':
        return chats.filter(chat => chat.unread);
      case 'priority':
        return chats.filter(chat => chat.priority === 'high' || chat.priority === 'urgent');
      default:
        return chats;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !connected) return;
    
    const messageId = `admin-msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const timestamp = new Date().toISOString();
    
    // Reset typing indicator
    sendTypingIndicator(false);
    
    // Add to UI immediately for responsiveness
    const messageObj = {
      _id: messageId,
      content: newMessage,
      sender: 'admin',
      status: 'sent',
      createdAt: new Date(),
    };
    
    // Add to messages state for UI
    setMessages(prev => [...prev, messageObj]);
    
    // Update last message in chats list
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === selectedChat._id 
          ? { 
              ...chat, 
              lastMessage: newMessage,
              updatedAt: new Date()
            } 
          : chat
      )
    );
    
    // Send message via socket
    if (socketRef.current && socketRef.current.connected) {
      try {
        socketRef.current.emit('message', {
          messageId: messageId,
          sessionId: selectedChat._id,
          content: newMessage,
          sender: 'admin',
          timestamp: timestamp
        });
        
        console.log('[SOCKET] Message sent');
        
        // Add to chat store
        const storeMessage = {
            id: messageId,
            text: newMessage,
            sender: 'support',
          timestamp: timestamp,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        useChatStore.getState().addMessage(selectedChat._id, storeMessage);
        
        // Update message status to delivered after a short delay
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg._id === messageId ? { ...msg, status: 'delivered' } : msg
            )
          );
        }, 500);
      } catch (error) {
        console.error("[SOCKET] Error sending message:", error);
        
        // Show error status in UI
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? { ...msg, status: 'error' } : msg
          )
        );
      }
    } else {
      console.warn("[SOCKET] Socket.io not connected, message not sent");
      
      // Show error status in UI
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, status: 'error' } : msg
        )
      );
    }
    
    // Clear input
    setNewMessage('');
    
    // Clear typing indicator
    sendTypingIndicator(false);
  };

  // Send typing indicator to customer
  const sendTypingIndicator = (isTyping) => {
    if (!selectedChat || !socketRef.current || !socketRef.current.connected) {
      return;
    }
    
    try {
      socketRef.current.emit('typing', {
        sessionId: selectedChat._id,
        isTyping: isTyping,
        userType: 'admin',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };
  
  // Hook up typing indicator
  useEffect(() => {
    if (newMessage && selectedChat && selectedChat._id.startsWith('customer-')) {
      sendTypingIndicator(true);
      
      // Clear typing indicator after a delay
      const typingTimeout = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
      
      return () => clearTimeout(typingTimeout);
    }
  }, [newMessage, selectedChat]);

  const handleQuickReply = (reply) => {
    setNewMessage(reply);
    inputRef.current.focus();
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatTimestamp = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If today, return time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // If this week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise return date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessageStatus = (message) => {
    if (message.sender !== 'admin') return null;
    
    switch(message.status) {
      case 'sent':
        return <FaCheck className="text-gray-400 ml-1 text-xs" />;
      case 'delivered':
        return <FaCheckDouble className="text-gray-400 ml-1 text-xs" />;
      case 'read':
        return <FaCheckDouble className="text-blue-500 ml-1 text-xs" />;
      default:
        return null;
    }
  };

  // Render message with support for file attachments
  const renderMessageContent = (message) => {
    if (message.fileType === 'image' && message.fileUrl) {
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
              <FaDownload className="w-4 h-4 opacity-70" />
            </div>
          </a>
        </div>
      );
    }

    // Default to text message
    return <p>{message.content}</p>;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // PDF files
    if (extension === 'pdf') {
      return <FaFilePdf />;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return <FaFileImage />;
    }
    
    // Text/Code files
    if (['txt', 'js', 'html', 'css', 'jsx', 'md'].includes(extension)) {
      return <FaFileCode />;
    }
    
    // Default file icon
    return <FaFile />;
  };

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // When switching to desktop view, always show the chat list
      if (!mobile) {
        setShowChatList(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Function to toggle chat list visibility on mobile
  const toggleChatList = () => {
    setShowChatList(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {loading && <LoadingOverlay />}
      
      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        <div className="h-screen flex flex-col">
          <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              {isMobile && selectedChat && !showChatList && (
                <button 
                  className="mr-3 p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
                  onClick={toggleChatList}
                  aria-label="Back to chat list"
                >
                  <FaArrowLeft className="text-sm" />
                </button>
              )}
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Customer Support</h1>
            </div>
            
            {/* WebSocket status indicator */}
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : reconnecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Offline'}
              </span>
            </div>
          </header>
          
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left sidebar - Conversations */}
            <div 
              className={`${
                isMobile 
                  ? (showChatList 
                      ? 'w-full absolute inset-0 z-10 transition-all duration-300 ease-in-out' 
                      : 'absolute -left-full w-full z-10 transition-all duration-300 ease-in-out') 
                  : 'w-1/3'
              } border-r bg-white flex flex-col`}
            >
              <div className="p-4 border-b">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('all')} 
                  className={`flex-1 py-3 text-sm font-medium text-center ${
                    activeTab === 'all' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Chats
                </button>
                <button 
                  onClick={() => setActiveTab('unread')} 
                  className={`flex-1 py-3 text-sm font-medium text-center ${
                    activeTab === 'unread' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unread ({chats.filter(c => c.unread).length})
                </button>
                <button 
                  onClick={() => setActiveTab('priority')} 
                  className={`flex-1 py-3 text-sm font-medium text-center ${
                    activeTab === 'priority' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Priority
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {showSearchResults ? (
                  searchResults.length > 0 ? (
                    searchResults.map((chat) => (
                      <div
                        key={chat._id}
                        onClick={() => handleChatSelect(chat)}
                        className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      >
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <img
                              src={chat.user.avatar || 'https://via.placeholder.com/40'}
                              alt={`${chat.user.firstName} ${chat.user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            {chat.unread && (
                              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                            )}
                            {chat.user.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-gray-900 truncate">
                                {chat.user.firstName} {chat.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatChatTimestamp(chat.updatedAt)}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-500 truncate flex-1">
                                {chat.lastMessage}
                              </p>
                              {chat.priority === 'urgent' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-1">
                                  Urgent
                                </span>
                              )}
                              {chat.priority === 'high' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                                  High
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-xl font-medium text-gray-700 mb-1">No matches found</h3>
                      <p className="text-gray-500">Try a different search term</p>
                    </div>
                  )
                ) : (
                  filterChatsByTab(chats).length > 0 ? (
                    filterChatsByTab(chats).map((chat) => (
                      <div
                        key={chat._id}
                        onClick={() => handleChatSelect(chat)}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                          selectedChat && selectedChat._id === chat._id
                            ? 'bg-purple-50 border-l-4 border-l-purple-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <img
                              src={chat.user.avatar || 'https://via.placeholder.com/40'}
                              alt={`${chat.user.firstName} ${chat.user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            {chat.unread && (
                              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                            )}
                            {chat.user.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-gray-900 truncate">
                                {chat.user.firstName} {chat.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatChatTimestamp(chat.updatedAt)}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <p className={`text-sm truncate flex-1 ${chat.unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                {chat.lastMessage}
                              </p>
                              {chat.priority === 'urgent' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-1">
                                  Urgent
                                </span>
                              )}
                              {chat.priority === 'high' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                                  High
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <h3 className="text-xl font-medium text-gray-700 mb-1">No conversations</h3>
                      <p className="text-gray-500">
                        {activeTab === 'unread' 
                          ? 'All messages have been read' 
                          : activeTab === 'priority' 
                            ? 'No priority conversations' 
                            : 'Customer chats will appear here'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Chat Messages */}
            <div 
              className={`${
                isMobile 
                  ? (showChatList 
                      ? 'opacity-0 absolute inset-0 z-0 transition-all duration-300 ease-in-out' 
                      : 'w-full opacity-100 absolute inset-0 z-20 transition-all duration-300 ease-in-out') 
                  : 'w-2/3'
              } flex flex-col bg-gray-50`}
            >
              {selectedChat ? (
                <>
                  <div className="px-4 py-3 bg-white border-b shadow-sm flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center">
                      {isMobile && !showChatList && (
                        <button 
                          className="mr-3 p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
                          onClick={toggleChatList}
                          aria-label="Back to chat list"
                        >
                          <FaArrowLeft className="text-sm" />
                        </button>
                      )}
                      <div className="relative">
                        <img
                          src={selectedChat.user.avatar || 'https://via.placeholder.com/40'}
                          alt={`${selectedChat.user.firstName} ${selectedChat.user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        {selectedChat.user.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {selectedChat.user.firstName} {selectedChat.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          {selectedChat.user.online ? (
                            <>
                              <FaCircle className="text-green-500 text-xs mr-1" />
                              Online
                            </>
                          ) : (
                            <>Last seen {formatChatTimestamp(selectedChat.user.lastSeen || new Date())}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <FaPhoneAlt size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <FaVideo size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                        <FaEllipsisV size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-3">
                      {messages.length > 0 ? (
                        messages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${
                              message.sender === 'admin' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                message.sender === 'admin'
                                  ? 'bg-purple-600 text-white message-admin'
                                  : 'bg-white border border-gray-200 message-user'
                              }`}
                            >
                              {renderMessageContent(message)}
                              <div className={`flex items-center text-xs mt-1 ${
                                message.sender === 'admin' ? 'text-purple-200 justify-end' : 'text-gray-400'
                              }`}>
                                {formatDate(message.createdAt)}
                                {renderMessageStatus(message)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <h3 className="text-xl font-medium text-gray-700 mb-1">No messages yet</h3>
                          <p className="text-gray-500">Start the conversation with this customer</p>
                        </div>
                      )}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 max-w-[70%]">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Quick replies */}
                  <div className="bg-white px-4 py-2 border-t flex-wrap gap-2 hidden sm:flex">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                  
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white border-t flex items-center relative sticky bottom-0 z-10"
                  >
                    <button
                      type="button"
                      className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${isMobile ? 'hidden sm:block' : ''}`}
                      onClick={() => {}}
                    >
                      <FaPaperclip />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 mx-2 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <div className="relative">
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <FaSmile />
                      </button>
                      {showEmojiPicker && (
                        <div className={`absolute ${isMobile ? 'bottom-12 -left-[200px] sm:-left-[100px]' : 'bottom-12 right-0'} z-10`}>
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className={`p-2 rounded-full ${
                        newMessage.trim() 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      } transition-colors ml-2`}
                      disabled={!newMessage.trim()}
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <img 
                    src="/images/chat-placeholder.svg" 
                    alt="Select a conversation" 
                    className="w-48 h-48 mb-6 opacity-70"
                  />
                  <h3 className="text-xl font-medium text-gray-700 mb-1">Select a conversation</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a customer conversation from the list to start messaging. You can provide support, answer questions, and resolve issues.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .message-admin {
          border-bottom-right-radius: 0 !important;
          position: relative;
        }
        
        .message-admin::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -8px;
          width: 16px;
          height: 16px;
          background: radial-gradient(circle at top right, transparent 16px, rgb(124, 58, 237) 0);
        }
        
        .message-user {
          border-bottom-left-radius: 0 !important;
          position: relative;
        }
        
        .message-user::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -8px;
          width: 16px;
          height: 16px;
          background: radial-gradient(circle at top left, transparent 16px, #fff 0);
          border-bottom-left-radius: 0;
        }
        
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
        
        .delay-0 {
          animation-delay: 0s;
        }
        
        .delay-75 {
          animation-delay: 0.2s;
        }
        
        .delay-150 {
          animation-delay: 0.4s;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatsPage; 