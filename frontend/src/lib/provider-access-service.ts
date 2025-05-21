/**
 * Provider Access Service
 * Handles checking if a user has access to any provider
 * Caches results to prevent unnecessary API calls
 */

import { rbacService } from './rbac-service';
import { authService } from './auth-service';

class ProviderAccessService {
  private hasCheckedAccess: boolean = false;
  private hasProviderAccess: boolean = false;
  private checkPromise: Promise<boolean> | null = null;
  
  /**
   * Check if the user has access to any provider
   * Caches the result to prevent unnecessary API calls
   */
  async hasAccess(): Promise<boolean> {
    // If we've already checked, return the cached result
    if (this.hasCheckedAccess) {
      return this.hasProviderAccess;
    }
    
    // If we're already checking, return the existing promise
    if (this.checkPromise) {
      return this.checkPromise;
    }
    
    // If not authenticated, user has no access
    if (!authService.isAuthenticated()) {
      this.hasCheckedAccess = true;
      this.hasProviderAccess = false;
      return false;
    }
    
    // Check if user is admin - admins always have access
    const user = authService.getUser();
    if (user?.is_admin) {
      this.hasCheckedAccess = true;
      this.hasProviderAccess = true;
      return true;
    }
    
    // Create a new promise to check access
    this.checkPromise = new Promise<boolean>(async (resolve) => {
      try {
        // Load provider access information
        await rbacService.getProviderAccess();
        
        // Check if user has access to any provider
        const hasAws = rbacService.hasProviderAccess('aws');
        const hasAzure = rbacService.hasProviderAccess('azure');
        const hasGcp = rbacService.hasProviderAccess('gcp');
        const hasOnprem = rbacService.hasProviderAccess('onprem');
        
        const hasAccess = hasAws || hasAzure || hasGcp || hasOnprem;
        
        // Cache the result
        this.hasCheckedAccess = true;
        this.hasProviderAccess = hasAccess;
        
        resolve(hasAccess);
      } catch (error) {
        console.error('Error checking provider access:', error);
        // Default to allowing access in case of error
        this.hasCheckedAccess = true;
        this.hasProviderAccess = true;
        resolve(true);
      } finally {
        this.checkPromise = null;
      }
    });
    
    return this.checkPromise;
  }
  
  /**
   * Reset the cached access check
   * Call this when the user logs in/out or when provider access might have changed
   */
  resetAccessCheck() {
    this.hasCheckedAccess = false;
    this.hasProviderAccess = false;
    this.checkPromise = null;
    
    // Also clear the localStorage cache
    localStorage.removeItem('user_provider_access');
  }
}

// Export a singleton instance
export const providerAccessService = new ProviderAccessService();
