/**
 * Provider Service
 * Handles cloud provider configuration with PostgreSQL backend
 */

import { CloudProvider } from '../types';
import { authService } from './auth-service';
import { rbacService } from './rbac-service';
import { API_BASE_URL } from '../config';

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Error handling helper
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'API request failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      errorMessage = errorText || response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

interface ProviderConfig {
  id: number;
  user_id: number;
  provider: CloudProvider;
  config: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

class ProviderService {
  private providerConfigs: Record<CloudProvider, ProviderConfig | null> = {
    aws: null,
    azure: null,
    gcp: null,
    onprem: null
  };
  
  /**
   * Get provider configuration
   */
  async getProviderConfig(provider: CloudProvider): Promise<ProviderConfig | null> {
    // Check if we already have the config cached
    if (this.providerConfigs[provider]) {
      return this.providerConfigs[provider];
    }
    
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Check if user has access to this provider
    await rbacService.getProviderAccess();
    if (!rbacService.hasProviderAccess(provider)) {
      throw new Error(`You don't have access to ${provider.toUpperCase()} provider`);
    }
    
    try {
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/provider-config/${provider}`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If 404, it means no config exists yet
      if (response.status === 404) {
        return null;
      }
      
      const config = await handleResponse(response);
      this.providerConfigs[provider] = config;
      return config;
    } catch (error) {
      console.error(`Failed to fetch ${provider} configuration:`, error);
      throw error;
    }
  }
  
  /**
   * Save provider configuration
   */
  async saveProviderConfig(provider: CloudProvider, config: Record<string, any>): Promise<ProviderConfig> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Check if user has access to this provider
    await rbacService.getProviderAccess();
    if (!rbacService.hasProviderAccess(provider)) {
      throw new Error(`You don't have access to ${provider.toUpperCase()} provider`);
    }
    
    try {
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/provider-config/${provider}`, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config })
      });
      
      const updatedConfig = await handleResponse(response);
      this.providerConfigs[provider] = updatedConfig;
      return updatedConfig;
    } catch (error) {
      console.error(`Failed to save ${provider} configuration:`, error);
      throw error;
    }
  }
  
  /**
   * Delete provider configuration
   */
  async deleteProviderConfig(provider: CloudProvider): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Check if user has access to this provider
    await rbacService.getProviderAccess();
    if (!rbacService.hasProviderAccess(provider)) {
      throw new Error(`You don't have access to ${provider.toUpperCase()} provider`);
    }
    
    try {
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/provider-config/${provider}`, {
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
      
      this.providerConfigs[provider] = null;
      return true;
    } catch (error) {
      console.error(`Failed to delete ${provider} configuration:`, error);
      throw error;
    }
  }
  
  /**
   * Test provider configuration
   */
  async testProviderConfig(provider: CloudProvider, config?: Record<string, any>): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Check if user has access to this provider
    await rbacService.getProviderAccess();
    if (!rbacService.hasProviderAccess(provider)) {
      throw new Error(`You don't have access to ${provider.toUpperCase()} provider`);
    }
    
    try {
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/provider-config/${provider}/test`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config })
      });
      
      const result = await handleResponse(response);
      return result.success === true;
    } catch (error) {
      console.error(`Failed to test ${provider} configuration:`, error);
      throw error;
    }
  }
  
  /**
   * Migrate provider configurations from localStorage
   */
  async migrateProviderConfigsFromLocalStorage(): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      console.error('Cannot migrate provider configs: Not authenticated');
      return false;
    }
    
    try {
      // Check if migration has already been performed
      if (localStorage.getItem('provider_configs_migrated')) {
        return true;
      }
      
      // Get provider configs from localStorage
      const providers: CloudProvider[] = ['aws', 'azure', 'gcp', 'onprem'];
      let migratedCount = 0;
      
      for (const provider of providers) {
        const configKey = `${provider}_config`;
        const configJson = localStorage.getItem(configKey);
        
        if (configJson) {
          try {
            const config = JSON.parse(configJson);
            await this.saveProviderConfig(provider, config);
            migratedCount++;
            console.log(`Migrated ${provider.toUpperCase()} configuration`);
          } catch (e) {
            console.error(`Failed to migrate ${provider} configuration:`, e);
          }
        }
      }
      
      // Mark migration as completed
      localStorage.setItem('provider_configs_migrated', 'true');
      console.log(`Successfully migrated ${migratedCount} provider configurations`);
      return true;
    } catch (error) {
      console.error('Failed to migrate provider configurations:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const providerService = new ProviderService();
