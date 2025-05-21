/**
 * Application configuration
 * 
 * This file centralizes all configuration values, including external URLs,
 * API endpoints, and other environment-specific settings.
 */

// Safe environment variable access for browser environments
const getEnv = (key: string, defaultValue: string): string => {
  // Check if window.__ENV is available (for runtime environment variables)
  if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key]) {
    return window.__ENV[key];
  }
  
  // Check if import.meta.env is available (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Check if process.env is available (Node.js / webpack)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Fallback to default value
  return defaultValue;
};

// Add TypeScript interface for window.__ENV
declare global {
  interface Window {
    __ENV?: Record<string, string>;
  }
}

// Base URLs for external services
export const STACK_BASE_URL = getEnv('REACT_APP_STACK_URL', 'https://stack.intelliops.cloud');
export const FINOPS_BASE_URL = getEnv('REACT_APP_FINOPS_URL', 'https://finops.intelliops.cloud');

// API URLs
export const API_BASE_URL = getEnv('REACT_APP_API_BASE_URL', 'http://localhost:8000');
export const API_URL = getEnv('REACT_APP_API_URL', 'http://localhost:8000');
export const CHAT_API_URL = getEnv('REACT_APP_CHAT_API_URL', 'http://localhost:8000/chat/');

// Infrastructure service URLs
export const INFRASTRUCTURE_URLS = {
  overview: `${STACK_BASE_URL}/`,
  compute: `${STACK_BASE_URL}/compute`,
  storage: `${STACK_BASE_URL}/storage`,
  network: `${STACK_BASE_URL}/network`,
  containers: `${STACK_BASE_URL}/containers`,
  config: `${STACK_BASE_URL}/config`,
};

// API configuration
export const API_CONFIG = {
  baseUrl: API_URL,
  timeout: parseInt(getEnv('REACT_APP_API_TIMEOUT', '30000')),
  retryAttempts: parseInt(getEnv('REACT_APP_API_RETRY_ATTEMPTS', '3')),
};

// Default provider
export const DEFAULT_PROVIDER = getEnv('REACT_APP_DEFAULT_PROVIDER', 'aws');

// Feature flags
export const FEATURES = {
  enableExternalServices: getEnv('REACT_APP_ENABLE_EXTERNAL_SERVICES', 'true') !== 'false',
  enableFinOps: getEnv('REACT_APP_ENABLE_FINOPS', 'true') !== 'false',
};
