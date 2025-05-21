import { useState, useEffect } from 'react';
import { MessageSquare, Search, ChevronLeft, ChevronRight, Calendar, X, Trash, AlertTriangle } from 'lucide-react';
import { ChatThread } from '../types';
import { AppLayout } from '../components/AppLayout';
import toast from 'react-hot-toast';

interface ChatHistoryProps {
  threads?: ChatThread[];
  onSelectThread?: (thread: ChatThread) => void;
}

export function ChatHistory({ threads = [], onSelectThread }: ChatHistoryProps) {
  // States for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredThreads, setFilteredThreads] = useState<ChatThread[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  
  // Pagination settings
  const threadsPerPage = 10;
  
  // Apply 30-day filter, search filter, and sorting to threads
  useEffect(() => {
    // Filter threads from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let filtered = threads.filter(thread => {
      const threadDate = new Date(thread.timestamp);
      return threadDate > thirtyDaysAgo;
    });
    
    // Apply search term if any
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(searchLower) || 
        thread.lastMessage.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      
      return sortOrder === 'newest' 
        ? dateB - dateA  // Newest first
        : dateA - dateB; // Oldest first
    });
    
    setFilteredThreads(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [threads, searchTerm, sortOrder]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / threadsPerPage));
  const startIndex = (currentPage - 1) * threadsPerPage;
  const paginatedThreads = filteredThreads.slice(startIndex, startIndex + threadsPerPage);

  const handleThreadSelect = (thread: ChatThread) => {
    if (onSelectThread) {
      onSelectThread(thread);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };
  
  const handleDeleteThread = (threadId: string) => {
    try {
      // Get current threads from localStorage
      const savedThreads = localStorage.getItem('chat_threads');
      if (savedThreads) {
        const threadsArray = JSON.parse(savedThreads);
        const updatedThreads = threadsArray.filter((t: ChatThread) => t.id !== threadId);
        
        // Save the updated threads array back to localStorage
        localStorage.setItem('chat_threads', JSON.stringify(updatedThreads));
        
        // Update local state for immediate UI feedback
        const updatedFilteredThreads = filteredThreads.filter(t => t.id !== threadId);
        setFilteredThreads(updatedFilteredThreads);
        
        toast.success('Chat deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };
  
  const handleDeleteAllThreads = () => {
    try {
      // Clear all chat threads from localStorage
      localStorage.setItem('chat_threads', JSON.stringify([]));
      
      // Update local state
      setFilteredThreads([]);
      setIsDeleteAllDialogOpen(false);
      
      toast.success('All chat history deleted');
    } catch (error) {
      console.error('Error deleting all chats:', error);
      toast.error('Failed to delete chat history');
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Chat History</h1>
          
          {filteredThreads.length > 0 && (
            <button
              onClick={() => setIsDeleteAllDialogOpen(true)}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash className="w-4 h-4 mr-1.5" />
              Delete All
            </button>
          )}
        </div>
        
        {/* Filters and Search */}
        <div className="flex justify-between mb-6 flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <button 
                onClick={() => setSortOrder('newest')}
                className={`text-sm px-3 py-1 rounded-md ${
                  sortOrder === 'newest' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortOrder('oldest')}
                className={`text-sm px-3 py-1 rounded-md ${
                  sortOrder === 'oldest' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
        
        {/* Information and Status */}
        <div className="mb-4 text-sm text-gray-500">
          <p>Showing chats from the last 30 days. {filteredThreads.length} results {searchTerm && `for "${searchTerm}"`}</p>
        </div>

        {/* Thread List */}
        <div className="h-full overflow-y-auto mb-6">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>No chat history found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="w-full p-4 text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 flex items-start justify-between"
                >
                  <button
                    onClick={() => handleThreadSelect(thread)}
                    className="flex-1 flex items-start justify-between text-left pr-2"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        {thread.title || 'Untitled Chat'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {thread.lastMessage || 'No messages'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(thread.timestamp).toLocaleString()}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteThread(thread.id)}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Delete chat"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageToShow;
                if (totalPages <= 5) {
                  pageToShow = i + 1;
                } else {
                  const offset = Math.max(0, Math.min(currentPage - 3, totalPages - 5));
                  pageToShow = i + 1 + offset;
                }
                
                return (
                  <button
                    key={pageToShow}
                    onClick={() => handlePageChange(pageToShow)}
                    className={`w-8 h-8 mx-1 rounded-md ${
                      currentPage === pageToShow 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageToShow}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="mx-1">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="w-8 h-8 mx-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
      
      {/* Delete All Confirmation Dialog */}
      {isDeleteAllDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Delete All Chat History</h3>
            </div>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete all chat history? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteAllDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllThreads}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}