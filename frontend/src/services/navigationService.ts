import axios from 'axios';
import { NavItem, UserPermissions } from '../types/navigation';
import { API_URL } from '../config';


/**
 * Service for managing navigation permissions and configuration
 */
export const navigationService = {
  /**
   * Get navigation permissions for a specific user
   * @param userId The ID of the user
   * @returns Promise with user permissions
   */
  getUserPermissions: async (userId: string): Promise<UserPermissions> => {
    try {
      const response = await axios.get(`${API_URL}/api/navigation/permissions/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user navigation permissions:', error);
      // Return empty permissions object if API call fails
      return { userId: '', email: '', navPermissions: {} };
    }
  },

  /**
   * Save navigation permissions for a specific user
   * @param userId The ID of the user
   * @param permissions The permissions to save
   * @returns Promise with the saved permissions
   */
  saveUserPermissions: async (userId: string, permissions: UserPermissions): Promise<UserPermissions> => {
    try {
      const response = await axios.post(`${API_URL}/api/navigation/permissions/${userId}`, permissions);
      return response.data;
    } catch (error) {
      console.error('Error saving user navigation permissions:', error);
      throw error;
    }
  },

  /**
   * Get all available navigation items
   * @returns Promise with all navigation items
   */
  getAllNavigationItems: async (): Promise<NavItem[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/navigation/items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      // Return empty array if API call fails
      return [];
    }
  },

  /**
   * Save a navigation item
   * @param item The navigation item to save
   * @returns Promise with the saved item
   */
  saveNavigationItem: async (item: NavItem): Promise<NavItem> => {
    try {
      const response = await axios.post(`${API_URL}/api/navigation/items`, item);
      return response.data;
    } catch (error) {
      console.error('Error saving navigation item:', error);
      throw error;
    }
  },

  /**
   * Delete a navigation item
   * @param itemId The ID of the item to delete
   * @returns Promise with success status
   */
  deleteNavigationItem: async (itemId: string): Promise<{ success: boolean }> => {
    try {
      const response = await axios.delete(`${API_URL}/api/navigation/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      throw error;
    }
  },

  /**
   * Update a navigation item
   * @param item The navigation item to update
   * @returns Promise with the updated item
   */
  updateNavigationItem: async (item: NavItem): Promise<NavItem> => {
    try {
      const response = await axios.put(`${API_URL}/api/navigation/items/${item.id}`, item);
      return response.data;
    } catch (error) {
      console.error('Error updating navigation item:', error);
      throw error;
    }
  }
};
