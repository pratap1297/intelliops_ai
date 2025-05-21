import React from 'react';
import { ChatThread } from '../types';
import { X, MessageSquare } from 'lucide-react';

interface ThreadListProps {
  threads: ChatThread[];
  onClose: () => void;
  onSelectThread: (thread: ChatThread) => void;
  selectedThreadId?: string;
}

export function ThreadList({ threads, onClose, onSelectThread, selectedThreadId }: ThreadListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Recent chats</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread)}
            className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors ${
              thread.id === selectedThreadId ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {thread.title}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {thread.lastMessage}
                </p>
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">
                {new Date(thread.timestamp).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}