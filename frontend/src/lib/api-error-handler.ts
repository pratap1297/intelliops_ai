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
    console.log('[APIErrorHandler] Original errorText:', errorText); // Cascade Log 1
    let errorMessage = 'API request failed';
    
    try {
      const errorData = JSON.parse(errorText);
      console.log('[APIErrorHandler] Parsed errorData:', errorData, 'Type:', typeof errorData); // Cascade Log 2
      if (typeof errorData === 'object' && errorData !== null) {
        // Handle nested error messages
        errorMessage = String(
          errorData.detail ||
          errorData.message ||
          (errorData.error && typeof errorData.error === 'object' ? JSON.stringify(errorData.error) : errorData.error) ||
          JSON.stringify(errorData) ||
          errorMessage
        );
        console.log('[APIErrorHandler] Parts: detail:', errorData.detail, 'message:', errorData.message, 'error:', errorData.error); // Cascade Log 3
      } else {
        errorMessage = String(errorData || errorMessage);
      }
    } catch (e) {
      console.log('[APIErrorHandler] JSON.parse failed. Error:', e); // Cascade Log 4
      errorMessage = String(errorText || response.statusText || errorMessage);
    }
    console.log('[APIErrorHandler] Intermediate errorMessage:', errorMessage); // Cascade Log 5
    
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
    
    // Handle specific error cases
    if (response.status === 401) {
      // For login failures, provide a user-friendly message
      throw new Error('Invalid email or password. Please try again.');
    } else {
      // For other errors, make sure we're not passing an object directly to the Error constructor
      const finalErrorMessage = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : String(errorMessage);
      console.log('[APIErrorHandler] Final errorMessage before throw:', finalErrorMessage);
      throw new Error(finalErrorMessage);
    }
  }
  
  return response.json();
}
