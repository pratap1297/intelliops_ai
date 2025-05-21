import React, { useState, useEffect } from 'react';
import { CloudProvider, Prompt } from '../types';
import toast from 'react-hot-toast';
import * as promptService from '../services/promptService';

export function SimpleChatPage() {
  // State management
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Load prompts on component mount
  useEffect(() => {
    const loadPrompts = async () => {
      console.log('SimpleChatPage - Loading prompts for provider:', provider);
      
      try {
        // Use the same promptService as the Prompt Library
        const apiPrompts = await promptService.getPrompts(
          undefined, // No category filter
          provider // Provider filter
        );
        
        // Load favorites from API
        try {
          const favorites = await promptService.getFavoritePrompts();
          const favoriteIds = new Set(favorites.map(p => p.id));
          setFavorites(favoriteIds);
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
        
        setPrompts(apiPrompts);
        console.log('SimpleChatPage - Loaded', apiPrompts.length, 'prompts from API');
      } catch (error) {
        console.error('Error loading prompts:', error);
        setPrompts([]);
      }
    };
    
    loadPrompts();
  }, [provider]);
  
  // Filter prompts by selected category
  const filteredPrompts = selectedCategory
    ? prompts.filter(prompt => prompt.category === selectedCategory)
    : prompts;
  
  // Get unique categories
  const categories = [...new Set(prompts.map(prompt => prompt.category))];
  
  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  // Handle prompt selection
  const handlePromptSelect = (command: string) => {
    toast.success('Prompt selected: ' + command);
    // In a real implementation, this would start a chat with the selected prompt
    console.log('Selected prompt command:', command);
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (promptId: string) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(promptId)) {
      newFavorites.delete(promptId);
    } else {
      newFavorites.add(promptId);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorite_prompts', JSON.stringify([...newFavorites]));
    toast.success(newFavorites.has(promptId) ? 'Added to favorites' : 'Removed from favorites');
  };
  
  console.log('SimpleChatPage - Rendering with', filteredPrompts.length, 'filtered prompts');
  console.log('SimpleChatPage - Categories:', categories);

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <h1 className="ml-2 text-xl font-semibold text-gray-900">AI Force IntelliOps</h1>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md">New Chat</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium mb-4">Select a prompt to get started</h2>
              
              {/* Categories */}
              <div className="flex overflow-x-auto space-x-2 pb-4">
                <button 
                  onClick={() => handleCategorySelect(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === null 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button 
                    key={category} 
                    onClick={() => handleCategorySelect(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {filteredPrompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900">{prompt.title}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {prompt.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{prompt.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <button 
                          onClick={() => handlePromptSelect(prompt.command)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Use
                        </button>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleToggleFavorite(prompt.id)}
                            className={`${favorites.has(prompt.id) ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={favorites.has(prompt.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        </div>
      </main>

      <footer className="bg-white shadow mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">Powered by AI Force IntelliOps</p>
        </div>
      </footer>
    </div>
  );
}
