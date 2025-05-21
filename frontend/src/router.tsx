import { createBrowserRouter, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { STACK_BASE_URL, FINOPS_BASE_URL, FEATURES } from './config';
import { App } from './App';
import { ChatHistory } from './pages/ChatHistory';
import { PromptLibrary } from './pages/PromptLibrary';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { InfrastructurePage } from './pages/InfrastructurePage';
import { ExternalPage } from './pages/ExternalPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { Profile } from './pages/Profile';
import { WelcomePage } from './pages/WelcomePage';
import { RbacPage } from './pages/RbacPage';
import { BackendTestPage } from './pages/BackendTestPage';
import { TestChatPage } from './pages/TestChatPage';
import { SimpleChatPage } from './pages/SimpleChatPage';
import { BasicChatPage } from './pages/BasicChatPage';
import { FixedOriginalChat } from './pages/FixedOriginalChat';
import NavigationManagerPage from './pages/NavigationManagerPage';
import { ChatThread } from './types';
import { AuthGuard } from './components/AuthGuard';
import { ProviderAccessGuard } from './components/ProviderAccessGuard';
import { WithNavigation } from './components/WithNavigation';

// Define the ChatHistoryContainer component
const ChatHistoryContainer = () => {
  console.log('>>> ChatHistoryContainer rendering <<<');
  const navigate = useNavigate();
  const [savedThreads, setSavedThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load threads when component mounts
  useEffect(() => {
    const loadThreads = () => {
      setIsLoading(true);
      try {
        const savedThreadsStr = localStorage.getItem('chat_threads');
        console.log('ChatHistoryContainer - Loading saved threads from localStorage');
        
        if (savedThreadsStr) {
          const parsedThreads = JSON.parse(savedThreadsStr);
          console.log('ChatHistoryContainer - Parsed threads:', parsedThreads.length, 'threads found');
          
          // Sort threads by timestamp (newest first)
          const sortedThreads = [...parsedThreads].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          setSavedThreads(sortedThreads);
        } else {
          console.log('ChatHistoryContainer - No threads found in localStorage');
          setSavedThreads([]);
        }
      } catch (error) {
        console.error('ChatHistoryContainer - Error parsing threads:', error);
        setSavedThreads([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThreads();
  }, []);
  
  const handleThreadSelect = (thread: ChatThread) => {
    console.log('ChatHistoryContainer - Thread selected:', thread.id);
    
    // Ensure the thread has all required fields
    if (!thread.id || !thread.session_id) {
      console.error('ChatHistoryContainer - Invalid thread selected:', thread);
      toast.error('Invalid thread selected. Please try again.');
      return;
    }
    
    try {
      // Ensure messages array exists
      if (!thread.messages) {
        thread.messages = [];
      }
      
      // Store the thread in localStorage for the AppWrapper to pick up
      localStorage.setItem('selected_thread', JSON.stringify(thread));
      console.log('ChatHistoryContainer - Saved selected thread to localStorage');
      
      // Navigate to the chat page with the thread ID in the URL
      // This provides a fallback mechanism in case localStorage fails
      navigate(`/chat?thread=${thread.id}`);
    } catch (error) {
      console.error('ChatHistoryContainer - Error saving selected thread:', error);
      // Even if localStorage fails, try to navigate with the ID in the URL
      navigate(`/chat?thread=${thread.id}`);
    }
  };
  
  return (
    <div className="h-screen">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading chat history...</p>
        </div>
      ) : (
        <ChatHistory threads={savedThreads} onSelectThread={handleThreadSelect} />
      )}
    </div>
  );
};

// Wrap pages that use AppLayout with the WithNavigation HOC
const WrappedChatHistory = WithNavigation(ChatHistory);
const WrappedChatHistoryContainer = WithNavigation(ChatHistoryContainer);
const WrappedPromptLibrary = WithNavigation(PromptLibrary);
const WrappedSecurityPage = WithNavigation(SecurityPage);
const WrappedSettingsPage = WithNavigation(SettingsPage);
const WrappedLogsPage = WithNavigation(LogsPage);
const WrappedNotificationsPage = WithNavigation(NotificationsPage);
const WrappedInfrastructurePage = WithNavigation(InfrastructurePage);
const WrappedExternalPage = WithNavigation(ExternalPage);
const WrappedProfile = WithNavigation(Profile);
const WrappedWelcomePage = WithNavigation(WelcomePage);
const WrappedRbacPage = WithNavigation(RbacPage);
const WrappedBackendTestPage = WithNavigation(BackendTestPage);
const WrappedTestChatPage = WithNavigation(TestChatPage);
const WrappedBasicChatPage = WithNavigation(BasicChatPage);
const WrappedFixedOriginalChat = WithNavigation(FixedOriginalChat);
const WrappedNavigationManagerPage = WithNavigation(NavigationManagerPage);

const AppWrapper = () => {
  const [selectedThread, setSelectedThread] = useState<ChatThread | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Priority 1: Check if we have a selected thread in localStorage (from direct selection)
    const selectedThreadStr = localStorage.getItem('selected_thread');
    console.log('AppWrapper - Checking for selected_thread in localStorage:', selectedThreadStr ? 'Found' : 'Not found');
    
    if (selectedThreadStr) {
      try {
        const thread = JSON.parse(selectedThreadStr);
        console.log('AppWrapper - Parsed thread from localStorage:', thread);
        
        // Validate thread data to ensure it has required fields
        if (thread && thread.id && thread.session_id) {
          setSelectedThread(thread);
          console.log('AppWrapper - Successfully set thread from localStorage');
          
          // Clear from localStorage to avoid reloading on refresh
          localStorage.removeItem('selected_thread');
          
          // Update URL to include thread ID for better navigation
          if (!location.search.includes(`thread=${thread.id}`)) {
            navigate(`/chat?thread=${thread.id}`, { replace: true });
          }
          return; // Exit early since we found a thread
        } else {
          console.error('Invalid thread data in localStorage:', thread);
          localStorage.removeItem('selected_thread');
        }
      } catch (error) {
        console.error('Error parsing selected thread in AppWrapper:', error);
        localStorage.removeItem('selected_thread');
      }
    }
    
    // Priority 2: Check if we're coming from a URL with a thread ID
    const urlParams = new URLSearchParams(location.search);
    const threadId = urlParams.get('thread');
    
    if (threadId) {
      console.log('AppWrapper - Found thread ID in URL:', threadId);
      // Try to load the thread from localStorage
      try {
        const savedThreadsStr = localStorage.getItem('chat_threads');
        if (savedThreadsStr) {
          const savedThreads = JSON.parse(savedThreadsStr) as ChatThread[];
          const thread = savedThreads.find(t => t.id === threadId);
          
          if (thread) {
            console.log('AppWrapper - Found thread in chat_threads:', thread);
            
            // Ensure thread has all required fields
            if (thread.session_id && thread.messages) {
              setSelectedThread(thread);
              console.log('AppWrapper - Successfully set thread from URL parameter');
              return; // Exit early since we found a thread
            } else {
              console.error('Thread from URL has missing required fields:', thread);
            }
          } else {
            console.log('AppWrapper - Thread not found in localStorage');
          }
        }
      } catch (error) {
        console.error('Error loading thread from localStorage:', error);
      }
    }
    
    // Priority 3: If no thread was found or loaded, leave selectedThread as undefined
    console.log('AppWrapper - No valid thread found, using undefined for new chat session');
  }, [navigate, location.search]);
  
  console.log('AppWrapper - Rendering App with initialThread:', selectedThread);
  return <App initialThread={selectedThread} />;
};



export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/welcome',
    element: <AuthGuard><WrappedWelcomePage /></AuthGuard>,
  },
  {
    path: '/profile',
    element: <AuthGuard><WrappedProfile /></AuthGuard>,
  },
  {
    path: '/rbac',
    element: <AuthGuard adminOnly={true}><ProviderAccessGuard><WrappedRbacPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/chat',
    element: <AuthGuard><ProviderAccessGuard><AppWrapper /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/original-chat',
    element: <Navigate to="/chat" replace />,
  },
  {
    path: '/fixed-chat',
    element: <Navigate to="/chat" replace />,
  },
  {
    path: '/basic-chat',
    element: <AuthGuard><ProviderAccessGuard><WrappedBasicChatPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/legacy-chat',
    element: <AuthGuard><ProviderAccessGuard><AppWrapper /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/chat/history',
    element: <AuthGuard><ProviderAccessGuard><WrappedChatHistoryContainer /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/prompt-library',
    element: <AuthGuard><ProviderAccessGuard><WrappedPromptLibrary /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/infrastructure',
    element: FEATURES.enableExternalServices ? 
      <AuthGuard><ProviderAccessGuard><WrappedExternalPage url={`${STACK_BASE_URL}/`} /></ProviderAccessGuard></AuthGuard> : 
      <Navigate to="/" replace />,
  },
  {
    path: '/infrastructure/*',
    element: <AuthGuard><ProviderAccessGuard><InfrastructurePage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/security',
    element: <AuthGuard><ProviderAccessGuard><WrappedSecurityPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/settings',
    element: <AuthGuard><ProviderAccessGuard><WrappedSettingsPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/logs',
    element: <AuthGuard><ProviderAccessGuard><WrappedLogsPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/notifications',
    element: <AuthGuard><ProviderAccessGuard><WrappedNotificationsPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/finops',
    element: FEATURES.enableFinOps ? 
      <AuthGuard><ProviderAccessGuard><ExternalPage url={`${FINOPS_BASE_URL}/`} /></ProviderAccessGuard></AuthGuard> : 
      <Navigate to="/" replace />,
  },
  {
    path: '/backend-test',
    element: <AuthGuard><ProviderAccessGuard><WrappedBackendTestPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/test-chat',
    element: <AuthGuard><ProviderAccessGuard><WrappedTestChatPage /></ProviderAccessGuard></AuthGuard>,
  },
  {
    path: '/simple-chat',
    element: <SimpleChatPage />,
  },
  {
    path: '/navigation-manager',
    element: <AuthGuard adminOnly={true}><ProviderAccessGuard><WrappedNavigationManagerPage /></ProviderAccessGuard></AuthGuard>,
  },
]);
