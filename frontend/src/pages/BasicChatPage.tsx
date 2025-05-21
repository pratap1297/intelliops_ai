import { useState, useEffect } from 'react';
import { ChatNavigation } from '../components/ChatNavigation';
import { authService } from '../lib/auth-service';
import { authApi } from '../lib/api-client';
import { User, Prompt } from '../types';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import * as promptService from '../services/promptService';

export function BasicChatPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Display loading indicator when isLoading is true
  const navigate = useNavigate();
  
  // Load user and prompts on component mount
  // Initialize user and load data
  useEffect(() => {
    setIsLoading(true);
    
    // Function to initialize user
    const initializeUser = async () => {
      try {
        // Get user from auth service
        const user = authService.getUser();
        console.log('BasicChatPage - User from authService:', user);
        
        if (user) {
          setCurrentUser(user);
          return true;
        }
        
        // If token exists but no user, try to get profile
        const token = authService.getToken();
        if (token) {
          try {
            // Try to refresh user profile from backend
            const userData = await authApi.getProfile(token);
            if (userData) {
              setCurrentUser(userData);
              return true;
            }
          } catch (e) {
            console.error('Error fetching user profile:', e);
            // Clear invalid token
            authService.logout();
          }
        }
        
        return false;
      } catch (error) {
        console.error('Error initializing user:', error);
        return false;
      }
    };
    
    // Initialize user and load data
    const loadData = async () => {
      const userInitialized = await initializeUser();
      
      console.log('BasicChatPage - User initialized:', userInitialized);
      
      // Load prompts from the backend API
      console.log('BasicChatPage - Loading prompts from API');
      try {
        // Use the same promptService as the Prompt Library
        const apiPrompts = await promptService.getPrompts(
          undefined, // No category filter
          'aws' // Default to AWS provider
        );
        setPrompts(apiPrompts);
        console.log('BasicChatPage - Loaded', apiPrompts.length, 'prompts from API');
      } catch (error) {
        console.error('Error loading prompts:', error);
        setPrompts([]);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  console.log('BasicChatPage - Rendering with', prompts.length, 'prompts');
  console.log('BasicChatPage - Current user state:', currentUser);
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Cloud className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">AI Force IntelliOps</h1>
          </div>
          
          {/* User profile section */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{currentUser.name || 'User'}</div>
                  <div className="text-gray-500">{currentUser.email}</div>
                </div>
                {currentUser.is_admin && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Admin</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Login
            </button>
          )}
        </div>
      </header>
      
      <ChatNavigation />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium">{prompt.title}</h3>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-1">
                  {prompt.category}
                </span>
                <p className="text-sm text-gray-600 mt-2">{prompt.description}</p>
                <button className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded">
                  Use
                </button>
              </div>
            ))}
          </div>
          
          {prompts.length === 0 && (
            <div className="bg-yellow-100 p-4 rounded-lg">
              <p>No prompts available. There might be an issue with the data source.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
