/**
 * Axios Interceptor for handling API errors
 * Particularly focused on JWT expiration errors
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { authService } from './auth-service';

// Flag to prevent multiple redirects
let isHandlingExpiration = false;

import logger from './logger';
// Setup axios interceptors for global error handling
export function setupAxiosInterceptors() {
  // Response interceptor for handling errors
  axios.interceptors.response.use(
    (response) => {
      // Return successful responses as-is
      return response;
    },
    (error) => {
      logger.error('Axios error intercepted:', error);
      
      // Check if it's a 401 Unauthorized error
      if (error.response && error.response.status === 401 && !isHandlingExpiration) {
        // Get the error message
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.message || 
                           error.message || 
                           'Unauthorized';
        
        console.log('401 error detected:', errorMessage);
        
        // For 401 errors, always treat as authentication failure
        // Set flag to prevent multiple redirects
        isHandlingExpiration = true;
        
        console.log('Authentication failure detected, logging out user and redirecting');
        
        // Clear auth data directly
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        
        // Show toast notification
        toast.error(
          'Your session has expired. Please login again.', 
          { duration: 5000 }
        );
        
        // Log the user out
        authService.logout();
        
        // Dispatch JWT expiration event
        window.dispatchEvent(new Event('jwt-expired'));
        
        // Force redirect to login page
        window.location.href = '/login';
        
        // Reset the flag after a delay to prevent issues with future logins
        setTimeout(() => {
          isHandlingExpiration = false;
        }, 2000);
      }
      
      // Always reject the promise so the calling code knows there was an error
      return Promise.reject(error);
    }
  );
  
  logger.log('Axios interceptors set up successfully');
}
