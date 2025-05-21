import React, { createContext, useContext, useEffect, useState } from 'react';
import { providerAccessService } from '../lib/provider-access-service';
import { authService } from '../lib/auth-service';

interface ProviderAccessContextType {
  hasProviderAccess: boolean;
  isCheckingAccess: boolean;
  checkProviderAccess: () => Promise<boolean>;
}

const defaultContext: ProviderAccessContextType = {
  hasProviderAccess: true, // Default to true to prevent unnecessary redirects
  isCheckingAccess: true,
  checkProviderAccess: async () => true
};

const ProviderAccessContext = createContext<ProviderAccessContextType>(defaultContext);

export const useProviderAccess = () => useContext(ProviderAccessContext);

interface ProviderAccessProviderProps {
  children: React.ReactNode;
}

export const ProviderAccessProvider: React.FC<ProviderAccessProviderProps> = ({ children }) => {
  const [hasProviderAccess, setHasProviderAccess] = useState<boolean>(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  // Function to check provider access
  const checkProviderAccess = async (): Promise<boolean> => {
    try {
      // Skip check if not authenticated
      if (!authService.isAuthenticated()) {
        setIsCheckingAccess(false);
        setHasProviderAccess(true); // Default to true for unauthenticated users
        return true;
      }

      // Check if we already have a cached result in localStorage
      const cachedAccess = localStorage.getItem('user_provider_access');
      if (cachedAccess !== null) {
        const hasAccess = cachedAccess === 'true';
        console.log('Using cached provider access:', hasAccess);
        setHasProviderAccess(hasAccess);
        setIsCheckingAccess(false);
        return hasAccess;
      }

      // If no cache, check if user has access to any provider
      console.log('Checking provider access from API...');
      const hasAccess = await providerAccessService.hasAccess();
      console.log('Provider access result:', hasAccess);
      
      // Cache the result in localStorage
      localStorage.setItem('user_provider_access', hasAccess.toString());
      
      setHasProviderAccess(hasAccess);
      setIsCheckingAccess(false);
      return hasAccess;
    } catch (error) {
      console.error('Error checking provider access:', error);
      // Default to allowing access in case of error
      setHasProviderAccess(true);
      setIsCheckingAccess(false);
      return true;
    }
  };

  // Check provider access when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      // Reset checking state
      setIsCheckingAccess(true);
      // Reset provider access service cache
      providerAccessService.resetAccessCheck();
      // Check access again
      checkProviderAccess();
    };

    // Subscribe to auth state changes
    window.addEventListener('auth-state-changed', handleAuthChange);
    
    // Initial check
    checkProviderAccess();

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

  return (
    <ProviderAccessContext.Provider value={{ hasProviderAccess, isCheckingAccess, checkProviderAccess }}>
      {children}
    </ProviderAccessContext.Provider>
  );
};
