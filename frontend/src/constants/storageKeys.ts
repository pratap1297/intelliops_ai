/**
 * Storage Keys
 * 
 * This file centralizes all localStorage and sessionStorage key names used in the application.
 * Using these constants instead of string literals helps prevent typos and makes it easier to
 * track and manage storage usage throughout the application.
 */

// Authentication keys
export const AUTH_TOKEN = 'auth_token';
export const AUTH_USER = 'auth_user';
export const CURRENT_USER = 'currentUser';

// Session keys
export const CURRENT_SESSION_ID = 'current_session_id';

// Settings and preferences
export const SELECTED_PROVIDER = 'selectedProvider';
export const FAVORITE_PROMPTS = 'favorite_prompts';

// Chat related
export const CHAT_THREADS = 'chat_threads';

// UI state
export const SIDEBAR_EXPANDED = 'sidebar_expanded';

// Feature flags (local overrides)
export const FEATURE_FLAGS = 'feature_flags';
