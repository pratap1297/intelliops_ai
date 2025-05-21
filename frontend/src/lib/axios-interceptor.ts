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
        
        // Check if it's a JWT expiration error - use broader matching
        if (
          errorMessage.includes('JWT') || 
          errorMessage.includes('token') ||
          errorMessage.includes('validate') ||
          errorMessage.includes('signature') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('unauthorized')
        ) {
          // Set flag to prevent multiple redirects
          isHandlingExpiration = true;
          
          console.log('JWT expiration detected, logging out user and redirecting');
          
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
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }
      }
      
      // Always reject the promise so the calling code knows there was an error
      return Promise.reject(error);
    }
  );
  
  logger.log('Axios interceptors set up successfully');
}
