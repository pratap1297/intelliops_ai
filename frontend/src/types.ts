// Database types will be used when implementing Supabase integration

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_authenticated: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  created_at?: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission: string;
  created_at?: string;
}

export interface UserRolePermission {
  id: number;
  user_id: number;
  permission: string;
  granted: boolean;
  created_at?: string;
}

export interface ProviderAccess {
  id: number;
  user_id: number;
  provider: string;
  has_access: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'system';
  status?: 'loading' | 'success' | 'error';
  role?: 'user' | 'assistant';
}

export interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  session_id: string;
  user_message: string;
  history: ChatHistory[];
  provider?: CloudProvider; // Added provider field to specify which cloud provider to use
}

export interface ChatResponse {
  session_id: string;
  response: string;
}

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'onprem';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  command: string;
  user_id?: string;
  cloud_provider: CloudProvider;
  is_favorite?: boolean;
  is_system?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
  session_id: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  provider: CloudProvider | 'gcp-dialogflow' | 'gcp-custom';
  session_id: string;
  content: any;
  status?: number;
  duration?: number;
  endpoint?: string;
}

export interface LogFilter {
  provider?: string;
  type?: string;
  session_id?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}