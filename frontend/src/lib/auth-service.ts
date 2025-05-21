/**
 * Authentication Service
 * Handles user authentication with the FastAPI backend
 */

import { User } from '../types';
import { authApi } from './api-client';
import { AUTH_TOKEN, AUTH_USER } from '../constants/storageKeys';
import { API_URL } from '../config';
import { ENDPOINTS } from '../constants/appConstants';

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    console.log('[AuthService] Initializing auth service');
    // Initialize with stored token
    this.loadSession();
  }

  /**
   * Load session from localStorage
   */
  private async loadSession() {
    console.log('[AuthService] Loading session');
    const token = localStorage.getItem(AUTH_TOKEN);
    console.log('[AuthService] Token from localStorage:', token ? 'exists' : 'not found');
    
    // Don't reset user to null at the beginning to prevent flashing of login screen
    // Only set it to null if validation fails or no token exists
    
    if (token) {
      // Store token in memory for immediate access
      this.token = token;
      
      try {
        console.log('[AuthService] Validating token by fetching user profile');
        const userData = await authApi.getProfile(token);
        console.log('[AuthService] User profile fetched successfully:', userData);
        
        // Set the user data after successful validation
        this.user = userData;
        
        // Notify listeners after user is set
        this.notifyListeners();
        console.log('[AuthService] Listeners notified of authentication');
        return userData; // Return the user data for use in refreshSession
      } catch (error) {
        console.error('[AuthService] Error validating token:', error);
        
        // Check if the error is related to token expiration
        const errorMessage = error instanceof Error && error.message ? error.message.toLowerCase() : '';
        const isTokenExpired = 
          errorMessage.includes('jwt') || 
          errorMessage.includes('token') || 
          errorMessage.includes('validate credentials') || 
          errorMessage.includes('signature has expired') || 
          errorMessage.includes('unauthorized');
          
        if (isTokenExpired) {
          console.log('[AuthService] Token appears to be expired or invalid, clearing session');
          // Clear everything and redirect to login
          localStorage.removeItem(AUTH_TOKEN);
          localStorage.removeItem(AUTH_USER);
          this.token = null;
          this.user = null;
          this.notifyListeners();
          console.log('[AuthService] Session cleared due to token expiration');
          
          // Redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
          
          return null;
        }
        
        // Only use fallback for non-token related errors
        try {
          const localUser = JSON.parse(localStorage.getItem(AUTH_USER) || 'null');
          if (localUser) {
            console.log('[AuthService] Using fallback user data from localStorage:', localUser);
            const fallbackUser = {
              id: 1,
              name: localUser.name || localUser.email.split('@')[0],
              email: localUser.email,
              is_admin: localUser.isAdmin || false,
              is_authenticated: true
            };
            this.user = fallbackUser;
            this.notifyListeners();
            console.log('[AuthService] Listeners notified with fallback user data');
            return fallbackUser;
          }
        } catch (fallbackError) {
          console.error('[AuthService] Error using fallback user data:', fallbackError);
        }
        
        // If fallback fails, clear everything
        localStorage.removeItem('auth_token');
        this.token = null;
        this.user = null;
        this.notifyListeners();
        console.log('[AuthService] Listeners notified of authentication failure');
        return null;
      }
    } else {
      // No token found, ensure user is null and notify listeners
      this.token = null;
      this.user = null;
      this.notifyListeners();
      console.log('[AuthService] No token found, notified listeners of unauthenticated state');
      return null;
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(token: string, user: User) {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    this.notifyListeners();
  }

  /**
   * Clear session
   */
  private clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    this.notifyListeners();
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners() {
    console.log('[AuthService] Notifying', this.listeners.length, 'listeners of auth state change');
    console.log('[AuthService] Current user state:', this.user);
    // Make a copy of listeners array to avoid issues if listeners are added/removed during notification
    const currentListeners = [...this.listeners];
    currentListeners.forEach(listener => listener(this.user));
  }

  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await authApi.register(name, email, password);
      this.saveSession(response.access_token, response.user);
      return response.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login a user
   */
  public async login(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting login for:', email);
      const response = await authApi.login(email, password);
      console.log('[AuthService] Login successful, response received:', response);
      
      // Store the token
      const token = response.access_token;
      if (!token) {
        console.error('[AuthService] No token found in login response');
        throw new Error('No token found in login response');
      }
      
      console.log('[AuthService] Storing token in localStorage');
      localStorage.setItem('auth_token', token);
      this.token = token; // Also store in memory for immediate use
      
      // If the response includes user data, use it directly
      if (response.user) {
        console.log('[AuthService] User data received from login response:', response.user);
        // Convert backend user format to frontend user format if needed
        this.user = {
          id: response.user.id,
          name: response.user.name || email.split('@')[0],
          email: response.user.email,
          is_admin: response.user.is_admin,
          is_authenticated: true
        };
        
        // Store user data in localStorage for fallback
        localStorage.setItem('currentUser', JSON.stringify(this.user));
        this.notifyListeners();
        console.log('[AuthService] User set from login response:', this.user);
      } else {
        // If no user data in response, load it from the profile endpoint
        console.log('[AuthService] No user data in response, loading from profile endpoint');
        await this.loadSession();
        
        // Double-check that the user was properly set
        if (!this.user) {
          console.warn('[AuthService] User not set after loadSession, using fallback');
          // Use fallback user data if API failed
          const fallbackUser = {
            id: 1,
            name: email.split('@')[0],
            email: email,
            is_admin: email === 'admin@intelliops.com',
            is_authenticated: true
          };
          this.user = fallbackUser;
          localStorage.setItem(AUTH_USER, JSON.stringify(fallbackUser));
          this.notifyListeners();
        }
      }
      
      console.log('[AuthService] Login complete, user profile loaded:', this.user);
      return response;
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      // Ensure user is null and listeners are notified on login failure
      this.user = null;
      this.notifyListeners();
      throw error;
    }
  }
  
  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.token) {
        throw new Error('No token to refresh');
      }
      
      // Call the token refresh endpoint
      const response = await authApi.refreshToken(this.token);
      
      if (response.access_token) {
        // Update the token
        this.token = response.access_token;
        localStorage.setItem(AUTH_TOKEN, response.access_token);
        
        // Fetch the user profile with the new token
        try {
          const userData = await authApi.getProfile(response.access_token);
          this.user = userData;
          this.notifyListeners();
          return true;
        } catch (profileError) {
          console.error('Failed to get user profile after token refresh:', profileError);
          return false;
        }
      } else {
        throw new Error('Token refresh response did not contain an access token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Logout the current user
   */
  public logout(): void {
    console.log('[AuthService] Logging out user');
    // Clear both auth_token and currentUser from localStorage
    localStorage.removeItem(AUTH_TOKEN);
    localStorage.removeItem(AUTH_USER);
    
    // Reset in-memory state
    this.token = null;
    this.user = null;
    
    // Notify listeners of logout
    this.notifyListeners();
    console.log('[AuthService] User logged out, all state cleared');
  }

  /**
   * Get the current user
   */
  public getUser(): User | null {
    return this.user;
  }

  /**
   * Get the current token
   */
  public getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
  
  /**
   * Refresh the current session by reloading user data
   * @returns The user data if successful, null otherwise
   */
  public async refreshSession(): Promise<User | null> {
    console.log('[AuthService] Refreshing session');
    return await this.loadSession();
  }

  /**
   * Check if a user is authenticated
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    
    // First check for a token
    if (!token) {
      console.log('[AuthService] No token found, user is not authenticated');
      return false;
    }
    
    // If we have a token, check if we have a user object
    if (this.user) {
      console.log('[AuthService] Token and user exist, user is authenticated');
      return true;
    }
    
    // If we have a token but no user, check localStorage for fallback
    try {
      const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (localUser) {
        console.log('[AuthService] Using localStorage user for authentication check:', localUser);
        // We have a token and a localStorage user, consider authenticated
        return true;
      }
    } catch (e) {
      console.error('[AuthService] Error checking localStorage user:', e);
    }
    
    // If we have a token but no user yet, the session might still be loading
    console.log('[AuthService] Token exists but no user yet, session might still be loading');
    
    // Return false for now, but the AuthGuard will handle the actual verification
    return false;
  }

  /**
   * Check if the current user is an admin
   */
  isAdmin(): boolean {
    return !!this.user?.is_admin;
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedUser = await authApi.updateProfile(this.token, userData);
      this.user = updatedUser;
      this.notifyListeners();
      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      await authApi.changePassword(this.token, currentPassword, newPassword);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (user: User | null) => void): () => void {
    console.log('[AuthService] Adding auth state change listener');
    
    // Add a unique ID to the callback for better debugging
    const listenerId = this.listeners.length;
    console.log('[AuthService] Assigned listener ID:', listenerId);
    
    // Add the callback to our listeners array
    this.listeners.push(callback);
    
    // Check if we need to load the session first
    const token = localStorage.getItem('auth_token');
    if (token && !this.user) {
      console.log('[AuthService] Token exists but no user, triggering session load before notifying listener', listenerId);
      // Don't await this - it will notify listeners when complete
      this.loadSession().then(user => {
        console.log('[AuthService] Session loaded for listener', listenerId, ', user:', user);
      }).catch(error => {
        console.error('[AuthService] Error loading session for listener', listenerId, ':', error);
      });
    } else {
      // Immediately call with current state
      console.log('[AuthService] Immediately calling listener', listenerId, 'with current state:', this.user);
      callback(this.user);
    }
    
    // Return unsubscribe function
    return () => {
      console.log('[AuthService] Removing auth state change listener', listenerId);
      this.listeners = this.listeners.filter(l => l !== callback);
      console.log('[AuthService] Remaining listeners:', this.listeners.length);
    };
  }
}

// Export a singleton instance
export const authService = new AuthService();
