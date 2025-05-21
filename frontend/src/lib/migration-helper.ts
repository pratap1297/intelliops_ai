/**
 * Migration Helper
 * Helps migrate data from localStorage to PostgreSQL database
 */

import { authService } from './auth-service';

interface LocalUser {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
  password?: string;
}

class MigrationHelper {
  /**
   * Migrate user data from localStorage to PostgreSQL
   * This should be called after a successful login to the new system
   */
  async migrateUserData(): Promise<boolean> {
    try {
      // Check if migration has already been performed
      if (localStorage.getItem('migration_completed')) {
        console.log('Migration already completed');
        return true;
      }

      // Get current authenticated user
      const currentUser = authService.getUser();
      if (!currentUser) {
        console.error('No authenticated user found');
        return false;
      }

      // Migrate user data
      await this.migrateUserSettings(currentUser.id);
      
      // Mark migration as completed
      localStorage.setItem('migration_completed', 'true');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  /**
   * Migrate user settings from localStorage
   */
  private async migrateUserSettings(userId: number): Promise<void> {
    // Example of migrating user settings
    const userSettings = localStorage.getItem('user_settings');
    if (userSettings) {
      try {
        const parsedSettings = JSON.parse(userSettings);
        // Here you would call an API to save these settings to PostgreSQL
        console.log('Migrated user settings for user ID:', userId, 'with settings:', parsedSettings);
      } catch (e) {
        console.error('Failed to parse user settings:', e);
      }
    }
  }

  /**
   * Utility to help administrators migrate all users
   * This should only be accessible to admin users
   */
  async migrateAllUsers(): Promise<boolean> {
    try {
      // Get all users from localStorage
      const localUsers = this.getLocalStorageUsers();
      if (!localUsers || localUsers.length === 0) {
        console.log('No users found in localStorage');
        return true;
      }

      console.log(`Found ${localUsers.length} users in localStorage`);
      
      // Here you would implement the logic to register these users in the new system
      // This would typically be an admin-only API endpoint
      
      return true;
    } catch (error) {
      console.error('Failed to migrate all users:', error);
      return false;
    }
  }

  /**
   * Get all users from localStorage
   */
  private getLocalStorageUsers(): LocalUser[] {
    try {
      const usersJson = localStorage.getItem('users');
      if (!usersJson) {
        return [];
      }
      return JSON.parse(usersJson);
    } catch (e) {
      console.error('Failed to parse users from localStorage:', e);
      return [];
    }
  }
}

// Export a singleton instance
export const migrationHelper = new MigrationHelper();
