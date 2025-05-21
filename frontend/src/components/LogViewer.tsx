import { useState } from 'react';
import { LogEntry, LogFilter } from '../types';
import { Clock, Search, Filter, ChevronDown, ChevronUp, AlertCircle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  onFilterChange?: (filters: LogFilter) => void;
  isInline?: boolean;
  isLoading?: boolean;
}

export function LogViewer({ logs, onFilterChange, isInline = false, isLoading = false }: LogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<LogFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleFilterChange = (newFilters: Partial<LogFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <ArrowRight className="w-4 h-4 text-blue-500" />;
      case 'response':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(2)}ms`;
  };

  const formatTimestamp = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatContent = (content: any) => {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${isInline ? 'border' : ''}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading logs...</span>
        </div>
      )}
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Logs</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange({ provider: e.target.value })}
              className="block w-full rounded-lg border-gray-300 text-sm"
            >
              <option value="">All Providers</option>
              <option value="aws">AWS</option>
              <option value="gcp-dialogflow">GCP Dialogflow</option>
              <option value="gcp-custom">GCP Custom</option>
              <option value="azure">Azure</option>
              <option value="onprem">On-Prem</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value })}
              className="block w-full rounded-lg border-gray-300 text-sm"
            >
              <option value="">All Types</option>
              <option value="request">Requests</option>
              <option value="response">Responses</option>
              <option value="error">Errors</option>
              <option value="info">Info</option>
            </select>

            <input
              type="datetime-local"
              value={filters.startDate instanceof Date ? filters.startDate.toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFilterChange({ startDate: new Date(e.target.value) })}
              className="block w-full rounded-lg border-gray-300 text-sm"
              placeholder="Start Date"
            />

            <input
              type="datetime-local"
              value={filters.endDate instanceof Date ? filters.endDate.toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFilterChange({ endDate: new Date(e.target.value) })}
              className="block w-full rounded-lg border-gray-300 text-sm"
              placeholder="End Date"
            />
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className={`divide-y divide-gray-200 ${isInline ? 'max-h-96 overflow-y-auto' : ''}`}>
        {logs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-gray-50">
            <div
              className="flex items-start cursor-pointer"
              onClick={() => toggleLogExpansion(log.id)}
            >
              <div className="flex-shrink-0 mt-1">{getLogIcon(log.type)}</div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {log.endpoint || log.type.toUpperCase()}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                    {log.duration && (
                      <div className="text-gray-400">{formatDuration(log.duration)}</div>
                    )}
                    {log.status && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium
                        ${log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' :
                          log.status >= 400 ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {log.status}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-sm text-gray-500 truncate">
                    {log.provider} | Session: {log.session_id}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                {expandedLogs.has(log.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedLogs.has(log.id) && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formatContent(log.content)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No logs available
          </div>
        )}
      </div>
    </div>
  );
}