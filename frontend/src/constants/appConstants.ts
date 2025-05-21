/**
 * Application Constants
 * 
 * This file centralizes all constant values used throughout the application.
 * Using these constants instead of string literals helps prevent typos and
 * makes it easier to track and manage values throughout the application.
 */

// Cloud providers
export enum Provider {
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
  ONPREM = 'onprem'
}

// Provider display names
export const PROVIDER_NAMES = {
  [Provider.AWS]: 'AWS',
  [Provider.AZURE]: 'Azure',
  [Provider.GCP]: 'Google Cloud',
  [Provider.ONPREM]: 'On-Premises'
};

// User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// Message types
export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string | number) => `/users/${id}`
  },
  PROVIDER_ACCESS: {
    BASE: '/provider-access',
    USER: (id: string | number) => `/provider-access/user/${id}`
  },
  PROMPTS: {
    BASE: '/prompts',
    BY_ID: (id: string) => `/prompts/${id}`,
    FAVORITES: '/prompts/favorites',
    FAVORITE_BY_ID: (id: string) => `/prompts/favorites/${id}`
  },
  CHAT: {
    BASE: '/chat',
    THREADS: '/chat/threads',
    THREAD_BY_ID: (id: string) => `/chat/threads/${id}`
  }
};
