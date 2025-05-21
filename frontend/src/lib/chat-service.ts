/**
 * Chat Service
 * Handles chat threads and messages with PostgreSQL backend
 */

import { Message, ChatThread, ChatRequest, ChatResponse } from '../types';
import { authService } from './auth-service';
import { API_BASE_URL, CHAT_API_URL, API_CONFIG } from '../config';
import { AUTH_TOKEN, CHAT_THREADS } from '../constants/storageKeys';

// Timeout settings from config
const TIMEOUT_MS = API_CONFIG.timeout * 4; // 4x the standard timeout for chat operations

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

class ChatService {
  private chatThreads: ChatThread[] = [];
  private isLoaded = false;
  
  /**
   * Get all chat threads for the current user
   */
  async getChatThreads(): Promise<ChatThread[]> {
    if (this.isLoaded) {
      return this.chatThreads;
    }
    
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleResponse(response);
      this.chatThreads = data;
      this.isLoaded = true;
      return this.chatThreads;
    } catch (error) {
      console.error('Failed to fetch chat threads:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific chat thread with messages
   */
  async getChatThread(threadId: string): Promise<ChatThread> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads/${threadId}`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`Failed to fetch chat thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new chat thread
   */
  async createChatThread(title: string, provider: string): Promise<ChatThread> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, provider })
      });
      
      const newThread = await handleResponse(response);
      
      // Update local cache
      this.chatThreads.push(newThread);
      
      return newThread;
    } catch (error) {
      console.error('Failed to create chat thread:', error);
      throw error;
    }
  }
  
  /**
   * Update a chat thread
   */
  async updateChatThread(threadId: string, title: string): Promise<ChatThread> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads/${threadId}`, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      
      const updatedThread = await handleResponse(response);
      
      // Update local cache
      const index = this.chatThreads.findIndex(t => t.id === threadId);
      if (index >= 0) {
        this.chatThreads[index] = updatedThread;
      }
      
      return updatedThread;
    } catch (error) {
      console.error(`Failed to update chat thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a chat thread
   */
  async deleteChatThread(threadId: string): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads/${threadId}`, {
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
      this.chatThreads = this.chatThreads.filter(t => t.id !== threadId);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete chat thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Send a chat message
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('=== CHAT REQUEST DEBUG ===');
      console.log('Request object:', JSON.stringify(request, null, 2));
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      // Check the provider type
      const isAwsProvider = request.provider === 'aws';
      const isGcpProvider = request.provider === 'gcp';
      console.log('Provider:', request.provider);
      
      // Use the appropriate endpoint based on the provider
      let endpoint = CHAT_API_URL; // default
      if (isAwsProvider) {
        endpoint = `${API_BASE_URL}/api/aws-bedrock/chat`;
      } else if (isGcpProvider) {
        endpoint = `${API_BASE_URL}/api/gcp-chat`;
      }
      
      console.log('Using endpoint:', endpoint);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('CHAT_API_URL:', CHAT_API_URL);
      
      // Prepare the request body based on the provider
      let requestBody;
      if (isAwsProvider) {
        requestBody = {
          message: request.user_message,
          session_id: request.session_id,
          history: request.history
        };
      } else if (isGcpProvider) {
        // Format for GCP API
        requestBody = {
          session_id: request.session_id,
          new_message: {
            role: 'user',
            parts: [{ text: request.user_message }]
          },
          start_session: !request.history || request.history.length === 0
        };
      } else {
        // Default format
        requestBody = {
          session_id: request.session_id,
          user_message: request.user_message,
          history: request.history
        };
      }
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      console.log(`Sending chat request to ${endpoint} for provider ${request.provider || 'default'}`);
      
      // Always include Authorization header if token is available
      const token = authService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      console.log('Response status:', response.status);
      
      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send message. Please try again.';
        
        console.log('Error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If error text is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!data || typeof data.response !== 'string') {
        throw new Error('Invalid response format received from server');
      }

      return {
        session_id: data.session_id || request.session_id,
        response: data.response
      };
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }
  
  /**
   * Save a chat message to the database
   */
  async saveChatMessage(threadId: string, message: Omit<Message, 'id'>): Promise<Message> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message)
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`Failed to save chat message to thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get messages for a chat thread
   */
  async getChatMessages(threadId: string): Promise<Message[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-threads/${threadId}/messages`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`Failed to fetch messages for thread ${threadId}:`, error);
      throw error;
    }
  }
  
  /**
   * Migrate chat history from localStorage
   */
  async migrateChatHistoryFromLocalStorage(): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      console.error('Cannot migrate chat history: Not authenticated');
      return false;
    }
    
    try {
      // Check if migration has already been performed
      if (localStorage.getItem('chat_history_migrated')) {
        return true;
      }
      
      // Get chat history from localStorage
      const chatHistoryJson = localStorage.getItem('chat_history');
      if (!chatHistoryJson) {
        // No chat history to migrate
        localStorage.setItem('chat_history_migrated', 'true');
        return true;
      }
      
      const chatHistory = JSON.parse(chatHistoryJson);
      if (!chatHistory || typeof chatHistory !== 'object') {
        // No valid chat history to migrate
        localStorage.setItem('chat_history_migrated', 'true');
        return true;
      }
      
      // Migrate each chat thread
      for (const [sessionId, messages] of Object.entries(chatHistory)) {
        if (Array.isArray(messages) && messages.length > 0) {
          try {
            // Create a new chat thread
            const firstMessage = messages[0];
            const title = firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '');
            const provider = sessionId.split('-')[0] || 'unknown';
            
            const thread = await this.createChatThread(title, provider);
            
            // Add messages to the thread
            for (const message of messages) {
              await this.saveChatMessage(thread.id, {
                content: message.content,
                timestamp: message.timestamp || new Date().toISOString(),
                sender: message.sender,
                role: message.role || (message.sender === 'user' ? 'user' : 'assistant'),
                status: 'success'
              });
            }
            
            console.log(`Migrated chat thread: ${title}`);
          } catch (e) {
            console.error(`Failed to migrate chat thread for session ${sessionId}:`, e);
          }
        }
      }
      
      // Mark migration as completed
      localStorage.setItem('chat_history_migrated', 'true');
      return true;
    } catch (error) {
      console.error('Failed to migrate chat history:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const chatService = new ChatService();
