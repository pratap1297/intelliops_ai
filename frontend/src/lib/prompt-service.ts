/**
 * Prompt Service
 * Handles prompt management with PostgreSQL backend
 */

import { Prompt, CloudProvider } from '../types';
import { authService } from './auth-service';
import { enhancedHandleResponse } from './api-error-handler';
import { API_BASE_URL } from '../config';

// API base URL is now imported from the centralized config file

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Use the enhanced response handler that checks for JWT expiration
const handleResponse = enhancedHandleResponse;

class PromptService {
  private prompts: Prompt[] = [];
  private favoritePrompts: Prompt[] = [];
  private isLoaded = false;
  
  /**
   * Get all prompts
   */
  async getPrompts(): Promise<Prompt[]> {
    if (this.isLoaded) {
      return this.prompts;
    }
    
    const token = authService.getToken();
    if (!token) {
      // For unauthenticated users, return only system prompts
      // This would be handled differently in a real implementation
      return this.getSystemPrompts();
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleResponse(response);
      this.prompts = data;
      this.isLoaded = true;
      return this.prompts;
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      // Fallback to system prompts if API fails
      return this.getSystemPrompts();
    }
  }
  
  /**
   * Get system prompts (fallback for unauthenticated users)
   */
  private getSystemPrompts(): Prompt[] {
    // This is a temporary function that would be replaced by API calls
    // In a real implementation, we would fetch system prompts from the server
    const storedPrompts = localStorage.getItem('system_prompts');
    if (storedPrompts) {
      try {
        return JSON.parse(storedPrompts);
      } catch (e) {
        console.error('Failed to parse system prompts:', e);
      }
    }
    return [];
  }
  
  /**
   * Get prompts by provider
   */
  async getPromptsByProvider(provider: CloudProvider): Promise<Prompt[]> {
    const allPrompts = await this.getPrompts();
    return allPrompts.filter(prompt => prompt.cloud_provider === provider);
  }
  
  /**
   * Get favorite prompts
   */
  async getFavoritePrompts(): Promise<Prompt[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/favorites`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleResponse(response);
      this.favoritePrompts = data;
      return this.favoritePrompts;
    } catch (error) {
      console.error('Failed to fetch favorite prompts:', error);
      throw error;
    }
  }
  
  /**
   * Add prompt to favorites
   */
  async addToFavorites(promptId: string): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/favorites`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt_id: promptId })
      });
      
      await handleResponse(response);
      
      // Update local cache
      const prompt = this.prompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.is_favorite = true;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to add prompt to favorites:', error);
      throw error;
    }
  }
  
  /**
   * Remove prompt from favorites
   */
  async removeFromFavorites(promptId: string): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/favorites/${promptId}`, {
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
      
      // Update local cache
      const prompt = this.prompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.is_favorite = false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove prompt from favorites:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user prompt
   */
  async createPrompt(promptData: Omit<Prompt, 'id' | 'user_id' | 'is_system'>): Promise<Prompt> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promptData)
      });
      
      const newPrompt = await handleResponse(response);
      
      // Update local cache
      this.prompts.push(newPrompt);
      
      return newPrompt;
    } catch (error) {
      console.error('Failed to create prompt:', error);
      throw error;
    }
  }
  
  /**
   * Update a user prompt
   */
  async updatePrompt(promptId: string, promptData: Partial<Prompt>): Promise<Prompt> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promptData)
      });
      
      const updatedPrompt = await handleResponse(response);
      
      // Update local cache
      const index = this.prompts.findIndex(p => p.id === promptId);
      if (index >= 0) {
        this.prompts[index] = updatedPrompt;
      }
      
      return updatedPrompt;
    } catch (error) {
      console.error('Failed to update prompt:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user prompt
   */
  async deletePrompt(promptId: string): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}`, {
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
      
      // Update local cache
      this.prompts = this.prompts.filter(p => p.id !== promptId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw error;
    }
  }
  
  /**
   * Migrate prompts from localStorage
   */
  async migratePromptsFromLocalStorage(): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      console.error('Cannot migrate prompts: Not authenticated');
      return false;
    }
    
    try {
      // Check if migration has already been performed
      if (localStorage.getItem('prompts_migrated')) {
        return true;
      }
      
      // Get user prompts from localStorage
      const userPromptsJson = localStorage.getItem('user_prompts');
      if (!userPromptsJson) {
        // No user prompts to migrate
        localStorage.setItem('prompts_migrated', 'true');
        return true;
      }
      
      const userPrompts = JSON.parse(userPromptsJson);
      if (!Array.isArray(userPrompts) || userPrompts.length === 0) {
        // No valid user prompts to migrate
        localStorage.setItem('prompts_migrated', 'true');
        return true;
      }
      
      // Migrate each user prompt
      for (const prompt of userPrompts) {
        if (prompt.user_id && !prompt.is_system) {
          try {
            // Create the prompt in the new system
            await this.createPrompt({
              title: prompt.title,
              description: prompt.description,
              category: prompt.category,
              command: prompt.command,
              cloud_provider: prompt.cloud_provider,
              is_favorite: !!prompt.is_favorite
            });
            
            console.log(`Migrated prompt: ${prompt.title}`);
          } catch (e) {
            console.error(`Failed to migrate prompt ${prompt.title}:`, e);
          }
        }
      }
      
      // Mark migration as completed
      localStorage.setItem('prompts_migrated', 'true');
      return true;
    } catch (error) {
      console.error('Failed to migrate prompts:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const promptService = new PromptService();
