import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot, AlertCircle, Loader } from 'lucide-react';
import { formatMessage } from '../utils/messageFormatter';

interface ChatThreadProps {
  messages: Message[];
}

export function ChatThread({ messages }: ChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto py-6 pb-16 flex-1 w-full">
      <div className="max-w-4xl mx-auto space-y-4 w-full px-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-4 px-4">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-blue-600' 
                  : message.status === 'error'
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}
            >
              {message.sender === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : message.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Bot className="w-5 h-5 text-gray-700" />
              )}
            </div>
            <div className="flex-1">
              <div 
                className={`rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-50 text-blue-900'
                    : message.status === 'error'
                    ? 'bg-red-50 text-red-900'
                    : message.status === 'loading'
                    ? 'bg-gray-50 text-gray-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.status === 'error' && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">Error</span>
                  </div>
                )}
                {message.status === 'loading' ? (
                  <div className="flex items-center gap-3">
                    <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-gray-600">Processing your request...</span>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(message.content) 
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}