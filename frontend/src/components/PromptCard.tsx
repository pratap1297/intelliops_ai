import React from 'react';
import { FileText, Heart } from 'lucide-react';
import { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  onSelect: () => void;
  onToggleFavorite?: (promptId: string) => void;
  // Edit and delete props removed as functionality has been disabled
}

export function PromptCard({ prompt, onSelect, onToggleFavorite }: PromptCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt.id);
  };

  // Edit and delete functionality has been disabled

  return (
    <button
      onClick={onSelect}
      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors text-left group w-full relative"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-gray-900 truncate">{prompt.title}</h3>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{prompt.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!prompt.is_system && (
                <div className="flex items-center text-blue-600">
                  <span className="text-lg" title="User Created">👤</span>
                </div>
              )}
              <button
                onClick={handleFavoriteClick}
                className={`flex items-center ${
                  prompt.is_favorite 
                    ? 'text-yellow-500' 
                    : 'text-gray-400 opacity-0 group-hover:opacity-100'
                } transition-opacity`}
                title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${prompt.is_favorite ? 'fill-yellow-500' : ''}`} />
              </button>
            </div>
            
            {/* Edit and delete buttons have been removed to prevent any user from editing or deleting prompts */}
          </div>
        </div>
      </div>
    </button>
  );
}