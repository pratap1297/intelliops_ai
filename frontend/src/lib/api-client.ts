/**
 * API Client for IntelliOps Backend
 * Handles all communication with the FastAPI backend
 */

import axios from 'axios';
import { User } from '../types';
import { API_BASE_URL } from '../config';

// API base URL is now imported from the centralized config file

// Enable CORS credentials for cross-origin requests
axios.defaults.withCredentials = true;

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Import enhanced error handling
import { enhancedHandleResponse } from './api-error-handler';

// Use the enhanced response handler that checks for JWT expiration
const handleResponse = enhancedHandleResponse;

// Authentication API
export const authApi = {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ name, email, password })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Login a user
   */
  async login(email: string, password: string) {
    // Create form data for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData
    });
    
    return handleResponse(response);
  },
  
  /**
   * Get current user profile
   */
  async getProfile(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },
  
  /**
   * Update user profile
   */
  async updateProfile(token: string, userData: Partial<User>) {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Change password
   */
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
      method: 'PUT',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Refresh token
   */
  async refreshToken(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  }
};

// RBAC API
export const rbacApi = {
  /**
   * Get all roles (admin only)
   */
  async getRoles(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },
  
  /**
   * Create a new role (admin only)
   */
  async createRole(token: string, role: { name: string, description?: string }) {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(role)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Get user roles
   */
  async getUserRoles(token: string, userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/roles`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },
  
  /**
   * Assign role to user (admin only)
   */
  async assignRole(token: string, userId: number, roleId: number) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role_id: roleId })
    });
    
    return handleResponse(response);
  },
  
  /**
   * Remove role from user (admin only)
   */
  async removeRole(token: string, userId: number, userRoleId: number) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/roles/${userRoleId}`, {
      method: 'DELETE',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return true;
  },
  
  /**
   * Get provider access for a specific user (admin only)
   */
  async getUserProviderAccess(token: string, userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/provider-access/user/${userId}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },
  
  /**
   * Create provider access for a user (admin only)
   */
  async createProviderAccess(token: string, providerAccess: { user_id: number, provider: string, has_access: boolean, is_active: boolean }) {
    const response = await fetch(`${API_BASE_URL}/api/provider-access`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(providerAccess)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Get provider access for a user
   */
  async getProviderAccess(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/provider-access`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },
  
  /**
   * Update provider access (admin only)
   */
  async updateProviderAccess(token: string, userId: number, provider: string, hasAccess: boolean, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/api/provider-access/${provider}`, {
      method: 'PUT',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: userId, has_access: hasAccess, is_active: isActive })
    });
    
    return handleResponse(response);
  }
};
