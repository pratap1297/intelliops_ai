import { ChatRequest, ChatResponse } from '../types';
import { API_BASE_URL } from '../config';
import { authService } from './auth-service';

// Default chat API URL (will be overridden based on provider)
const DEFAULT_CHAT_API_URL = `${API_BASE_URL}/api/chat`;
const TIMEOUT_MS = 120000; // 2 minutes timeout

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Determine the correct endpoint based on the provider
    let apiUrl = DEFAULT_CHAT_API_URL;
    const provider = request.provider || 'aws'; // Default to AWS if not specified
    
    if (provider === 'aws') {
      apiUrl = `${API_BASE_URL}/api/aws-bedrock/chat`;
    } else if (provider === 'gcp') {
      apiUrl = `${API_BASE_URL}/api/gcp-chat`;
    }
    
    console.log(`Sending chat request to ${provider.toUpperCase()} backend:`, apiUrl);
    
    // Format request based on provider
    let requestBody;
    if (provider === 'aws') {
      requestBody = {
        message: request.user_message,
        session_id: request.session_id,
        history: request.history,
        provider: provider
      };
    } else if (provider === 'gcp') {
      requestBody = {
        session_id: request.session_id,
        new_message: {
          role: 'user',
          parts: [{ text: request.user_message }]
        },
        start_session: !request.history || request.history.length === 0,
        provider: provider
      };
    } else {
      // Default format for other providers
      requestBody = {
        session_id: request.session_id,
        user_message: request.user_message,
        history: request.history,
        provider: provider
      };
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Get authentication token
    const token = authService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to send message. Please try again.';
      
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

    if (!data || typeof data.response !== 'string') {
      throw new Error('Invalid response format received from server');
    }

    return {
      session_id: data.session_id || request.session_id,
      response: data.response
    };
  } catch (error: unknown) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes. The server might still be processing your request.');
    }
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the chat service. Please check your connection.');
    }
    
    // Re-throw the error with a user-friendly message
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}