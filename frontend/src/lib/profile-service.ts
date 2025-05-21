/**
 * Profile Service
 * Handles user profile management
 */

import { User } from '../types';
import { authApi } from './api-client';
import { authService } from './auth-service';

class ProfileService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      return await authApi.getProfile(token);
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const updatedUser = await authApi.updateProfile(token, userData);
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
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      await authApi.changePassword(token, currentPassword, newPassword);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
