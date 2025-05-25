import axios, { AxiosInstance } from 'axios';
import { Prompt } from '../types';
import { API_URL } from '../config';
import { AUTH_TOKEN } from '../constants/storageKeys';
import { ENDPOINTS } from '../constants/appConstants';

// Use the API URL from the centralized config
const API_ENDPOINT = `${API_URL}/api`;

// Create an axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Don't send credentials with cross-origin requests
});

// Add request interceptor to include authentication token
apiClient.interceptors.request.use(config => {
  // Get token from localStorage using the centralized storage key
  const token = localStorage.getItem(AUTH_TOKEN);
  
  // If token exists, add it to the Authorization header
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to handle errors, especially JWT expiration
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API error in promptService:', error);
    
    // Check if it's a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      // Get the error message
      const errorMessage = (error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message || 
                         'Unauthorized').toString();
      
      console.log('401 error detected in promptService:', errorMessage);
      
      // Check if it's a JWT expiration error - use broader matching
      if (
        errorMessage.includes('JWT') || 
        errorMessage.includes('token') ||
        errorMessage.includes('signature') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('validate credentials') ||
        errorMessage.includes('unauthorized')
      ) {
        console.log('JWT expiration detected in promptService, handling session expiration');
        
        // Clear auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        
        // Show toast notification
        import('react-hot-toast').then(toast => {
          toast.toast.error('Your session has expired. Please login again.', { duration: 5000 });
        });
        
        // Dispatch JWT expiration event
        window.dispatchEvent(new Event('jwt-expired'));
        
        // Force redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

// Type for backend prompt that needs to be converted to frontend format
interface BackendPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  command: string;
  user_id: number | null;
  cloud_provider: string;
  is_system: boolean;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

// Convert backend prompt to frontend format
const convertPrompt = (backendPrompt: BackendPrompt): Prompt => {
  return {
    id: backendPrompt.id,
    title: backendPrompt.title,
    description: backendPrompt.description || '',
    category: backendPrompt.category || 'General',
    command: backendPrompt.command,
    user_id: backendPrompt.user_id?.toString() || undefined,
    cloud_provider: backendPrompt.cloud_provider as any || 'aws',
    is_favorite: backendPrompt.is_favorite || false,
    is_system: backendPrompt.is_system || false
  };
};

// Get all prompts (user prompts + system prompts)
export const getPrompts = async (category?: string, cloudProvider?: string): Promise<Prompt[]> => {
  try {
    let url = `${API_URL}/prompts`;
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (cloudProvider && cloudProvider !== 'all') {
      params.append('cloud_provider', cloudProvider);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url.replace(API_URL, ''));
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn('Unexpected response format for prompts:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }
};

// Get only system prompts
export const getSystemPrompts = async (category?: string, cloudProvider?: string): Promise<Prompt[]> => {
  try {
    let url = `${API_URL}/prompts/system`;
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (cloudProvider && cloudProvider !== 'all') {
      params.append('cloud_provider', cloudProvider);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url.replace(API_URL, ''));
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn('Unexpected response format for system prompts:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    throw error;
  }
};

// Get only user prompts
export const getUserPrompts = async (category?: string, cloudProvider?: string): Promise<Prompt[]> => {
  try {
    let url = `${API_URL}/prompts/user`;
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (cloudProvider && cloudProvider !== 'all') {
      params.append('cloud_provider', cloudProvider);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url.replace(API_URL, ''));
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn('Unexpected response format for user prompts:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user prompts:', error);
    throw error;
  }
};

// Admin: Get all prompts in the system
export const getAllPromptsAdmin = async (category?: string, cloudProvider?: string): Promise<Prompt[]> => {
  try {
    let url = `${API_URL}/prompts/admin/all`;
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (cloudProvider && cloudProvider !== 'all') {
      params.append('cloud_provider', cloudProvider);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get(url.replace(API_URL, ''));
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn('Unexpected response format for admin prompts:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching all prompts (admin):', error);
    throw error;
  }
};

// Get a specific prompt by ID
export const getPromptById = async (promptId: string): Promise<Prompt> => {
  try {
    const response = await apiClient.get(`/prompts/${promptId}`);
    return convertPrompt(response.data);
  } catch (error) {
    console.error(`Error fetching prompt ${promptId}:`, error);
    throw error;
  }
};

// Create a new prompt
export const createPrompt = async (promptData: Omit<Prompt, 'id'>): Promise<Prompt> => {
  try {
    console.log('Creating prompt with data:', promptData);
    
    // Convert frontend prompt to backend format
    const backendPromptData = {
      id: `prompt-${Date.now()}`, // Generate a unique ID
      title: promptData.title,
      description: promptData.description || '',
      category: promptData.category,
      command: promptData.command,
      cloud_provider: promptData.cloud_provider,
      is_system: promptData.is_system || false
    };
    
    console.log('Sending API request to create prompt:', backendPromptData);
    
    // Get the token to check if it's valid
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }
    
    // Make the API request with explicit headers
    const response = await apiClient.post(`/prompts`, backendPromptData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Prompt created successfully:', response.data);
    return convertPrompt(response.data);
  } catch (error) {
    console.error('Error creating prompt:', error);
    
    // Check if it's an authentication error
    const axiosError = error as any;
    if (axiosError?.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('currentUser');
      
      // Show error message
      alert('Your session has expired. Please login again.');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Update an existing prompt
export const updatePrompt = async (promptId: string, promptData: Partial<Prompt>): Promise<Prompt> => {
  try {
    // Convert frontend prompt to backend format
    const backendPromptData = {
      title: promptData.title,
      description: promptData.description,
      category: promptData.category,
      command: promptData.command,
      cloud_provider: promptData.cloud_provider
    };
    
    const response = await apiClient.put(`/prompts/${promptId}`, backendPromptData);
    return convertPrompt(response.data);
  } catch (error) {
    console.error(`Error updating prompt ${promptId}:`, error);
    throw error;
  }
};

// Delete a prompt
export const deletePrompt = async (promptId: string): Promise<void> => {
  try {
    await apiClient.delete(`/prompts/${promptId}`);
  } catch (error) {
    console.error(`Error deleting prompt ${promptId}:`, error);
    throw error;
  }
};

// Get user's favorite prompts
export const getFavoritePrompts = async (): Promise<Prompt[]> => {
  try {
    const response = await apiClient.get(`/favorite-prompts/details`);
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn('Unexpected response format for favorite prompts:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching favorite prompts:', error);
    throw error;
  }
};

// Check if a prompt is in favorites
export const checkIsFavorite = async (promptId: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/favorite-prompts/${promptId}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking if prompt ${promptId} is favorite:`, error);
    return false;
  }
};

// Add a prompt to favorites
export const addToFavorites = async (promptId: string): Promise<void> => {
  try {
    await apiClient.post(`/favorite-prompts`, { prompt_id: promptId });
  } catch (error) {
    console.error(`Error adding prompt ${promptId} to favorites:`, error);
    throw error;
  }
};

// Remove a prompt from favorites
export const removeFromFavorites = async (promptId: string): Promise<void> => {
  try {
    await apiClient.delete(`/favorite-prompts/${promptId}`);
  } catch (error) {
    console.error(`Error removing prompt ${promptId} from favorites:`, error);
    throw error;
  }
};

// Admin: Get favorite prompts for a specific user
export const getUserFavoritesAdmin = async (userId: number): Promise<Prompt[]> => {
  try {
    const response = await apiClient.get(`/favorite-prompts/admin/user/${userId}`);
    // Check if response.data is an array before mapping
    if (Array.isArray(response.data)) {
      return response.data.map(convertPrompt);
    } else {
      console.warn(`Unexpected response format for user ${userId} favorites:`, response.data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching favorites for user ${userId}:`, error);
    throw error;
  }
};
