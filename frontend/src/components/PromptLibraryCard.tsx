import React from 'react';
import { FileText, Edit2, Trash2, Star, User, Shield, Heart } from 'lucide-react';
import { Prompt } from '../types';

interface PromptLibraryCardProps {
  prompt: Prompt;
  onSelect?: () => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onToggleFavorite?: (prompt: Prompt) => void;
}

export function PromptLibraryCard({ prompt, onSelect, onEdit, onDelete, onToggleFavorite }: PromptLibraryCardProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(prompt);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(prompt);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(prompt);
  };

  return (
    <div
      className={`p-4 bg-white rounded-lg border transition-colors text-left group w-full relative ${
        prompt.is_system 
          ? 'border-blue-200' 
          : 'border-purple-200'
      }`}
    >
      {prompt.is_system && (
        <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          System
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          prompt.is_system ? 'bg-blue-50' : 'bg-purple-50'
        }`}>
          <FileText className={`w-4 h-4 ${prompt.is_system ? 'text-blue-600' : 'text-purple-600'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-gray-900 truncate">{prompt.title}</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{prompt.description}</p>
          <code className={`mt-2 text-sm px-2 py-1 rounded block truncate ${
            prompt.is_system 
              ? 'bg-blue-50 text-blue-700' 
              : 'bg-purple-50 text-purple-700'
          }`}>
            {prompt.command}
          </code>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {prompt.cloud_provider.toUpperCase()}
              </span>
              {prompt.is_system ? (
                <Star className="w-4 h-4 text-blue-600" />
              ) : (
                <User className="w-4 h-4 text-purple-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <button
                  onClick={handleFavoriteClick}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title={prompt.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={`w-4 h-4 ${prompt.is_favorite ? "text-red-500 fill-red-500" : "text-gray-500 hover:text-red-500"}`} 
                  />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={handleEditClick}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Edit prompt"
                >
                  <Edit2 className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Delete prompt"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
