import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import apiConfig from '../config/apiConfig';

const AuthContext = createContext();

const API_URL = apiConfig.baseURL;

export const AuthProvider = ({ children }) => {
  // For debugging state issues
  const initialLoadRef = useRef(true);
  
  // Initialize user state from localStorage
  const [user, setUser] = useState(() => {
    console.log('🔄 [AuthContext] Initializing user state from localStorage');
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('📋 [AuthContext] Found user in localStorage:', JSON.stringify(parsedUser));
        return parsedUser;
      } catch (error) {
        console.error('❌ [AuthContext] Error parsing user from localStorage:', error);
        return null;
      }
    } else {
      console.log('❓ [AuthContext] No user found in localStorage');
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  // Log auth state changes
  useEffect(() => {
    if (initialLoadRef.current) {
      console.log('🚀 [AuthContext] Initial render with user:', user?.role);
      initialLoadRef.current = false;
    } else {
      console.log('👤 [AuthContext] User state changed:', user?.role);
    }
  }, [user]);

  // Enhanced setUser function to also store userId separately
  const handleSetUser = (userData) => {
    if (userData) {
      console.log('[AuthContext] Setting user data:', userData);
      
      // Store full user object in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Also store userId separately for easier access
      if (userData._id || userData.id) {
        const userId = userData._id || userData.id;
        localStorage.setItem('userId', userId);
        console.log('✅ [AuthContext] User ID stored separately:', userId);
      }
      
      // Log permissions for staff users
      if (userData.role === 'staff') {
        console.log('✅ [AuthContext] Staff permissions:', userData.permissions);
      }
      
      // Update React state
      setUser(userData);
      console.log('✅ [AuthContext] User state updated with:', userData.role);
    } else {
      // If userData is null, clear user data
      console.log('🗑️ [AuthContext] Clearing user data');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Validate token on initial load
  useEffect(() => {
    const validateToken = async () => {
      console.log('🔍 [AuthContext] Validating token');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ [AuthContext] No token found');
        setLoading(false);
        return;
      }

      try {
        // Add token to axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('🔑 [AuthContext] Added token to axios headers');
        
        // Verify token with backend
        const response = await axios.get(`${API_URL}/auth/verify`);
        if (response.data.valid) {
          console.log('✅ [AuthContext] Token verified successfully');
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              console.log('👤 [AuthContext] Loaded user from localStorage after token verification:', userData.role);
              setUser(userData);
              
              // Also ensure userId is stored separately
              if (userData._id) {
                localStorage.setItem('userId', userData._id);
              }
            } catch (e) {
              console.error('❌ [AuthContext] Error parsing user JSON:', e);
            }
          }
        } else {
          // If token is invalid, logout
          console.warn('⚠️ [AuthContext] Token is invalid, logging out');
          logout();
        }
      } catch (error) {
        console.error('❌ [AuthContext] Token validation error:', error);
        // Only logout on 401 Unauthorized
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // Add axios interceptor for handling 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only logout for auth-specific endpoints or if the server explicitly says token is invalid
          // This prevents logout on every 401 error
          const isAuthEndpoint = error.config?.url?.includes('/auth/');
          const isVerifyEndpoint = error.config?.url?.includes('/auth/verify');
          const tokenInvalidMessage = error.response?.data?.message?.toLowerCase()?.includes('invalid token') ||
                                      error.response?.data?.message?.toLowerCase()?.includes('jwt expired');
          
          if (isAuthEndpoint || isVerifyEndpoint || tokenInvalidMessage) {
            console.log('🔒 [AuthContext] Auth endpoint returned 401, logging out');
            logout();
          } else {
            // For other 401 errors, just log it but don't automatically logout
            console.warn('⚠️ [AuthContext] Non-auth endpoint returned 401, not logging out');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const logout = () => {
    console.log('🔄 [AuthContext] User logging out');
    
    // Remove token from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('rememberMe');
    
    // Reset user state
    setUser(null);
    
    console.log('✅ [AuthContext] User logged out successfully');
  };

  // Provide the context value
  const value = {
    user,
    setUser: handleSetUser,
    logout,
    loading,
    isAuthenticated: !!user
  };

  if (loading) {
    console.log('⏳ [AuthContext] Still loading, returning loading indicator');
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  console.log('🔄 [AuthContext] Rendering with user:', user?.role);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};