import React from 'react';
import { Send, Loader } from 'lucide-react';
import { Prompt } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  prompts: Prompt[];
  message: string;
  setMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage, isLoading, message, setMessage }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 min-h-[50px] flex items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Copilot..."
            className="flex-1 bg-transparent border-0 focus:ring-0 px-3 py-2 placeholder-gray-500 text-gray-900 text-sm resize-none min-h-[50px] max-h-[150px] w-full"
            style={{ height: '50px', overflowY: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '50px';
              target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="h-full px-3 flex items-center justify-center border-l border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 text-gray-600 animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}