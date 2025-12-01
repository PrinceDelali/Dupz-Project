import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from './LoadingOverlay';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const navigationRef = useRef({ hasNavigated: false, timestamp: 0 });

  // Extract the current menu item from the URL path
  const getCurrentMenuId = (path) => {
    const segment = path.split('/').pop();
    
    // Map path segments to permission IDs
    const pathToPermissionMap = {
      'dashboard': 'dashboard',
      'all-orders': 'orders',
      'orders': 'orders',
      'products': 'products',
      'collections': 'collections',
      'platforms': 'platforms',
      'customers': 'customers',
      'chats': 'chats',
      'campaigns': 'campaigns',
      'coupons': 'coupons',
      'quotes': 'quotes',
      'settings': 'settings',
      'profile': 'profile',
      'users': 'users',
    };
    
    return pathToPermissionMap[segment] || segment;
  };

  // Reset navigation ref when path changes
  useEffect(() => {
    console.log(`[AdminRoute] Path changed to: ${location.pathname}`);
    navigationRef.current = { 
      hasNavigated: false, 
      timestamp: Date.now() 
    };
  }, [location.pathname]);
  
  // Log full localStorage content for debugging
  useEffect(() => {
    console.log('[AdminRoute] Debug - localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        let value = localStorage.getItem(key);
        
        // Try to parse as JSON if it looks like JSON
        if (value && (value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value);
            console.log(`[AdminRoute] localStorage[${key}]:`, value);
          } catch (e) {
            console.log(`[AdminRoute] localStorage[${key}]:`, value);
          }
        } else {
          console.log(`[AdminRoute] localStorage[${key}]:`, value);
        }
      } catch (e) {
        console.log(`[AdminRoute] Error reading localStorage key ${key}:`, e);
      }
    }
  }, []);

  // CRITICAL FIX: Add direct check for localStorage on initial render to prevent redirection loop
  const originalUser = localStorage.getItem('user');
  useEffect(() => {
    // On initial mount, if localStorage has a valid user but React state doesn't,
    // this fixes the race condition where the user gets redirected before React state is updated
    const checkInitialStorage = () => {
      console.log('[AdminRoute] CRITICAL FIX: Checking localStorage directly');
      if (!user && originalUser) {
        try {
          const parsed = JSON.parse(originalUser);
          console.log('[AdminRoute] Found user in localStorage:', parsed?.role);
          
          // If this is a staff/admin, don't redirect yet - wait for context to load
          if (parsed?.role === 'staff' || parsed?.role === 'admin') {
            console.log('[AdminRoute] Found valid admin/staff in localStorage, preventing redirect');
            setHasCheckedPermissions(true);
            return true; // Valid admin/staff found
          }
        } catch (e) {
          console.error('[AdminRoute] Error parsing localStorage user:', e);
        }
      }
      return false; // No valid admin/staff found
    };
    
    // Only run this once on mount
    const hasValidUserInStorage = checkInitialStorage();
    
    // If we don't have a valid user in storage and we're not loading, redirect
    if (!hasValidUserInStorage && !loading && !user) {
      console.log('[AdminRoute] No valid user found, redirecting to login');
      navigate('/admin/login');
    }
  }, []);

  useEffect(() => {
    console.log('[AdminRoute] Checking access, user:', user?.role, 'path:', location.pathname);
    
    if (loading) {
      console.log('[AdminRoute] Still loading user data...');
      return;
    }

    // Prevent multiple navigations in the same cycle
    if (navigationRef.current.hasNavigated) {
      const elapsed = Date.now() - navigationRef.current.timestamp;
      if (elapsed < 1000) { // Within 1 second
        console.log(`[AdminRoute] Skipping duplicate navigation, elapsed time: ${elapsed}ms`);
        return;
      }
    }

    if (!user) {
      console.log('[AdminRoute] No user found, redirecting to login');
      navigationRef.current = { hasNavigated: true, timestamp: Date.now() };
      navigate('/admin/login');
      return;
    }

    // Admin has access to everything
    if (user.role === 'admin') {
      console.log('[AdminRoute] Admin user - access granted');
      setHasCheckedPermissions(true);
      return;
    }

    // Check if staff has necessary permissions
    if (user.role === 'staff') {
      console.log('[AdminRoute] Staff user detected:', JSON.stringify(user));
      
      const currentMenuId = getCurrentMenuId(location.pathname);
      console.log('[AdminRoute] Current menu:', currentMenuId);
      
      // Profile is accessible to all staff users
      if (currentMenuId === 'profile') {
        console.log('[AdminRoute] Profile access - granted for all staff');
        setHasCheckedPermissions(true);
        return;
      }

      // Dashboard is accessible to all staff users
      if (currentMenuId === 'dashboard') {
        console.log('[AdminRoute] Dashboard access - granted for all staff');
        setHasCheckedPermissions(true);
        return;
      }

      // Check if staff has permission for this menu
      if (user.permissions && Array.isArray(user.permissions)) {
        console.log('[AdminRoute] Checking permissions:', user.permissions, 'for menu:', currentMenuId);
        
        if (user.permissions.includes(currentMenuId)) {
          console.log('[AdminRoute] Permission granted for:', currentMenuId);
          setHasCheckedPermissions(true);
          return;
        }
        
        console.log('[AdminRoute] Permission denied for:', currentMenuId);
        
        // If staff doesn't have permission for this page, redirect to dashboard
        console.log('[AdminRoute] Redirecting to dashboard due to lack of permission');
        navigationRef.current = { hasNavigated: true, timestamp: Date.now() };
        navigate('/admin/dashboard');
        return;
      } else {
        console.log('[AdminRoute] No permissions array found for staff user');
        // Default to dashboard if permissions aren't defined
        if (currentMenuId !== 'dashboard') {
          console.log('[AdminRoute] No permissions defined, redirecting to dashboard');
          navigationRef.current = { hasNavigated: true, timestamp: Date.now() };
          navigate('/admin/dashboard');
          return;
        }
      }
    }

    // Not admin or staff with permissions - redirect to login
    if (user.role !== 'admin' && user.role !== 'staff') {
      console.log('[AdminRoute] User is not admin or staff, redirecting to login');
      navigationRef.current = { hasNavigated: true, timestamp: Date.now() };
      navigate('/admin/login');
    }
    
    setHasCheckedPermissions(true);
  }, [user, loading, navigate, location.pathname]);

  if (loading || !hasCheckedPermissions) {
    return <LoadingOverlay message="Verifying access..." />;
  }

  // Render for admin or staff with appropriate permissions
  if (user) {
    console.log('[AdminRoute] Rendering component for user:', user.role);
    if (user.role === 'admin') {
      return children;
    }
    
    if (user.role === 'staff') {
      const currentMenuId = getCurrentMenuId(location.pathname);
      
      // Always allow access to dashboard and profile for staff
      if (currentMenuId === 'profile' || currentMenuId === 'dashboard') {
        console.log('[AdminRoute] Rendering dashboard/profile for staff');
        return children;
      }
      
      // Check specific permission
      if (user.permissions && Array.isArray(user.permissions) && 
          user.permissions.includes(currentMenuId)) {
        console.log('[AdminRoute] Rendering permitted page for staff:', currentMenuId);
        return children;
      }
      
      // If we got here, the useEffect should have already redirected
      console.log('[AdminRoute] Waiting for redirection...');
      return <LoadingOverlay message="Checking permissions..." />;
    }
  }
  
  console.log('[AdminRoute] No user or permissions, rendering null');
  return null;
};

export default AdminRoute; 