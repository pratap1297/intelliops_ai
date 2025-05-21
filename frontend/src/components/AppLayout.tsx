import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, Cloud, ChevronDown } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { CloudProvider } from '../types';
import toast from 'react-hot-toast';
import { useNavigation } from '../contexts/NavigationContext';
import { NavItem } from '../types/navigation';
import { API_BASE_URL } from '../config';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Helper function to safely render icons
const renderIcon = (icon: any, props: any = {}) => {
  if (!icon) {
    console.log('No icon provided, using fallback');
    return <Cloud {...props} />; // Fallback icon
  }
  
  try {
    // Handle different types of icon components
    if (typeof icon === 'function') {
      // Direct function component
      const IconComponent = icon;
      return <IconComponent {...props} />;
    } else if (icon.type && typeof icon.type === 'function') {
      // React element with function type
      return React.cloneElement(icon, props);
    } else if (typeof icon === 'object' && icon.$$typeof) {
      // React forward ref component (like Lucide icons)
      const IconComponent = icon;
      return <IconComponent {...props} />;
    } else {
      console.error('Unrecognized icon format:', icon);
      return <Cloud {...props} />; // Fallback icon
    }
  } catch (error) {
    console.error('Error rendering icon:', error);
    return <Cloud {...props} />; // Fallback icon
  }
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeProvider, setActiveProvider] = useState<CloudProvider>('aws');
  const [availableProviders, setAvailableProviders] = useState<Record<CloudProvider, boolean>>({
    aws: false,
    azure: false,
    gcp: false,
    onprem: false
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasAnyProviderAccess, setHasAnyProviderAccess] = useState(false);
  // Add a ref to track if we've already shown a toast about provider access
  const providerAccessToastShownRef = useRef(false);
  
  // Get navigation items from context
  const { userNavItems, isLoading } = useNavigation();
  

  const providerNames: Record<CloudProvider, string> = {
    aws: 'Amazon Web Services',
    azure: 'Microsoft Azure',
    gcp: 'Google Cloud Platform',
    onprem: 'On-Premises Infrastructure'
  };

  // Add ref for dropdown to detect outside clicks
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync active provider when navigating to chat or prompt library page
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const isRestrictedPage = location.pathname === '/chat' || location.pathname === '/prompt-library';
      
      if (isRestrictedPage) {
        // Check if user has any provider access
        const hasAccess = Object.values(availableProviders).some(access => access === true);
        
        // If we haven't loaded provider access yet, fetch it now
        if (!hasAnyProviderAccess && Object.values(availableProviders).every(access => access === false)) {
          console.log('[AppLayout] Provider access not loaded yet, fetching from API');
          
          const fetchProviderAccess = async () => {
            // Call loadAvailableProviders and wait for it to complete
            await loadAvailableProviders();
            
            // Get the latest state directly from the API instead of using the state variable
            // which might not have updated yet
            const token = localStorage.getItem('auth_token');
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userId = currentUser?.id;
            
            if (!token || !userId) {
              console.error('[AppLayout] Missing token or user ID for provider access check');
              return;
            }
            
            try {
              // Ensure API_BASE_URL is properly formatted without trailing slash
              const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
              console.log('[AppLayout] Performing direct API check for provider access');
              
              // Try the provider-access endpoint first
              let response = await fetch(`${apiUrl}/api/provider-access/user/${userId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              // If that fails, try the users endpoint as fallback
              if (!response.ok) {
                console.log(`[AppLayout] First API endpoint failed, trying alternate endpoint`);
                response = await fetch(`${apiUrl}/api/users/${userId}/provider-access`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
              }
              
              if (response.ok) {
                const accessData = await response.json();
                console.log('[AppLayout] Direct API check result:', accessData);
                
                // Directly check if user has access to any provider
                let hasDirectAccess = false;
                let firstAvailableProvider = null;
                
                if (Array.isArray(accessData)) {
                  for (const access of accessData) {
                    if (access.provider && access.has_access === true && access.is_active === true) {
                      hasDirectAccess = true;
                      firstAvailableProvider = access.provider;
                      break;
                    }
                  }
                }
                
                console.log('[AppLayout] Direct API check result - hasAccess:', hasDirectAccess, 'firstAvailable:', firstAvailableProvider);
                
                // Now check again after loading - use the direct API result instead of state
                const hasAccessAfterLoad = hasDirectAccess;
                
                if (!hasAccessAfterLoad) {
                  console.log('[AppLayout] User has no provider access after API check, redirecting to profile page');
                  // Only show toast if we haven't shown one already and we're not on the profile page
                  if (location.pathname !== '/profile' && !providerAccessToastShownRef.current) {
                    toast.error('You need provider access to use this feature. Please contact your administrator.');
                    providerAccessToastShownRef.current = true;
                  }
                  navigate('/profile');
                } else {
                  // Update the flag for future checks
                  setHasAnyProviderAccess(true);
                  
                  // If we have a first available provider from the direct API check, use it
                  if (firstAvailableProvider) {
                    console.log('[AppLayout] Setting active provider to first available from API:', firstAvailableProvider);
                    setActiveProvider(firstAvailableProvider as CloudProvider);
                    // Save to localStorage for persistence
                    localStorage.setItem('selectedProvider', firstAvailableProvider);
                  } else {
                    // Fallback to checking the state
                    // Find the first available provider if current one is not available
                    const currentProviderAvailable = availableProviders[activeProvider] === true;
                    if (!currentProviderAvailable) {
                      console.log('[AppLayout] Current provider not available, finding first available one');
                      const firstAvailableProvider = Object.entries(availableProviders)
                        .find(([_, hasAccess]) => hasAccess === true)?.[0] as CloudProvider;
                        
                      if (firstAvailableProvider) {
                        console.log('[AppLayout] Setting active provider to first available:', firstAvailableProvider);
                        setActiveProvider(firstAvailableProvider);
                        // Save to localStorage for persistence
                        localStorage.setItem('selectedProvider', firstAvailableProvider);
                      }
                    } else {
                      // Current provider is available, just sync with localStorage if needed
                      const savedProvider = localStorage.getItem('selectedProvider');
                      if (savedProvider && savedProvider !== activeProvider && availableProviders[savedProvider as CloudProvider]) {
                        console.log('[AppLayout] Syncing active provider with localStorage:', savedProvider);
                        setActiveProvider(savedProvider as CloudProvider);
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('[AppLayout] Error during direct API check:', error);
              // Fall back to using the state variable
              const hasAccessAfterLoad = Object.values(availableProviders).some(access => access === true);
              
              if (!hasAccessAfterLoad) {
                console.log('[AppLayout] User has no provider access after state check, redirecting to profile page');
                // Only show toast if we haven't shown one already and we're not on the profile page
                if (location.pathname !== '/profile' && !providerAccessToastShownRef.current) {
                  toast.error('You need provider access to use this feature. Please contact your administrator.');
                  providerAccessToastShownRef.current = true;
                }
                navigate('/profile');
              }
            }
          };
          
          fetchProviderAccess();
          return; // Exit early to avoid double redirect
        }
        
        // Only redirect if user has no provider access
        if (!hasAccess) {
          console.log('[AppLayout] User has no provider access, redirecting to profile page');
          // Only show toast if we haven't shown one already and we're not on the profile page
          if (location.pathname !== '/profile' && !providerAccessToastShownRef.current) {
            toast.error('You need provider access to use this feature. Please contact your administrator.');
            providerAccessToastShownRef.current = true;
          }
          navigate('/profile');
        } else {
          // Sync active provider with localStorage when navigating to restricted pages
          const savedProvider = localStorage.getItem('selectedProvider');
          if (savedProvider && savedProvider !== activeProvider) {
            console.log('[AppLayout] Syncing active provider with localStorage:', savedProvider);
            setActiveProvider(savedProvider as CloudProvider);
          }
        }
      }
    }
  }, [location.pathname, isAuthenticated, isLoading, navigate, activeProvider, availableProviders]);

  useEffect(() => {
    // Check authentication status
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setIsAuthenticated(true);
      
      // Load available providers based on user access rights
      // Since loadAvailableProviders is now async, we need to handle it properly
      const fetchProviders = async () => {
        await loadAvailableProviders();
        
        // Set active provider from localStorage if available
        const savedProvider = localStorage.getItem('selectedProvider');
        if (savedProvider) {
          setActiveProvider(savedProvider as CloudProvider);
        }
      };
      
      fetchProviders();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Add listener for provider changed events
  useEffect(() => {
    const handleProviderChanged = (event: CustomEvent) => {
      const { provider } = event.detail;
      setActiveProvider(provider as CloudProvider);
    };
    
    // Add event listener for provider changes
    document.addEventListener('providerChanged', handleProviderChanged as EventListener);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('providerChanged', handleProviderChanged as EventListener);
    };
  }, []);

  // Reset the toast shown flag when the component mounts or when the user changes
  useEffect(() => {
    providerAccessToastShownRef.current = false;
  }, [location.pathname]);

  // Add a listener for user access changes
  useEffect(() => {
    const handleAccessChanged = (event: CustomEvent) => {
      console.log('[AppLayout] Received userAccessChanged event', event.detail);
      
      // If the event contains detailed information about the changed user access
      if (event.detail) {
        const { userId, email, providers } = event.detail;
        
        // Check if this update affects the current user
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            const isCurrentUser = 
              currentUser.email === email || 
              (currentUser.id && (currentUser.id.toString() === userId || currentUser.id === userId));
            
            if (isCurrentUser) {
              console.log('[AppLayout] Current user\'s access changed, updating available providers');
              // Directly update available providers from the event data
              setAvailableProviders(providers);
              
              // Update hasAnyProviderAccess flag
              const hasAccess = Object.values(providers).some(access => access === true);
              setHasAnyProviderAccess(hasAccess);
              
              // Check if current provider is still available
              if (!providers[activeProvider]) {
                console.log('[AppLayout] Current provider no longer available, switching to first available');
                // Find first available provider
                const firstAvailableProvider = Object.entries(providers)
                  .find(([_, hasAccess]) => hasAccess === true)?.[0] as CloudProvider;
                  
                if (firstAvailableProvider) {
                  console.log('[AppLayout] Switching to provider:', firstAvailableProvider);
                  handleProviderChange(firstAvailableProvider);
                }
              }
              
              return; // No need to call loadAvailableProviders if we've already updated
            }
          } catch (e) {
            console.error('[AppLayout] Error processing userAccessChanged event:', e);
          }
        }
      }
      
      // If we couldn't use the event data directly, fall back to reloading all providers
      console.log('[AppLayout] Falling back to reloading all available providers');
      // Since loadAvailableProviders is async, we need to handle it properly
      const fetchProviders = async () => {
        await loadAvailableProviders();
      };
      fetchProviders();
    };
    
    // Listen for the custom event dispatched by RbacPage when access changes
    document.addEventListener('userAccessChanged', handleAccessChanged as EventListener);
    
    return () => {
      document.removeEventListener('userAccessChanged', handleAccessChanged as EventListener);
    };
  }, [activeProvider]); // Add activeProvider as a dependency

  // Function to load available providers based on user access
  const loadAvailableProviders = async () => {
    try {
      // Get current user from localStorage
      let currentUser = null;
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr);
        } catch (e) {
          console.error('[AppLayout] Error parsing currentUser:', e);
        }
      }
      
      if (!currentUser || !currentUser.id) {
        console.warn('[AppLayout] No current user found or missing ID, cannot load provider access');
        return;
      }
      
      console.log('[AppLayout] Current user:', currentUser);
      
      // Get auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('[AppLayout] No auth token found, cannot fetch provider access');
        return;
      }
      
      // Fetch provider access from API with fallback mechanism
      let providerAccess = null;
      
      try {
        // Ensure API_BASE_URL is properly formatted without trailing slash
        const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        console.log('[AppLayout] Fetching provider access from API for user:', currentUser.id);
        
        // Try the provider-access endpoint first
        let response = await fetch(`${apiUrl}/api/provider-access/user/${currentUser.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If that fails, try the users endpoint as fallback
        if (!response.ok) {
          console.log(`[AppLayout] First API endpoint failed, trying alternate endpoint`);
          response = await fetch(`${apiUrl}/api/users/${currentUser.id}/provider-access`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (response.ok) {
          const accessData = await response.json();
          console.log('[AppLayout] Successfully fetched provider access:', accessData);
          
          // Convert the API response to the format needed by the UI
          if (Array.isArray(accessData)) {
            providerAccess = {
              aws: false,
              azure: false,
              gcp: false,
              onprem: false
            };
            
            console.log('[AppLayout] Processing provider access data:', accessData);
            
            // Process each provider access entry
            accessData.forEach((access: any) => {
              // Log each provider access entry for debugging
              console.log('[AppLayout] Provider access entry:', access);
              
              if (access.provider && access.has_access === true && access.is_active === true) {
                providerAccess[access.provider] = true;
                console.log(`[AppLayout] Setting ${access.provider} access to true`);
              }
            });
            
            // Log the final provider access state
            console.log('[AppLayout] Final provider access state:', providerAccess);
          }
        } else {
          console.warn(`[AppLayout] Could not fetch provider access for user ${currentUser.id}`);
        }
      } catch (error) {
        console.error('[AppLayout] Error fetching provider access:', error);
      }
      
      // If we found provider access, update the UI
      if (providerAccess) {
        console.log('[AppLayout] Setting available providers:', providerAccess);
        setAvailableProviders(providerAccess);
        
        // Check if user has access to any provider
        const hasAccess = Object.values(providerAccess).some(access => access === true);
        setHasAnyProviderAccess(hasAccess);
        
        // Check if current provider is still available
        if (!providerAccess[activeProvider]) {
          console.log('[AppLayout] Current provider no longer available, switching to first available');
          // Find first available provider
          const firstAvailableProvider = Object.entries(providerAccess)
            .find(([_, hasAccess]) => hasAccess === true)?.[0] as CloudProvider;
            
          if (firstAvailableProvider) {
            console.log('[AppLayout] Switching to provider:', firstAvailableProvider);
            // Save to localStorage for persistence
            localStorage.setItem('selectedProvider', firstAvailableProvider);
            setActiveProvider(firstAvailableProvider);
            
            // Don't redirect to profile page since we found an available provider
            setHasAnyProviderAccess(true);
          }
        } else {
          console.log('[AppLayout] Current provider still available:', activeProvider);
        }
      } else {
        console.warn('[AppLayout] No provider access found for current user, using defaults');
        // Set default providers if no specific access is found
        setAvailableProviders({
          aws: false,
          azure: false,
          gcp: false,
          onprem: false
        });
        
        // User has no provider access
        setHasAnyProviderAccess(false);
        
        // If user is on a restricted page, redirect to profile, but only if we've already tried to fetch provider access
        if ((location.pathname === '/chat' || location.pathname === '/prompt-library')) {
          // Perform a direct API check instead of relying on state
          const checkProviderAccessDirectly = async () => {
            const token = localStorage.getItem('auth_token');
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userId = currentUser?.id;
            
            if (!token || !userId) {
              console.error('[AppLayout] Missing token or user ID for provider access check');
              return;
            }
            
            try {
              // Ensure API_BASE_URL is properly formatted without trailing slash
              const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
              console.log('[AppLayout] Performing direct API check for provider access in restricted page');
              
              // Try the provider-access endpoint first
              let response = await fetch(`${apiUrl}/api/provider-access/user/${userId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              // If that fails, try the users endpoint as fallback
              if (!response.ok) {
                console.log(`[AppLayout] First API endpoint failed, trying alternate endpoint`);
                response = await fetch(`${apiUrl}/api/users/${userId}/provider-access`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
              }
              
              if (response.ok) {
                const accessData = await response.json();
                console.log('[AppLayout] Direct API check result for restricted page:', accessData);
                
                // Directly check if user has access to any provider
                let hasDirectAccess = false;
                let firstAvailableProvider = null;
                
                if (Array.isArray(accessData)) {
                  for (const access of accessData) {
                    if (access.provider && access.has_access === true && access.is_active === true) {
                      hasDirectAccess = true;
                      firstAvailableProvider = access.provider;
                      break;
                    }
                  }
                }
                
                console.log('[AppLayout] Direct API check result for restricted page - hasAccess:', hasDirectAccess, 'firstAvailable:', firstAvailableProvider);
                
                if (!hasDirectAccess) {
                  console.log('[AppLayout] User has no provider access after direct API check, redirecting to profile page');
                  // Only show toast if we haven't shown one already and we're not on the profile page
                  if (location.pathname !== '/profile' && !providerAccessToastShownRef.current) {
                    toast.error('You need provider access to use this feature. Please contact your administrator.');
                    providerAccessToastShownRef.current = true;
                  }
                  navigate('/profile');
                } else {
                  // We found provider access, update the flag
                  setHasAnyProviderAccess(true);
                  
                  // If we have a first available provider from the direct API check, use it
                  if (firstAvailableProvider) {
                    console.log('[AppLayout] Setting active provider to first available from API in restricted page:', firstAvailableProvider);
                    setActiveProvider(firstAvailableProvider as CloudProvider);
                    // Save to localStorage for persistence
                    localStorage.setItem('selectedProvider', firstAvailableProvider);
                  }
                }
              } else {
                // Fallback to state check if API call fails
                const hasAnyAccess = Object.values(availableProviders).some(access => access === true);
                
                if (!hasAnyAccess) {
                  console.log('[AppLayout] User has no provider access after state check in restricted page, redirecting to profile page');
                  // Only show toast if we haven't shown one already and we're not on the profile page
                  if (location.pathname !== '/profile' && !providerAccessToastShownRef.current) {
                    toast.error('You need provider access to use this feature. Please contact your administrator.');
                    providerAccessToastShownRef.current = true;
                  }
                  navigate('/profile');
                }
              }
            } catch (error) {
              console.error('[AppLayout] Error during direct API check in restricted page:', error);
            }
          };
          
          // Execute the direct API check
          checkProviderAccessDirectly();
        }
      }
      
      // Store the current provider access in localStorage for other components to use
      try {
        const existingAccess = JSON.parse(localStorage.getItem('user_access') || '[]');
        
        // Check if we need to update the current user's access
        if (providerAccess && currentUser) {
          let userExists = false;
          
          const updatedAccessList = existingAccess.map((access: any) => {
            // Check if this is the current user
            const isCurrentUser = 
              (access.email && currentUser.email && access.email === currentUser.email) ||
              (access.userId && currentUser.id && (
                access.userId === currentUser.id || 
                access.userId === currentUser.id.toString()
              )) ||
              (access.id && currentUser.id && (
                access.id === currentUser.id || 
                access.id === currentUser.id.toString()
              ));
              
            if (isCurrentUser) {
              userExists = true;
              // Update with the latest provider access
              return {
                ...access,
                providers: providerAccess
              };
            }
            return access;
          });
          
          // If user doesn't exist in the list, add them
          if (!userExists && currentUser) {
            updatedAccessList.push({
              userId: currentUser.id,
              id: currentUser.id,
              email: currentUser.email,
              userName: currentUser.name || currentUser.email,
              providers: providerAccess
            });
          }
          
          // Save the updated list back to localStorage
          localStorage.setItem('user_access', JSON.stringify(updatedAccessList));
        }
      } catch (error) {
        console.error('[AppLayout] Error updating user_access in localStorage:', error);
      }
    } catch (error) {
      console.error('[AppLayout] Error loading available providers:', error);
    }
  };

  const handleNewChat = () => {
    try {
      // Clear any selected chat thread if there is one
      localStorage.removeItem('selected_thread');
      
      // Clear any current messages in localStorage
      const currentSessionId = localStorage.getItem('current_session_id');
      if (currentSessionId) {
        localStorage.removeItem(`messages_${currentSessionId}`);
        localStorage.removeItem('current_session_id');
      }
      
      // Dispatch an event for the App component to listen for
      const event = new CustomEvent('newChatRequested');
      document.dispatchEvent(event);
      
      // Log the action
      console.log('Starting new chat... cleared previous session:', currentSessionId);
      
      // Navigate to the chat page if not already there
      if (location.pathname !== '/chat') {
        navigate('/chat');
      }
      // Don't force a page refresh - let the event handler take care of the state reset
      
      // Close the provider dropdown if it's open
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  // Add a more robust handler for the cloud provider click with backend validation
  const handleProviderChange = async (providerId: CloudProvider) => {
    try {
      // First, validate with the backend that the user has access to this provider
      const rbacService = await import('../lib/rbac-service').then(module => module.rbacService);
      
      // Refresh provider access from the backend to ensure we have the latest permissions
      await rbacService.getProviderAccess();
      
      // Check if the user has access to the selected provider
      const hasAccess = rbacService.hasProviderAccess(providerId);
      
      if (!hasAccess) {
        console.error(`User does not have access to ${providerId} provider`);
        toast.error(`You don't have access to the ${providerNames[providerId]} provider`);
        return;
      }
      
      // If validation passes, update the UI state
      setActiveProvider(providerId);
      setIsDropdownOpen(false);
      
      // Save provider selection to localStorage for persistence
      localStorage.setItem('selectedProvider', providerId);
      
      // Dispatch a custom event so other components can respond to provider changes
      const event = new CustomEvent('providerChanged', { 
        detail: { provider: providerId } 
      });
      document.dispatchEvent(event);
      
      console.log(`Cloud provider changed to: ${providerId}`, providerNames[providerId]);
      toast.success(`Switched to ${providerNames[providerId]} provider`);
    } catch (error) {
      console.error('Error changing provider:', error);
      toast.error('Failed to change provider. Please try again.');
    }
  };

  // Handle user logout
  // Logout is handled by the UserProfileDropdown component

  if (!isAuthenticated || isLoading) {
    return null; // Don't render anything while checking authentication or loading navigation
  }

  // If user is on a restricted page but has no provider access, show a message instead of the page content
  const isRestrictedPage = location.pathname === '/chat' || location.pathname === '/prompt-library';
  if (isRestrictedPage && !hasAnyProviderAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        {/* <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Provider Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need access to at least one provider to use this feature. Please contact your administrator.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Profile
          </button>
        </div> */}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Sidebar */}
      <div className="w-16 bg-[#f5f5f5] flex flex-col items-center py-4 border-r border-gray-200 flex-shrink-0">
        {/* Logo removed as requested */}
        <nav className="flex-1 flex flex-col items-center gap-4">
          {/* Dynamic sidebar navigation items */}
          {userNavItems
            .filter((item: NavItem) => item.position === 'sidebar' && item.isEnabled)
            .sort((a: NavItem, b: NavItem) => a.order - b.order)
            .map((item: NavItem) => {
              // Special case for new chat button which needs onClick handler
              if (item.id === 'new-chat' && (location.pathname === '/chat' || location.pathname === '/prompt-library')) {
                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={handleNewChat}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        location.pathname === item.path && !location.search
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
                      }`}
                      aria-label={item.title}
                    >
                      {renderIcon(item.icon, { className: "w-5 h-5" })}
                    </button>
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
                      {item.tooltip}
                    </div>
                  </div>
                );
              }
              
              // Regular navigation links
              return (
                <div key={item.id} className="group relative">
                  <Link
                    to={item.path}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      (item.path === '/' ? location.pathname === item.path : location.pathname.startsWith(item.path))
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
                    }`}
                    aria-label={item.title}
                  >
                    {renderIcon(item.icon, { className: "w-5 h-5" })}
                  </Link>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
                    {item.tooltip}
                  </div>
                </div>
              );
            })}
        </nav>
        
        {/* Bottom navigation items */}
        <nav className="flex flex-col items-center gap-4">
          {userNavItems
            .filter((item: NavItem) => item.position === 'bottom' && item.isEnabled)
            .sort((a: NavItem, b: NavItem) => a.order - b.order)
            .map((item: NavItem) => (
              <div key={item.id} className="group relative">
                <Link
                  to={item.path}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
                  }`}
                  aria-label={item.title}
                >
                  {renderIcon(item.icon, { className: `w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'text-gray-500'}` })}
                </Link>
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
                  {item.tooltip}
                </div>
              </div>
            ))}
        </nav>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top navigation bar with app name and user profile */}
      <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        {/* App logo and name */}
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            AI Force IntelliOps
          </span>
        </div>

          {/* Right side with cloud provider, new chat and user profile */}
          <div className="flex items-center gap-3">
            {/* Cloud Provider Dropdown - Only show on chat and prompt library pages */}
            {(location.pathname === '/chat' || location.pathname === '/prompt-library') && hasAnyProviderAccess && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">{providerNames[activeProvider]}</span>
                  <span className="md:hidden">{activeProvider.toUpperCase()}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(providerNames)
                      .filter(([id]) => availableProviders[id as CloudProvider])
                      .map(([id, name]) => (
                      <button
                        key={id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProviderChange(id as CloudProvider);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer ${
                          activeProvider === id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <Cloud className={`w-4 h-4 ${activeProvider === id ? 'text-blue-600' : 'text-gray-400'}`} />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Chat Button */}
            {(location.pathname === '/chat' || location.pathname === '/prompt-library') && hasAnyProviderAccess && (
              <button 
                onClick={handleNewChat}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden md:inline">New Chat</span>
              </button>
            )}
            
            {/* User Profile Dropdown */}
            <UserProfileDropdown />
          </div>
        </div>
        
        {/* Main scrollable content - make sure it fills available space */}
        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </div>
    </div>
  );
}
