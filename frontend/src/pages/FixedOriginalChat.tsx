import { useState, useEffect } from 'react';
import { ChatNavigation } from '../components/ChatNavigation';
import { PromptCard } from '../components/PromptCard';
import { CloudProvider, Prompt, User, ChatThread, Message } from '../types';
import toast from 'react-hot-toast';
import { authService } from '../lib/auth-service';
import { rbacService } from '../lib/rbac-service';
import { useNavigate, useLocation } from 'react-router-dom';
import * as promptService from '../services/promptService';
import { ChatThread as ChatThreadComponent } from '../components/ChatThread';
import { ChatInput } from '../components/ChatInput';

export function FixedOriginalChat() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [providerAccess, setProviderAccess] = useState<Record<CloudProvider, boolean>>({
    aws: true,
    azure: false,
    gcp: false,
    onprem: true
  });
  
  // Chat thread state
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatThread, setActiveChatThread] = useState<ChatThread | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'prompts' | 'chat'>('prompts');
  
  // Load user data and check authentication
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Get current user
        const user = authService.getUser();
        setCurrentUser(user);
        
        // Try to load provider access if authenticated
        if (user && user.id) {
          try {
            const token = authService.getToken();
            if (token) {
              // Get provider access for the current user
              const access = await rbacService.getProviderAccess();
              const accessMap: Record<CloudProvider, boolean> = {
                aws: false,
                azure: false,
                gcp: false,
                onprem: false
              };
              
              // Map provider access to state
              access.forEach(a => {
                if (a.provider in accessMap && a.has_access) {
                  accessMap[a.provider as CloudProvider] = true;
                }
              });
              
              setProviderAccess(accessMap);
              console.log('Loaded provider access:', accessMap);
              
              // Try to get the previously selected provider from localStorage
              const savedProvider = localStorage.getItem('selected_provider') as CloudProvider | null;
              
              // Set initial provider to the saved one if available and user has access, otherwise use first available
              const availableProviders = Object.entries(accessMap)
                .filter(([_, hasAccess]) => hasAccess)
                .map(([provider]) => provider as CloudProvider);
              
              if (savedProvider && availableProviders.includes(savedProvider)) {
                setProvider(savedProvider);
              } else if (availableProviders.length > 0 && availableProviders[0] !== provider) {
                setProvider(availableProviders[0]);
              }
            }
          } catch (error) {
            console.error('Error loading provider access:', error);
            // Fallback to default access
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Load chat threads and check for thread ID in URL
  useEffect(() => {
    const loadChatThreads = async () => {
      console.log('FixedOriginalChat - Loading chat threads');
      try {
        // Try to get chat threads from localStorage first
        const savedThreadsStr = localStorage.getItem('chat_threads');
        if (savedThreadsStr) {
          try {
            const parsedThreads = JSON.parse(savedThreadsStr) as ChatThread[];
            
            // Sort threads by timestamp (newest first)
            const sortedThreads = [...parsedThreads].sort((a, b) => {
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
            
            console.log('FixedOriginalChat - Loaded and sorted', sortedThreads.length, 'threads');
            setChatThreads(sortedThreads);
            
            // Priority 1: Check if we have a thread ID in the URL
            const urlParams = new URLSearchParams(location.search);
            const threadId = urlParams.get('thread');
            
            if (threadId) {
              console.log('FixedOriginalChat - Found thread ID in URL:', threadId);
              const thread = sortedThreads.find(t => t.id === threadId);
              
              if (thread) {
                console.log('FixedOriginalChat - Found thread in localStorage by URL param:', thread.id);
                // Ensure the thread has all required fields before loading it
                if (thread.id && thread.session_id) {
                  handleSelectChatThread(thread);
                  return; // Exit early since we found and loaded a thread
                } else {
                  console.error('FixedOriginalChat - Thread from URL has missing required fields:', thread);
                  toast.error('Invalid thread data. Starting a new chat.');
                }
              } else {
                console.log('FixedOriginalChat - Thread not found in localStorage for ID:', threadId);
                toast.error('Thread not found. Starting a new chat.');
              }
            }
            
            // Priority 2: Check if we have a selected thread in localStorage
            const selectedThreadStr = localStorage.getItem('selected_thread');
            if (selectedThreadStr) {
              try {
                const thread = JSON.parse(selectedThreadStr);
                console.log('FixedOriginalChat - Found selected thread in localStorage:', thread.id);
                
                // Validate thread data
                if (thread && thread.id && thread.session_id) {
                  handleSelectChatThread(thread);
                  localStorage.removeItem('selected_thread'); // Clear after loading
                  
                  // Update URL to reflect the loaded thread
                  if (!location.search.includes(`thread=${thread.id}`)) {
                    navigate(`/chat?thread=${thread.id}`, { replace: true });
                  }
                  return; // Exit early since we found and loaded a thread
                } else {
                  console.error('FixedOriginalChat - Invalid thread data in localStorage:', thread);
                  localStorage.removeItem('selected_thread');
                }
              } catch (error) {
                console.error('FixedOriginalChat - Error parsing selected thread:', error);
                localStorage.removeItem('selected_thread');
              }
            }
          } catch (error) {
            console.error('FixedOriginalChat - Error parsing chat threads:', error);
            setChatThreads([]);
          }
        } else {
          console.log('FixedOriginalChat - No threads found in localStorage');
          setChatThreads([]);
        }
      } catch (error) {
        console.error('FixedOriginalChat - Error loading chat threads:', error);
        toast.error('Failed to load chat history');
        setChatThreads([]);
      }
    };
    
    loadChatThreads();
  }, [location, navigate]);
  
  // Load prompts based on provider
  useEffect(() => {
    const loadPrompts = async () => {
      console.log('FixedOriginalChat - Loading prompts for provider:', provider);
      
      // Store the current provider in localStorage to maintain state between page refreshes
      localStorage.setItem('selected_provider', provider);
      
      // Check if user has access to this provider
      if (!providerAccess[provider]) {
        toast.error(`You don't have access to ${provider.toUpperCase()} resources`);
        return;
      }
      
      // Load prompts from the backend API
      try {
        // Get current user
        const currentUser = authService.getUser();
        const isAdmin = currentUser?.is_admin || false;
        
        let providerPrompts: Prompt[] = [];
        
        // Use the same promptService as the Prompt Library
        if (isAdmin) {
          // If admin, get all prompts
          providerPrompts = await promptService.getAllPromptsAdmin(
            undefined, // No category filter
            provider // Provider filter
          );
        } else {
          // If regular user, get user prompts + system prompts
          providerPrompts = await promptService.getPrompts(
            undefined, // No category filter
            provider // Provider filter
          );
        }
        
        // Load favorites
        try {
          const favorites = await promptService.getFavoritePrompts();
          const favoriteIds = new Set(favorites.map(p => p.id));
          setFavorites(favoriteIds);
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
        
        // Ensure we're only showing prompts for the selected provider
        // Double-check the filtering here as the backend might return prompts for all providers
        const filteredProviderPrompts = providerPrompts.filter(p => p.cloud_provider === provider);
        
        console.log('FixedOriginalChat - Before filtering:', providerPrompts.length, 'prompts');
        console.log('FixedOriginalChat - After filtering for', provider, ':', filteredProviderPrompts.length, 'prompts');
        
        // Clear previous prompts first to ensure UI updates
        setPrompts([]);
        // Then set the new filtered prompts
        setPrompts(filteredProviderPrompts);
        console.log('FixedOriginalChat - Loaded', filteredProviderPrompts.length, 'prompts from API for provider:', provider);
      } catch (error) {
        console.error('Error loading prompts:', error);
        toast.error('Failed to load prompts');
        setPrompts([]);
      }
    };
    
    loadPrompts();
  }, [provider, providerAccess]);
  
  // Filter prompts by selected category
  const filteredPrompts = selectedCategory
    ? prompts.filter(prompt => prompt.category === selectedCategory)
    : prompts;
  
  // Get unique categories
  const categories = [...new Set(prompts.map(prompt => prompt.category))];
  
  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  // Handle prompt selection
  const handlePromptSelect = (command: string, promptProvider?: CloudProvider) => {
    toast.success('Prompt selected: ' + command);
    console.log('Selected prompt command:', command);
    
    // If the prompt has a specific provider, ensure it matches the current provider
    if (promptProvider && promptProvider !== provider && providerAccess[promptProvider]) {
      console.log(`Switching provider from ${provider} to ${promptProvider} for prompt`);
      
      // Set the provider first
      setProvider(promptProvider);
      
      // The useEffect hook will handle loading prompts for the new provider
      // No need to call loadPromptsForProvider here as it will cause duplicate loading
    }
  };
  
  // Handle selecting a chat thread from history
  const handleSelectChatThread = (thread: ChatThread) => {
    console.log('FixedOriginalChat - Selecting chat thread:', thread.id);
    
    // Validate thread data
    if (!thread || !thread.id || !thread.session_id) {
      console.error('FixedOriginalChat - Invalid thread data:', thread);
      toast.error('Invalid thread data. Unable to load chat.');
      return;
    }
    
    // Ensure thread has messages array (even if empty)
    if (!thread.messages) {
      thread.messages = [];
    }
    
    // Set the active thread and its messages
    setActiveChatThread(thread);
    setChatMessages(thread.messages);
    
    // Switch to chat view mode and hide chat history
    setViewMode('chat');
    setShowChatHistory(false);
    
    // If the thread has a provider, set it as the current provider
    if (thread.session_id && thread.session_id.includes('-')) {
      const threadProvider = thread.session_id.split('-')[0] as CloudProvider;
      if (threadProvider && ['aws', 'azure', 'gcp', 'onprem'].includes(threadProvider)) {
        // Check if user has access to this provider
        if (providerAccess[threadProvider]) {
          console.log('FixedOriginalChat - Setting provider from thread:', threadProvider);
          setProvider(threadProvider);
        } else {
          console.warn('FixedOriginalChat - User does not have access to thread provider:', threadProvider);
          toast.error(`Note: You don't have access to the ${threadProvider.toUpperCase()} provider used in this chat.`);
        }
      }
    }
    
    // Update URL to reflect the loaded thread
    if (!location.search.includes(`thread=${thread.id}`)) {
      navigate(`/chat?thread=${thread.id}`, { replace: true });
    }
    
    // Provide feedback to the user
    toast.success(`Loaded chat: ${thread.title || 'Untitled Chat'}`);
    
    console.log('FixedOriginalChat - Successfully loaded thread with', thread.messages?.length || 0, 'messages');
  };
  
  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Create a new message
    const userMsg: Message = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user',
      role: 'user'
    };
    
    // Add user message to chat
    setChatMessages(prev => [...prev, userMsg]);
    
    // Create or update chat thread if needed
    let currentThread = activeChatThread;
    if (!currentThread) {
      // Create a new thread
      const newThread: ChatThread = {
        id: Date.now().toString(),
        title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        lastMessage: message,
        timestamp: new Date().toISOString(),
        messages: [userMsg],
        session_id: `${provider}-${Date.now()}`
      };
      
      setActiveChatThread(newThread);
      currentThread = newThread;
      
      // Add to threads list
      setChatThreads(prev => [newThread, ...prev]);
      
      // Save to localStorage
      const savedThreads = localStorage.getItem('chat_threads');
      const threadsArray = savedThreads ? JSON.parse(savedThreads) : [];
      localStorage.setItem('chat_threads', JSON.stringify([newThread, ...threadsArray]));
    } else {
      // Update existing thread
      const updatedThread = { ...currentThread };
      updatedThread.lastMessage = message;
      updatedThread.timestamp = new Date().toISOString();
      updatedThread.messages = [...(updatedThread.messages || []), userMsg];
      
      // Update active thread
      setActiveChatThread(updatedThread);
      currentThread = updatedThread;
      
      // Update threads list
      setChatThreads(prev => 
        prev.map(t => t.id === updatedThread.id ? updatedThread : t)
      );
      
      // Save to localStorage
      const savedThreads = localStorage.getItem('chat_threads');
      if (savedThreads) {
        const threadsArray = JSON.parse(savedThreads);
        const updatedThreads = threadsArray.map((t: ChatThread) => 
          t.id === updatedThread.id ? updatedThread : t
        );
        localStorage.setItem('chat_threads', JSON.stringify(updatedThreads));
      }
    }
    
    // Show loading state
    setIsLoadingChat(true);
    
    try {
      // Simulate AI response (in a real app, you would call your API)
      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now().toString(),
          content: `This is a simulated response to: ${message}`,
          timestamp: new Date().toISOString(),
          sender: 'system',
          role: 'assistant'
        };
        
        // Add AI message to chat
        setChatMessages(prev => [...prev, aiResponse]);
        
        // Update thread
        if (currentThread) {
          const updatedThread = { ...currentThread };
          updatedThread.messages = [...(updatedThread.messages || []), aiResponse];
          
          // Update active thread
          setActiveChatThread(updatedThread);
          
          // Update threads list
          setChatThreads(prev => 
            prev.map(t => t.id === updatedThread.id ? updatedThread : t)
          );
          
          // Save to localStorage
          const savedThreads = localStorage.getItem('chat_threads');
          if (savedThreads) {
            const threadsArray = JSON.parse(savedThreads);
            const updatedThreads = threadsArray.map((t: ChatThread) => 
              t.id === updatedThread.id ? updatedThread : t
            );
            localStorage.setItem('chat_threads', JSON.stringify(updatedThreads));
          }
        }
        
        setIsLoadingChat(false);
      }, 1000);
      
      // In a real app, you would call your API like this:
      // const response = await chatService.sendChatMessage({
      //   session_id: currentThread.session_id,
      //   user_message: message,
      //   history: currentThread.messages.map(m => ({
      //     role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
      //     content: m.content
      //   }))
      // });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoadingChat(false);
    }
  };
  
  // Toggle chat history view
  const toggleChatHistory = () => {
    setShowChatHistory(prev => !prev);
  };
  
  // Start a new chat
  const startNewChat = () => {
    setActiveChatThread(null);
    setChatMessages([]);
    setViewMode('prompts');
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (promptId: string) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(promptId)) {
      newFavorites.delete(promptId);
    } else {
      newFavorites.add(promptId);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorite_prompts', JSON.stringify([...newFavorites]));
    toast.success(newFavorites.has(promptId) ? 'Added to favorites' : 'Removed from favorites');
  };
  
  console.log('FixedOriginalChat - Rendering with', filteredPrompts.length, 'filtered prompts');
  console.log('FixedOriginalChat - Categories:', categories);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <h1 className="ml-2 text-xl font-semibold text-gray-900">AI Force IntelliOps</h1>
          </div>
          
          {/* View mode buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={startNewChat}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              New Chat
            </button>
            
            <button
              onClick={toggleChatHistory}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Chat History
            </button>
          </div>
          
          {/* Provider selection */}
          <div className="flex space-x-2">
            <button 
              onClick={() => setProvider('aws')} 
              disabled={!providerAccess.aws}
              className={`px-3 py-1 rounded ${
                provider === 'aws' 
                  ? 'bg-blue-600 text-white' 
                  : providerAccess.aws 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              AWS
            </button>
            <button 
              onClick={() => setProvider('azure')} 
              disabled={!providerAccess.azure}
              className={`px-3 py-1 rounded ${
                provider === 'azure' 
                  ? 'bg-blue-600 text-white' 
                  : providerAccess.azure 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              Azure
            </button>
            <button 
              onClick={() => setProvider('gcp')} 
              disabled={!providerAccess.gcp}
              className={`px-3 py-1 rounded ${
                provider === 'gcp' 
                  ? 'bg-blue-600 text-white' 
                  : providerAccess.gcp 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              GCP
            </button>
            <button 
              onClick={() => setProvider('onprem')} 
              disabled={!providerAccess.onprem}
              className={`px-3 py-1 rounded ${
                provider === 'onprem' 
                  ? 'bg-blue-600 text-white' 
                  : providerAccess.onprem 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              On-Prem
            </button>
          </div>
          
          {/* User profile section */}
          <div className="flex items-center">
            {currentUser && (
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
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ChatNavigation />
          
          {/* Chat History Panel */}
          {showChatHistory && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Chat History</h2>
                  <button
                    onClick={toggleChatHistory}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {chatThreads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No chat history found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chatThreads.map((thread) => (
                        <div
                          key={thread.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectChatThread(thread)}
                        >
                          <h3 className="font-medium text-gray-900">{thread.title || 'Untitled Chat'}</h3>
                          <p className="text-sm text-gray-500 mt-1 truncate">{thread.lastMessage || 'No messages'}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(thread.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {viewMode === 'prompts' ? (
            <>
              <h2 className="text-xl font-semibold mb-4">IntelliOps AI Assistant</h2>
              <p className="mb-6 text-gray-600">Select a prompt to interact with your cloud infrastructure.</p>
              
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading your environment...</span>
                </div>
              )}
              
              {!isLoading && (
                <>
                  {/* Categories */}
                  <div className="flex overflow-x-auto space-x-2 pb-4">
                    <button 
                      onClick={() => handleCategorySelect(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        selectedCategory === null 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button 
                        key={category} 
                        onClick={() => handleCategorySelect(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                          selectedCategory === category 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </>
              )}
    
              {!isLoading && (
                <>
                  {/* Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {filteredPrompts.map((promptItem) => (
                      <PromptCard
                        key={promptItem.id}
                        prompt={promptItem}
                        onSelect={() => handlePromptSelect(promptItem.command, promptItem.cloud_provider)}
                        onToggleFavorite={() => handleToggleFavorite(promptItem.id)}
                      />
                    ))
                    /* Edit and delete functionality has been disabled */}
                  </div>
                  
                  {filteredPrompts.length === 0 && !isLoading && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                      <p className="text-yellow-700">
                        {!providerAccess[provider] 
                          ? `You don't have access to ${provider.toUpperCase()} resources. Please contact your administrator.` 
                          : 'No prompts found for the selected category. Try selecting a different category.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            // Chat Interface
            <div className="flex flex-col h-[calc(100vh-300px)] bg-white rounded-lg shadow">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    {activeChatThread?.title || 'New Chat'}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Provider: {provider.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={startNewChat}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Chat Messages */}
              <ChatThreadComponent messages={chatMessages} />
              
              {/* Chat Input */}
              <div className="border-t border-gray-200">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingChat}
                  prompts={[]}
                  message={userMessage}
                  setMessage={setUserMessage}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white shadow mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Powered by AI Force IntelliOps</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
              {currentUser?.is_admin && (
                <button 
                  onClick={() => navigate('/rbac')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Manage Users & Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
