import { useState, useEffect } from 'react';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { PromptCard } from './components/PromptCard';
import { AppLayout } from './components/AppLayout';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { Message, Prompt, ChatHistory, ChatThread as ChatThreadType, CloudProvider } from './types';
import { 
  PlusCircle,
  Cloud,
  ChevronDown
} from 'lucide-react';
import { sendChatMessage } from './lib/api';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import * as promptService from './services/promptService';
import { authService } from './lib/auth-service';
import { NavigationProvider } from './contexts/NavigationContext';

interface AppProps {
  initialThread?: ChatThreadType;
}

function ChatApp({ initialThread }: AppProps) {
  console.log('App - Received initialThread prop:', initialThread);

  const [messages, setMessages] = useState<Message[]>(initialThread?.messages || []);
  const [threads, setThreads] = useState<ChatThreadType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>(initialThread?.session_id || '');
  const initialSessionId = initialThread?.session_id || ''; // Capture initial value
  console.log('App - Initializing sessionId state with:', initialSessionId);
  const [activeProvider, setActiveProvider] = useState<CloudProvider>('aws');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Effect 1: Manage sessionId based on initialThread
  useEffect(() => {
    console.log('App initialThread Effect - Starting with initialThread:', initialThread);
    
    if (initialThread && initialThread.session_id) {
      // If initialThread is provided, update the state with its data
      console.log('App initialThread Effect - Setting sessionId from initialThread:', initialThread.session_id);
      setSessionId(initialThread.session_id);
      
      // Always set messages if initialThread has them, regardless of whether they're empty
      if (initialThread.messages) {
        console.log('App initialThread Effect - Setting messages from initialThread:', initialThread.messages.length, 'messages');
        setMessages(initialThread.messages);
      } else {
        // Only clear messages if no messages in initialThread
        console.log('App initialThread Effect - No messages in initialThread, clearing messages');
        setMessages([]);
      }
      
      // If thread has a provider, set it as active
      if (initialThread.session_id.includes('-')) {
        const threadProvider = initialThread.session_id.split('-')[0] as CloudProvider;
        if (threadProvider && ['aws', 'azure', 'gcp', 'onprem'].includes(threadProvider)) {
          console.log('App initialThread Effect - Setting provider from thread:', threadProvider);
          setActiveProvider(threadProvider);
        }
      }
    } else if (!sessionId) {
      // Only generate a new ID if no initialThread was given AND sessionId is currently empty.
      // This handles the very first load or clicking "New Chat".
      const newSessionId = uuidv4();
      console.log('App initialThread Effect - No initialThread or ID mismatch, generating initial sessionId:', newSessionId);
      setSessionId(newSessionId);
      // Clear messages for new chat
      setMessages([]);
    }
  }, [initialThread]); // Only depend on initialThread to avoid loops
  
  // Effect 2: Load prompts when provider changes or component mounts
  useEffect(() => {
    // Default to AWS provider if none is set
    const currentProvider = activeProvider || 'aws';
    let isMounted = true; // Flag to prevent state updates after unmount
    
    // Clear prompts immediately when provider changes to avoid stale data
    setPrompts([]);
    
    const loadPrompts = async () => {
      console.log(`App Prompt Loading Effect - Loading prompts for provider: ${currentProvider}`);
      
      try {
        // Get current user
        const currentUser = authService.getUser();
        const isAdmin = currentUser?.is_admin || false;
        
        // Use the same promptService as the Prompt Library
        let apiPrompts: Prompt[] = [];
        if (isAdmin) {
          // If admin, get all prompts
          apiPrompts = await promptService.getAllPromptsAdmin(
            undefined, // No category filter
            currentProvider // Provider filter
          );
        } else {
          // If regular user, get user prompts + system prompts
          apiPrompts = await promptService.getPrompts(
            undefined, // No category filter
            currentProvider // Provider filter
          );
        }
        
        // If component unmounted or provider changed during API call, don't update state
        if (!isMounted) return;
        
        console.log(`App Prompt Loading Effect - Loaded ${apiPrompts.length} prompts from API`);
        
        // Load favorites from API
        try {
          const favorites = await promptService.getFavoritePrompts();
          const favoriteIds = new Set(favorites.map(p => p.id));
          
          const promptsWithFavorites = apiPrompts.map((prompt: Prompt) => ({
            ...prompt,
            is_favorite: favoriteIds.has(prompt.id)
          }));
          
          // Final check before updating state
          if (!isMounted) return;
          
          setPrompts(promptsWithFavorites);
          console.log(`App Prompt Loading Effect - Successfully loaded ${promptsWithFavorites.length} prompts for ${currentProvider}`);
          
          // Save the current provider to localStorage for persistence
          localStorage.setItem('selectedProvider', currentProvider);
        } catch (error) {
          if (!isMounted) return;
          console.error('Error loading favorites:', error);
          setPrompts(apiPrompts);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading prompts:', error);
        setPrompts([]);
      }
    };
    
    // Start loading prompts
    loadPrompts();
    
    // If provider wasn't set, update it
    if (!activeProvider) {
      setActiveProvider('aws');
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [activeProvider]); // Only depend on activeProvider

  // Function to clean up threads older than 30 days
  const cleanupOldThreads = (threads: ChatThreadType[]): ChatThreadType[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return threads.filter(thread => {
      const threadDate = new Date(thread.timestamp);
      return threadDate > thirtyDaysAgo;
    });
  };

  // Effect 2: Load threads once sessionId is stable
  useEffect(() => {
    console.log('App Thread Load Effect - Running with sessionId:', sessionId);

    // Don't load threads if sessionId isn't set yet
    if (!sessionId) {
      console.log('App Thread Load Effect - Skipping thread load, no sessionId');
      return;
    }

    // Load existing threads from localStorage (only needed for the list, not current chat)
    try {
      const savedThreads = localStorage.getItem('chat_threads');
      if (savedThreads) {
        const parsedThreads = JSON.parse(savedThreads);
        
        // Clean up old threads
        const cleanedThreads = cleanupOldThreads(parsedThreads);
        
        if (cleanedThreads.length < parsedThreads.length) {
          localStorage.setItem('chat_threads', JSON.stringify(cleanedThreads));
        }
        
        setThreads(cleanedThreads); // Update the list of all threads
      }
    } catch (error) {
      console.error('Error parsing saved threads in App Thread Load Effect:', error);
    }
  }, [sessionId]); // Dependencies: Run when sessionId changes

  // Effect to listen for provider changes from the AppLayout component
  useEffect(() => {
    // Load initial provider from localStorage
    try {
      // First, check if the current user has restrictions on which providers they can access
      const currentUserStr = localStorage.getItem('currentUser');
      const accessSettingsStr = localStorage.getItem('user_access');
      
      if (currentUserStr && accessSettingsStr) {
        const currentUser = JSON.parse(currentUserStr);
        const accessSettings = JSON.parse(accessSettingsStr);
        
        // Find this user's access settings
        const userAccess = accessSettings.find(
          (access: any) => access.email === currentUser.email
        );
        
        if (userAccess) {
          const { providers } = userAccess;
          
          // Load saved provider preference
          const savedProvider = localStorage.getItem('selectedProvider') as CloudProvider;
          
          // If the user has a saved preference and has access to it, use that
          if (savedProvider && providers[savedProvider]) {
            console.log('App: Loading preferred provider from localStorage:', savedProvider);
            setActiveProvider(savedProvider);
          } else {
            // Otherwise, find the first provider they have access to
            const firstAllowedProvider = Object.entries(providers)
              .find(([_, hasAccess]) => hasAccess === true)?.[0] as CloudProvider;
              
            if (firstAllowedProvider) {
              console.log('App: Setting first allowed provider:', firstAllowedProvider);
              setActiveProvider(firstAllowedProvider);
              localStorage.setItem('selectedProvider', firstAllowedProvider);
            }
          }
        } else {
          // If no specific access settings are found, use saved provider or default to AWS
          const savedProvider = localStorage.getItem('selectedProvider');
          if (savedProvider && (savedProvider === 'aws' || savedProvider === 'azure' || 
              savedProvider === 'gcp' || savedProvider === 'onprem')) {
            console.log('App: Loading initial provider from localStorage:', savedProvider);
            setActiveProvider(savedProvider as CloudProvider);
          }
        }
      } else {
        // If no user or access settings, just use saved provider
        const savedProvider = localStorage.getItem('selectedProvider');
        if (savedProvider && (savedProvider === 'aws' || savedProvider === 'azure' || 
            savedProvider === 'gcp' || savedProvider === 'onprem')) {
          console.log('App: Loading initial provider from localStorage:', savedProvider);
          setActiveProvider(savedProvider as CloudProvider);
        }
      }
    } catch (error) {
      console.error('Error loading saved provider in App.tsx:', error);
    }

    // Listen for provider change events
    const handleProviderChanged = (event: any) => {
      if (event.detail && event.detail.provider) {
        const newProvider = event.detail.provider;
        console.log('App: Provider change event received:', newProvider);
        
        // Only update if different to avoid unnecessary renders
        if (newProvider !== activeProvider) {
          setActiveProvider(newProvider);
          
          // Force reload prompts for new provider - will be handled by the useEffect
          // that watches for activeProvider changes
          // No need to manually reload prompts here
        }
      }
    };

    // Add event listener
    document.addEventListener('providerChanged', handleProviderChanged);
    
    // Clean up
    return () => {
      document.removeEventListener('providerChanged', handleProviderChanged);
    };
  }, [activeProvider]); // Added activeProvider as a dependency

  // Add new effect to listen for "new chat" events from AppLayout
  useEffect(() => {
    const handleNewChatEvent = () => {
      console.log('App: New chat event received');
      
      // Clear current messages
      setMessages([]);
      setCurrentMessage('');
      
      // Generate new session ID
      const newSessionId = uuidv4();
      console.log('Created new session ID:', newSessionId);
      
      // Update state and localStorage
      setSessionId(newSessionId);
      localStorage.setItem('current_session_id', newSessionId);
    };
    
    document.addEventListener('newChatRequested', handleNewChatEvent);
    
    return () => {
      document.removeEventListener('newChatRequested', handleNewChatEvent);
    };
  }, []);

  const formatMessagesForHistory = (messages: Message[]): ChatHistory[] => {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'user',
    };
    
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      timestamp: new Date().toISOString(),
      sender: 'system',
      status: 'loading',
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const chatHistory = formatMessagesForHistory(messages);
      console.log('Sending message with provider:', activeProvider);
      const response = await sendChatMessage({
        session_id: sessionId,
        user_message: content,
        history: chatHistory,
        provider: activeProvider // Include the provider in the request
      });

      const responseMessage: Message = {
        id: loadingMessage.id,
        content: response.response,
        timestamp: new Date().toISOString(),
        sender: 'system',
        status: 'success',
      };

      // Create or update thread when conversation happens
      const updatedMessages = messages.filter(m => m.id !== loadingMessage.id).concat([userMessage, responseMessage]);
      console.log('Creating/updating thread with messages:', updatedMessages);
      const thread = {
        id: sessionId,
        session_id: sessionId,
        title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
        lastMessage: `You: ${userMessage.content.slice(0, 30)}${userMessage.content.length > 30 ? '...' : ''} | AI: ${responseMessage.content.slice(0, 50)}${responseMessage.content.length > 50 ? '...' : ''}`,
        timestamp: new Date().toISOString(),
        messages: updatedMessages
      };
      console.log('New thread object:', thread);

      setThreads(prevThreads => {
        console.log('Previous threads:', prevThreads);
        const newThreads = prevThreads.filter(t => t.id !== sessionId).concat(thread);
        try {
          // Clean up old threads before saving
          const cleanedThreads = cleanupOldThreads(newThreads);
          console.log('Saving threads to localStorage:', JSON.stringify(cleanedThreads, null, 2));
          localStorage.setItem('chat_threads', JSON.stringify(cleanedThreads));
          return cleanedThreads;
        } catch (error) {
          console.error('Error saving threads:', error);
          return newThreads;
        }
      });

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? responseMessage : msg
      ));
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';
      
      const errorResponse: Message = {
        id: loadingMessage.id,
        content: errorMessage,
        timestamp: new Date().toISOString(),
        sender: 'system',
        status: 'error',
      };
      
      // Also update the thread to show the user message in error cases
      const thread = {
        id: sessionId,
        session_id: sessionId,
        title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
        lastMessage: `You: ${userMessage.content.slice(0, 30)}${userMessage.content.length > 30 ? '...' : ''} | Error: ${errorMessage.slice(0, 50)}${errorMessage.length > 50 ? '...' : ''}`,
        timestamp: new Date().toISOString(),
        messages: [...messages.filter(m => m.id !== loadingMessage.id), userMessage, errorResponse]
      };
      
      setThreads(prevThreads => {
        const newThreads = prevThreads.filter(t => t.id !== sessionId).concat(thread);
        try {
          // Clean up old threads before saving
          const cleanedThreads = cleanupOldThreads(newThreads);
          localStorage.setItem('chat_threads', JSON.stringify(cleanedThreads));
          return cleanedThreads;
        } catch (error) {
          console.error('Error saving threads:', error);
          return newThreads;
        }
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? errorResponse : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (command: string) => {
    setCurrentMessage(command);
  };

  const handleNewChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setCurrentMessage('');
    
    // Create a new empty thread
    const newThread = {
      id: newSessionId,
      session_id: newSessionId,
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date().toISOString(),
      messages: []
    };

    setThreads(prevThreads => {
      const newThreads = [newThread, ...prevThreads];
      try {
        // Clean up old threads before saving
        const cleanedThreads = cleanupOldThreads(newThreads);
        localStorage.setItem('chat_threads', JSON.stringify(cleanedThreads));
        return cleanedThreads;
      } catch (error) {
        console.error('Error saving threads in handleNewChat:', error);
        return newThreads;
      }
    });
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setIsSidebarExpanded(false);
  };

  const handleToggleFavorite = (promptId: string) => {
    const updatedPrompts = prompts.map(prompt => 
      prompt.id === promptId
        ? { ...prompt, is_favorite: !prompt.is_favorite }
        : prompt
    );
    
    const sortedPrompts = [...updatedPrompts].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });
    
    localStorage.setItem('favorite_prompts', JSON.stringify(
      sortedPrompts.filter(p => p.is_favorite).map(p => p.id)
    ));
    
    setPrompts(sortedPrompts);
  };

  // Edit and delete functionality has been removed from the PromptCard component

  const categories = [...new Set(prompts.map(prompt => prompt.category))];
  const filteredPrompts = selectedCategory
    ? prompts.filter(prompt => prompt.category === selectedCategory)
    : prompts;

  const providerNames: Record<CloudProvider, string> = {
    aws: 'Amazon Web Services',
    azure: 'Microsoft Azure',
    gcp: 'Google Cloud Platform',
    onprem: 'On-Premises Infrastructure'
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full w-full">
        {messages.length === 0 ? (
          // Show prompt cards when no messages
          <div className="flex-1 overflow-auto h-full">
            <div className="h-full p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg font-medium mb-4">Select a prompt to get started</h2>
                
                <div className="flex overflow-x-auto space-x-2 pb-4">
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                  {filteredPrompts.map((promptItem) => (
                    <PromptCard
                      key={promptItem.id}
                      prompt={promptItem}
                      onSelect={() => handlePromptSelect(promptItem.command)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Show chat thread when there are messages
          <div className="flex-1 overflow-auto h-full">
            <ChatThread messages={messages} />
          </div>
        )}

        {/* Chat input always at the bottom */}
        <div className="bg-[#f9f9f9] border-t border-gray-200 w-full sticky bottom-0 z-10">
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              message={currentMessage}
              setMessage={setCurrentMessage}
              prompts={filteredPrompts}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export function App({ initialThread }: AppProps) {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  
  // Listen for JWT expiration events
  useEffect(() => {
    const handleJwtExpired = () => {
      console.log('JWT expiration event received');
      setShowSessionExpiredModal(true);
    };
    
    // Add event listener for JWT expiration
    window.addEventListener('jwt-expired', handleJwtExpired);
    
    return () => {
      window.removeEventListener('jwt-expired', handleJwtExpired);
    };
  }, []);
  
  return (
    <>
      <NavigationProvider>
        <ChatApp initialThread={initialThread} />
      </NavigationProvider>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
      
      {/* Session expired modal */}
      <SessionExpiredModal 
        show={showSessionExpiredModal} 
        onClose={() => setShowSessionExpiredModal(false)} 
      />
    </>
  );
}