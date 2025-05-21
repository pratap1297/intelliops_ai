import { useState, useEffect } from 'react';
import { Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogViewer } from '../components/LogViewer';
import { LogEntry, LogFilter } from '../types';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

// Define pagination state interface
interface PaginationState {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<LogFilter>({});
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    page_size: 50,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });

  useEffect(() => {
    fetchLogs();
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchLogs(filters);
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [filters]);

  const fetchLogs = async (filters?: LogFilter, page: number = 1) => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('page_size', '50');
      
      if (filters) {
        if (filters.provider) params.append('provider', filters.provider);
        if (filters.type) params.append('log_type', filters.type);
        if (filters.session_id) params.append('session_id', filters.session_id);
        if (filters.startDate) params.append('start_date', filters.startDate instanceof Date ? filters.startDate.toISOString() : String(filters.startDate));
        if (filters.endDate) params.append('end_date', filters.endDate instanceof Date ? filters.endDate.toISOString() : String(filters.endDate));
      }
      
      // Fetch logs from backend API
      const url = `${API_BASE_URL}/api/logs?${params.toString()}`;
      console.log('Fetching logs from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch logs: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received logs:', data);
      
      // Check if the response has the new format (object with logs and pagination)
      if (data && data.logs && Array.isArray(data.logs)) {
        // New format with pagination
        // Convert logs to LogEntry format
        const fetchedLogs: LogEntry[] = data.logs.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp, // Keep as string to match LogEntry type
          type: log.type,
          provider: log.provider,
          session_id: log.session_id,
          content: log.content,
          status: log.status,
          duration: log.duration,
          endpoint: log.endpoint,
          error: log.error
        }));
        
        setLogs(fetchedLogs);
        
        // Update pagination state if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
        
        toast.success(`Loaded ${fetchedLogs.length} logs (Page ${data.pagination?.page || 1} of ${data.pagination?.total_pages || 1})`);
      } else if (Array.isArray(data)) {
        // Old format (direct array of logs)
        const fetchedLogs: LogEntry[] = data.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp, // Keep as string to match LogEntry type
          type: log.type,
          provider: log.provider,
          session_id: log.session_id,
          content: log.content,
          status: log.status,
          duration: log.duration,
          endpoint: log.endpoint,
          error: log.error
        }));
        
        setLogs(fetchedLogs);
        toast.success(`Loaded ${fetchedLogs.length} logs`);
      } else {
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<LogFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchLogs(updatedFilters);
  };

  const handleExport = () => {
    try {
      const exportData = JSON.stringify(logs, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error(`Failed to export logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <Header subtitle="System Logs" />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <select
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onChange={(e) => handleFilterChange({ provider: e.target.value || undefined })}
                value={filters.provider || ""}
              >
                <option value="">All Providers</option>
                <option value="aws">AWS</option>
                <option value="azure">Azure</option>
                <option value="gcp">GCP</option>
                <option value="onprem">On-Prem</option>
              </select>
              
              <select
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
                value={filters.type || ""}
              >
                <option value="">All Types</option>
                <option value="request">Requests</option>
                <option value="response">Responses</option>
                <option value="error">Errors</option>
                <option value="info">Info</option>
              </select>
              
              <input
                type="text"
                placeholder="Session ID"
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onChange={(e) => handleFilterChange({ session_id: e.target.value || undefined })}
                value={filters.session_id || ""}
              />
              
              <button
                onClick={() => fetchLogs(filters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
            
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </button>
          </div>

          {/* Log Viewer */}
          <div className="bg-white shadow rounded-lg">
            <LogViewer
              logs={logs}
              isLoading={isLoading}
              onFilterChange={handleFilterChange}
            />
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => pagination.has_prev && fetchLogs(filters, pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.has_prev ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => pagination.has_next && fetchLogs(filters, pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.has_next ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{logs.length > 0 ? ((pagination.page - 1) * pagination.page_size) + 1 : 0}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.page_size, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => pagination.has_prev && fetchLogs(filters, pagination.page - 1)}
                      disabled={!pagination.has_prev}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${pagination.has_prev ? 'text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers - show up to 5 pages */}
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      // Calculate page numbers to show around current page
                      const totalPages = pagination.total_pages;
                      const currentPage = pagination.page;
                      let pageNum;
                      
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all pages
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // If near start, show first 5 pages
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If near end, show last 5 pages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Show 2 pages before and after current page
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchLogs(filters, pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => pagination.has_next && fetchLogs(filters, pagination.page + 1)}
                      disabled={!pagination.has_next}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${pagination.has_next ? 'text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}