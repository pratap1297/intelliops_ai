import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/auth-service';
import { User } from '../types';

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  console.log('[AuthGuard] Initializing AuthGuard component');
  const location = useLocation();
  console.log(`[AuthGuard] Path: ${location.pathname}, adminOnly: ${adminOnly}`);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check authentication status on component mount
  useEffect(() => {
    console.log('[AuthGuard] Setting up auth state change listener');
    
    // Set a loading state first
    setIsChecking(true);
    
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user: User | null) => {
      console.log('[AuthGuard] Auth state changed, user:', user);
      
      if (user) {
        // Only update state if we have a valid user
        setIsAuthenticated(true);
        setIsAdmin(user.is_admin || false);
        // Only set isChecking to false if we have a valid user
        setIsChecking(false);
        console.log(`[AuthGuard] Updated state: isAuthenticated=true, isAdmin=${user.is_admin || false}, isChecking=false`);
      } else if (!isChecking) {
        // Only update to not authenticated if we're not in the checking state
        // This prevents premature redirection during initial load
        setIsAuthenticated(false);
        setIsAdmin(false);
        console.log(`[AuthGuard] Updated state: isAuthenticated=false, isAdmin=false, isChecking=${isChecking}`);
      } else {
        console.log(`[AuthGuard] Received null user while still checking, maintaining checking state`);
      }
    });
    
    // Initial check - this ensures we're not relying solely on the auth state listener
    const checkAuth = async () => {
      console.log('[AuthGuard] Performing initial auth check');
      try {
        const token = localStorage.getItem('auth_token');
        console.log('[AuthGuard] Token from localStorage:', token ? 'exists' : 'not found');
        
        if (!token) {
          console.log('[AuthGuard] No token found, setting not authenticated');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }
        
        // IMPORTANT: Keep isChecking true until we've completed all authentication checks
        // This prevents premature redirection to login
        
        // First, try to get the user from localStorage as a fallback
        try {
          const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
          console.log('[AuthGuard] User from localStorage:', localUser);
          
          if (localUser && localUser.isAdmin) {
            console.log('[AuthGuard] Using localStorage user as temporary fallback');
            // Temporarily set as authenticated while we verify with the API
            setIsAuthenticated(true);
            setIsAdmin(true);
          }
        } catch (e) {
          console.error('[AuthGuard] Error parsing local user:', e);
        }
        
        // Get current user from auth service
        const user = authService.getUser();
        console.log('[AuthGuard] Current user from authService:', user);
        
        if (user) {
          console.log('[AuthGuard] User found, setting authenticated');
          setIsAuthenticated(true);
          setIsAdmin(user.is_admin || false);
          setIsChecking(false);
        } else {
          console.log('[AuthGuard] User not loaded yet, triggering session load');
          // Explicitly trigger a session load to ensure we have the latest state
          try {
            console.log('[AuthGuard] Waiting for session refresh to complete...');
            
            // CRITICAL FIX: Wait for the refresh to complete and get the user data directly
            const refreshedUser = await authService.refreshSession();
            console.log('[AuthGuard] Session refresh completed, user:', refreshedUser);
            
            if (refreshedUser) {
              console.log('[AuthGuard] User found after refresh, setting authenticated');
              setIsAuthenticated(true);
              setIsAdmin(refreshedUser.is_admin || false);
            } else {
              // Try one more time to get the user directly
              const finalCheckUser = authService.getUser();
              console.log('[AuthGuard] Final user check:', finalCheckUser);
              
              if (finalCheckUser) {
                console.log('[AuthGuard] User found in final check, setting authenticated');
                setIsAuthenticated(true);
                setIsAdmin(finalCheckUser.is_admin || false);
              } else {
                console.log('[AuthGuard] No user found after all checks, setting not authenticated');
                setIsAuthenticated(false);
              }
            }
            
            // Now we can complete the checking process
            setIsChecking(false);
          } catch (refreshError) {
            console.error('[AuthGuard] Error refreshing session:', refreshError);
            
            // Try to use localStorage as fallback if refresh failed
            try {
              const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
              if (localUser && localUser.isAdmin) {
                console.log('[AuthGuard] Using localStorage user as fallback after refresh error');
                setIsAuthenticated(true);
                setIsAdmin(true);
                setIsChecking(false);
                return;
              }
            } catch (e) {
              console.error('[AuthGuard] Error using localStorage fallback:', e);
            }
            
            setIsAuthenticated(false);
            setIsChecking(false);
          }
        }
      } catch (error) {
        console.error('[AuthGuard] Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };
    
    // Run the initial check
    checkAuth();
    
    // Cleanup subscription
    return () => {
      console.log('[AuthGuard] Cleaning up auth state change listener');
      unsubscribe();
    };
  }, []);

  // Show loading  // Always show loading state while checking
  if (isChecking) {
    console.log('[AuthGuard] Still checking authentication, showing loading state');
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <div className="ml-3 text-gray-700">Verifying access...</div>
    </div>;
  }
  
  // Only redirect if we've completed checking and the user is not authenticated
  if (!isAuthenticated) {
    console.log('[AuthGuard] Not authenticated after checking completed, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If admin access is required but user is not admin, redirect to chat
  if (adminOnly && !isAdmin) {
    console.log('[AuthGuard] Admin access required but user is not admin, redirecting to chat');
    return <Navigate to="/chat" />;
  }
  
  // Special case for RBAC page - always requires admin access
  if (location.pathname === '/rbac' && !isAdmin) {
    console.log('[AuthGuard] RBAC page requires admin access, redirecting to chat');
    return <Navigate to="/chat" />;
  }
  
  // If authenticated and passes admin check (if required), render children
  console.log('[AuthGuard] Authenticated, rendering protected content');
  return <>{children}</>;
}