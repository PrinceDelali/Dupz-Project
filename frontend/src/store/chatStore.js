import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import notificationService from '../services/NotificationService';

export const useChatStore = create(
  persist(
    (set, get) => ({
      // Chat sessions and messages
      sessions: {}, // Structure: { sessionId: { messages: [], customerInfo: {}, lastActive: timestamp } }
      activeAdminSessions: [], // List of sessions that admin has open
      activeSessionId: null,
      
      // Connection states
      isConnected: false,
      connectionError: null,
      reconnectAttempts: 0,
      
      // Socket.io reference (not persisted)
      socket: null,
      
      // Actions
      setSocket: (socket) => set({ socket }),
      
      setConnectionState: (isConnected, error = null) => 
        set({ isConnected, connectionError: error }),
      
      // Set the active session for admin view
      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      
      // Add session to active admin sessions
      addActiveAdminSession: (sessionId) => {
        const { activeAdminSessions } = get();
        if (!activeAdminSessions.includes(sessionId)) {
          set({ activeAdminSessions: [...activeAdminSessions, sessionId] });
        }
      },
      
      // Remove session from active admin sessions
      removeActiveAdminSession: (sessionId) => {
        const { activeAdminSessions } = get();
        set({ 
          activeAdminSessions: activeAdminSessions.filter(id => id !== sessionId) 
        });
      },
      
      // Initialize a chat session
      initSession: (sessionId, customerInfo = {}) => {
        console.log(`Initializing chat session: ${sessionId}`, customerInfo);
        const { sessions } = get();
        if (!sessions[sessionId]) {
          set({
            sessions: {
              ...sessions,
              [sessionId]: {
                messages: [],
                customerInfo,
                lastActive: Date.now(),
                unreadCount: 0
              }
            }
          });
          console.log(`Created new session: ${sessionId}`);
        } else {
          // Update existing session with new info
          set({
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                customerInfo: {
                  ...sessions[sessionId].customerInfo,
                  ...customerInfo
                },
                lastActive: Date.now()
              }
            }
          });
          console.log(`Updated existing session: ${sessionId}`);
        }
      },
      
      // Add a new message to a specific session
      addMessage: (sessionId, message) => {
        console.log(`Adding message to session ${sessionId}:`, message);
        const { sessions, activeSessionId } = get();
        const session = sessions[sessionId] || { messages: [], lastActive: Date.now(), unreadCount: 0 };
        
        // Update unread count if this isn't the active session for admin
        const isUnread = message.sender !== 'admin' && activeSessionId !== sessionId;
        const unreadCount = isUnread ? session.unreadCount + 1 : session.unreadCount;
        
        // Check for duplicate message
        const isDuplicate = session.messages.some(m => m.id === message.id);
        if (isDuplicate) {
          console.log(`Duplicate message detected, skipping: ${message.id}`);
          return;
        }
        
        // Play notification sound for new messages
        if (message.sender === 'user') {
          // For admin interface - play sound for customer messages
          notificationService.playMessageSound();
          
          // Show browser notification if not focused
          notificationService.showMessageNotification(
            'New Customer Message', 
            { 
              body: message.text,
              tag: `chat-${sessionId}`
            }
          );
        } else if (message.sender === 'support' && !document.hasFocus()) {
          // For customer interface - play sound for support messages
          notificationService.playMessageSound();
        }
        
        set({
          sessions: {
            ...sessions,
            [sessionId]: {
              ...session,
              messages: [...session.messages, message],
              lastActive: Date.now(),
              unreadCount
            }
          }
        });
        
        console.log(`Message added to session ${sessionId}, new count: ${session.messages.length + 1}`);
      },
      
      // Mark all messages in a session as read
      markSessionAsRead: (sessionId) => {
        const { sessions } = get();
        const session = sessions[sessionId];
        if (session) {
          set({
            sessions: {
              ...sessions,
              [sessionId]: {
                ...session,
                unreadCount: 0
              }
            }
          });
        }
      },
      
      // Send a message through Socket.io
      sendMessage: (sessionId, content, type = 'message') => {
        const { socket } = get();
        
        if (!socket || !socket.connected) {
          console.error("Socket.io not connected");
          return false;
        }
        
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        const sender = type === 'admin_message' ? 'admin' : 'user';
        
        // Create message object for local state
        const messageObj = {
          id: messageId,
          text: content,
          sender: sender === 'admin' ? 'support' : 'user',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp
        };
        
        // Add message to local state immediately
        get().addMessage(sessionId, messageObj);
        
        // Send message via Socket.io
        try {
          socket.emit('message', {
            messageId,
            sessionId,
            content,
            sender,
            timestamp
          });
          return true;
        } catch (error) {
          console.error("Error sending message via Socket.io:", error);
          return false;
        }
      },
      
      // Get total unread count across all sessions
      getTotalUnreadCount: () => {
        const { sessions } = get();
        return Object.values(sessions).reduce(
          (total, session) => total + (session.unreadCount || 0), 
          0
        );
      },
      
      // Get all sessions sorted by last activity
      getSortedSessions: () => {
        const { sessions } = get();
        return Object.entries(sessions)
          .map(([id, data]) => ({ 
            id, 
            ...data 
          }))
          .sort((a, b) => b.lastActive - a.lastActive);
      }
    }),
    {
      name: 'sinosply-chat-storage',
      partialize: (state) => ({
        // Don't persist the socket connection
        sessions: state.sessions,
        activeAdminSessions: state.activeAdminSessions,
        activeSessionId: state.activeSessionId
      })
    }
  )
); 