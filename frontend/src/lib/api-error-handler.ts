/**
 * API Error Handler
 * Centralized error handling for API requests
 */

import { toast } from 'react-hot-toast';
import { authService } from './auth-service';

// Error types
export enum ApiErrorType {
  JWT_EXPIRED = 'JWT_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Function to handle API errors
export function handleApiError(error: any): ApiErrorType {
  console.error('API Error:', error);
  
  // Check if it's a JWT expiration error
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Check for JWT expiration
    if (
      errorMessage.includes('jwt') && 
      (errorMessage.includes('expired') || errorMessage.includes('signature has expired'))
    ) {
      // Show toast notification
      toast.error(
        'Your session has expired. Please login again.', 
        { duration: 5000 }
      );
      
      // Log the user out
      authService.logout();
      
      // Dispatch JWT expiration event
      window.dispatchEvent(new Event('jwt-expired'));
      
      // We don't need to redirect here since the modal will handle it
      
      return ApiErrorType.JWT_EXPIRED;
    }
    
    // Check for deactivated account errors
    if (errorMessage.includes('account has been deactivated') || 
        errorMessage.includes('forbidden') && errorMessage.includes('deactivated')) {
      toast.error('Your account has been deactivated. Please contact an administrator.', { duration: 7000 });
      return ApiErrorType.ACCOUNT_DEACTIVATED;
    }
    
    // Check for other unauthorized errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      toast.error('Authentication error. Please login again.');
      return ApiErrorType.UNAUTHORIZED;
    }
    
    // Check for network errors
    if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
      toast.error('Network error. Please check your connection.');
      return ApiErrorType.NETWORK;
    }
    
    // Check for server errors
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      toast.error('Server error. Please try again later.');
      return ApiErrorType.SERVER;
    }
  }
  
  // Default error handling
  toast.error('An error occurred. Please try again.');
  return ApiErrorType.UNKNOWN;
}

// Function to enhance the handleResponse function used in API services
export async function enhancedHandleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'API request failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      errorMessage = errorText || response.statusText || errorMessage;
    }
    
    // Check for deactivated account error
    if (
      response.status === 403 && 
      (errorMessage.toLowerCase().includes('account has been deactivated') || 
       errorMessage.toLowerCase().includes('deactivated'))
    ) {
      // Show toast notification
      toast.error(
        'Your account has been deactivated. Please contact an administrator.', 
        { duration: 7000 }
      );
      
      // Log the user out to prevent further access attempts
      authService.logout();
      
      // Throw a specific error for deactivated accounts
      throw new Error('Account has been deactivated. Please contact an administrator.');
    }
    
    // Check for JWT expiration in the error message
    if (
      response.status === 401 && 
      (errorMessage.includes('JWT') || errorMessage.includes('token')) && 
      (errorMessage.includes('expired') || errorMessage.includes('signature'))
    ) {
      // Show toast notification
      toast.error(
        'Your session has expired. Please login again.', 
        { duration: 5000 }
      );
      
      // Log the user out
      authService.logout();
      
      // Dispatch JWT expiration event
      window.dispatchEvent(new Event('jwt-expired'));
      
      // We don't need to redirect here since the modal will handle it
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}
