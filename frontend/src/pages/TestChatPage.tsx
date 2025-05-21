import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Prompt, CloudProvider } from '../types';
import { PromptCard } from '../components/PromptCard';
import * as promptService from '../services/promptService';

import logger from '../lib/logger';
export function TestChatPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeProvider] = useState<CloudProvider>('aws');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        logger.log('TestChatPage - Loading prompts for provider:', activeProvider);
        
        // Use the same promptService as the Prompt Library
        const apiPrompts = await promptService.getPrompts(
          undefined, // No category filter
          activeProvider // Provider filter
        );
        
        logger.log('TestChatPage - Loaded prompts from API:', apiPrompts.length);
        setPrompts(apiPrompts);
        setIsLoading(false);
      } catch (err) {
        console.error('TestChatPage - Error loading prompts:', err);
        setError('Failed to load prompts');
        setIsLoading(false);
      }
    };
    
    loadPrompts();
  }, [activeProvider]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handlePromptSelect = (command: string) => {
    logger.log('Selected prompt command:', command);
    // Just log the command for testing
  };

  const categories = [...new Set(prompts.map(prompt => prompt.category))];
  const filteredPrompts = selectedCategory
    ? prompts.filter(prompt => prompt.category === selectedCategory)
    : prompts;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="h-full p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Test Chat Page</h1>
                <p className="mb-4">This is a test page to verify prompt cards are loading correctly.</p>
                <p className="mb-4">Provider: <strong>{activeProvider}</strong>, Loaded <strong>{prompts.length}</strong> prompts</p>
                
                <div className="flex overflow-x-auto space-x-2 pb-2 mb-4">
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
                      onToggleFavorite={() => logger.log('Toggle favorite:', promptItem.id)}
                      onEdit={() => logger.log('Edit prompt:', promptItem.id)}
                      onDelete={() => logger.log('Delete prompt:', promptItem.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
