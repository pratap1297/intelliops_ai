import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '../components/Footer';
import { PromptDialog } from '../components/PromptDialog';
import { PromptLibraryCard } from '../components/PromptLibraryCard';
import { AppLayout } from '../components/AppLayout';
import { PromptFilters } from '../components/PromptFilters';
import { Prompt } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as promptService from '../services/promptService';

import logger from '../lib/logger';
export function PromptLibrary() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoritePrompts, setFavoritePrompts] = useState<Prompt[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const navigate = useNavigate();

  // Get current user from localStorage with proper admin status check
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return null;
      
      const userData = JSON.parse(userStr);
      
      // Ensure isAdmin is properly set as a boolean
      if (userData && userData.is_admin !== undefined) {
        // Backend uses is_admin, frontend uses isAdmin - normalize it
        userData.isAdmin = Boolean(userData.is_admin);
      } else if (userData && userData.isAdmin !== undefined) {
        // Make sure it's a boolean
        userData.isAdmin = Boolean(userData.isAdmin);
      }
      
      return userData;
    } catch (e) {
      logger.error('Error parsing user from localStorage:', e);
      return null;
    }
  };

  // Log current user data on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        logger.log('Current user data from localStorage:', userData);
        logger.log('Is admin?', userData.isAdmin);
        logger.log('User ID:', userData.id);
      } catch (e) {
        logger.error('Error parsing user data:', e);
      }
    } else {
      logger.log('No user data found in localStorage');
    }
  }, []);

  // Initialize provider from localStorage on component mount
  useEffect(() => {
    // Get initial provider from localStorage
    const savedProvider = localStorage.getItem('selectedProvider');
    if (savedProvider) {
      logger.log('Initial provider from localStorage:', savedProvider);
      setSelectedProvider(savedProvider);
      
      // Force an immediate fetch with the correct provider
      // We'll use a timeout to ensure state is updated before fetching
      setTimeout(() => {
        fetchPrompts(savedProvider);
      }, 0);
    } else {
      // If no provider is saved, use 'all' as default
      setSelectedProvider('all');
    }
    
    // Handler for provider change events
    const handleProviderChanged = (event: CustomEvent) => {
      const { provider } = event.detail;
      logger.log('Global provider changed to:', provider);
      setSelectedProvider(provider);
      
      // Force an immediate fetch with the new provider
      setTimeout(() => {
        fetchPrompts(provider);
      }, 0);
    };
    
    // Add event listener
    document.addEventListener('providerChanged', handleProviderChanged as EventListener);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('providerChanged', handleProviderChanged as EventListener);
    };
  }, []);

  // Fetch prompts when component mounts or filters change
  useEffect(() => {
    fetchPrompts();
    fetchFavoritePrompts();
  }, [selectedProvider, selectedCategory, showFavoritesOnly]);
  
  // Store the selected category in localStorage when it changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      localStorage.setItem('selectedPromptCategory', selectedCategory);
    } else {
      localStorage.removeItem('selectedPromptCategory');
    }
  }, [selectedCategory]);

  // Load saved category from localStorage when component mounts
  useEffect(() => {
    const savedCategory = localStorage.getItem('selectedPromptCategory');
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
  }, []);

  // Fetch prompts from the API
  const fetchPrompts = async (providerOverride?: string) => {
    try {
      setIsLoading(true);
      
      // Get current user
      const currentUser = getCurrentUser();
      const isAdmin = currentUser?.isAdmin || false;
      
      // Use provider override if provided, otherwise use the state value
      const effectiveProvider = providerOverride || selectedProvider;
      logger.log('Fetching prompts with provider:', effectiveProvider);
      
      let allPrompts: Prompt[] = [];
      
      // If showing favorites only, get favorite prompts
      if (showFavoritesOnly) {
        allPrompts = await promptService.getFavoritePrompts();
        
        // Even for favorites, we need to filter by the current provider
        if (effectiveProvider !== 'all') {
          allPrompts = allPrompts.filter(prompt => prompt.cloud_provider === effectiveProvider);
        }
      } else {
        // If admin, get all prompts, otherwise get user's prompts + system prompts
        if (isAdmin) {
          allPrompts = await promptService.getAllPromptsAdmin(
            selectedCategory !== 'all' ? selectedCategory : undefined,
            effectiveProvider !== 'all' ? effectiveProvider : undefined
          );
        } else {
          allPrompts = await promptService.getPrompts(
            selectedCategory !== 'all' ? selectedCategory : undefined,
            effectiveProvider !== 'all' ? effectiveProvider : undefined
          );
        }
      }
      
      logger.log('Fetched prompts before filtering:', allPrompts.length);
      
      // Ensure strict filtering by provider and category
      allPrompts = allPrompts.filter(prompt => {
        const categoryMatch = selectedCategory === 'all' || prompt.category === selectedCategory;
        const providerMatch = effectiveProvider === 'all' || prompt.cloud_provider === effectiveProvider;
        return categoryMatch && providerMatch;
      });
      
      logger.log('Prompts after filtering by provider and category:', allPrompts.length);
      
      // Clear previous prompts first to ensure UI updates
      setPrompts([]);
      // Then set the new filtered prompts
      setPrompts(allPrompts);
      
      // Fetch all prompts to extract categories
      const fetchAllPrompts = isAdmin ? 
        await promptService.getAllPromptsAdmin() : 
        await promptService.getPrompts();
      
      // Filter categories based on the effective provider
      let filteredPrompts = fetchAllPrompts;
      if (effectiveProvider !== 'all') {
        filteredPrompts = fetchAllPrompts.filter(prompt => 
          prompt.cloud_provider === effectiveProvider
        );
      }
      
      // Extract unique categories from the filtered prompts
      const uniqueCategories = [...new Set(filteredPrompts.map(prompt => prompt.category))].filter(Boolean);
      setCategories(uniqueCategories);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Error fetching prompts:', error);
      toast.error('Failed to load prompts');
      setIsLoading(false);
    }
  };
  
  // Fetch favorite prompts
  const fetchFavoritePrompts = async () => {
    try {
      const favorites = await promptService.getFavoritePrompts();
      setFavoritePrompts(favorites);
    } catch (error) {
      logger.error('Error fetching favorite prompts:', error);
    }
  };

  // Group prompts by category for display
  const groupedPrompts = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      const categoryPrompts = prompts.filter(prompt => prompt.category === category);
      if (categoryPrompts.length > 0) {
        acc[category] = categoryPrompts;
      }
      return acc;
    }, {} as Record<string, Prompt[]>);
  }, [prompts, categories]);
  
  // Create categoriesByProvider object for the PromptDialog
  const categoriesByProvider = React.useMemo(() => {
    const result: Record<string, string[]> = {
      'aws': [],
      'gcp': [],
      'azure': [],
      'onprem': []
    };
    
    // Group categories by cloud provider
    prompts.forEach(prompt => {
      const provider = prompt.cloud_provider;
      const category = prompt.category;
      
      if (provider && category && !result[provider]?.includes(category)) {
        if (!result[provider]) {
          result[provider] = [];
        }
        result[provider].push(category);
      }
    });
    
    return result;
  }, [prompts]);

  // Toggle favorite status of a prompt
  const handleToggleFavorite = async (prompt: Prompt) => {
    try {
      if (prompt.is_favorite) {
        // Remove from favorites
        await promptService.removeFromFavorites(prompt.id);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        await promptService.addToFavorites(prompt.id);
        toast.success('Added to favorites');
      }
      
      // Refresh prompts to update favorite status
      await fetchPrompts();
      await fetchFavoritePrompts();
    } catch (error) {
      logger.error('Error toggling favorite status:', error);
      toast.error('Failed to update favorites');
    }
  };

  // Create a new prompt
  const handleCreatePrompt = async (promptData: Omit<Prompt, 'id'>) => {
    logger.log('handleCreatePrompt called with data:', promptData);
    try {
      const loadingToast = toast.loading('Creating prompt...');
      
      // Validate required fields
      if (!promptData.title || !promptData.command || !promptData.category || !promptData.cloud_provider) {
        logger.error('Missing required fields:', { 
          title: promptData.title, 
          command: promptData.command, 
          category: promptData.category, 
          cloud_provider: promptData.cloud_provider 
        });
        toast.error('Missing required fields', { id: loadingToast });
        return;
      }
      
      logger.log('Creating prompt with data:', promptData);
      
      // Create prompt via API
      const createdPrompt = await promptService.createPrompt(promptData);
      logger.log('Prompt created successfully:', createdPrompt);
      
      // Refresh prompts list to include the new prompt
      await fetchPrompts();
      
      toast.success('Prompt created successfully!', { id: loadingToast });
      setIsCreateDialogOpen(false);
    } catch (error) {
      logger.error('Error creating prompt:', error);
      
      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          logger.error('API error response:', axiosError.response.status, axiosError.response.data);
          toast.error(`Failed to create prompt: ${axiosError.response.data?.detail || 'Unknown error'}`);
        } else {
          toast.error('Network error when creating prompt');
        }
      } else {
        toast.error('Failed to create prompt');
      }
    }
  };

  // Update an existing prompt
  const handleUpdatePrompt = async (promptId: string, promptData: Partial<Prompt>) => {
    try {
      const loadingToast = toast.loading('Updating prompt...');
      
      // Update prompt via API
      await promptService.updatePrompt(promptId, promptData);
      
      // Refresh prompts list to include the updated prompt
      await fetchPrompts();
      
      toast.success('Prompt updated successfully!', { id: loadingToast });
      setIsEditDialogOpen(false);
      setSelectedPrompt(null);
    } catch (error) {
      logger.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
    }
  };

  // Delete a prompt
  const handleDeletePrompt = async (prompt: Prompt) => {
    if (!window.confirm(`Are you sure you want to delete the prompt: ${prompt.title}?`)) {
      return;
    }
    
    try {
      const loadingToast = toast.loading('Deleting prompt...');
      
      // Delete prompt via API
      await promptService.deletePrompt(prompt.id);
      
      // Refresh prompts list
      await fetchPrompts();
      
      toast.success('Prompt deleted successfully!', { id: loadingToast });
    } catch (error) {
      logger.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  // Check if user can edit a prompt
  const canEditPrompt = (prompt: Prompt) => {
    const currentUser = getCurrentUser();
    logger.log('Current user:', currentUser);
    logger.log('Checking edit permissions for prompt:', prompt);
    
    if (!currentUser) {
      logger.log('No current user found, denying edit permission');
      return false;
    }
    
    // Admin can edit any prompt, including system prompts
    if (currentUser.isAdmin) {
      logger.log('User is admin, granting edit permission');
      return true;
    }
    
    // Regular user can only edit their own non-system prompts
    const canEdit = !prompt.is_system && prompt.user_id === currentUser.id?.toString();
    logger.log(`Regular user permission check: is_system=${prompt.is_system}, user_id match=${prompt.user_id === currentUser.id?.toString()}, canEdit=${canEdit}`);
    return canEdit;
  };

  // Check if user can delete a prompt
  const canDeletePrompt = (prompt: Prompt) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    // Admin can delete any prompt, including system prompts
    if (currentUser.isAdmin) return true;
    
    // Regular user can only delete their own non-system prompts
    return !prompt.is_system && prompt.user_id === currentUser.id?.toString();
  };

  // Handle opening the edit dialog
  const handleEditClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsEditDialogOpen(true);
  };

  // Handle filter changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleProviderChange = (provider: string) => {
    logger.log('Changing provider to:', provider);
    
    // Save the selected provider to localStorage
    localStorage.setItem('selectedProvider', provider);
    
    // Update the provider state
    setSelectedProvider(provider);
    
    // Force an immediate fetch with the new provider
    fetchPrompts(provider);
    
    // Dispatch a global event for other components to listen to
    const event = new CustomEvent('providerChanged', { detail: { provider } });
    document.dispatchEvent(event);
  };

  const handleFavoritesToggle = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Prompt Library</h1>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Prompt
          </button>
        </div>

        <PromptFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          showFavoritesOnly={showFavoritesOnly}
          onFavoritesToggle={handleFavoritesToggle}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No prompts found</p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                View all prompts
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPrompts.map((prompt) => (
                    <PromptLibraryCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={canEditPrompt(prompt) ? handleEditClick : undefined}
                      onDelete={canDeletePrompt(prompt) ? handleDeletePrompt : undefined}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Prompt Dialog */}
      {isCreateDialogOpen && (
        <PromptDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={handleCreatePrompt}
          title="Create New Prompt"
          existingCategories={categories}
          categoriesByProvider={categoriesByProvider}
        />
      )}

      {/* Edit Prompt Dialog */}
      {isEditDialogOpen && selectedPrompt && (
        <PromptDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedPrompt(null);
          }}
          onSubmit={(promptData) => handleUpdatePrompt(selectedPrompt.id, promptData as Partial<Prompt>)}
          title="Edit Prompt"
          initialData={selectedPrompt}
          existingCategories={categories}
          categoriesByProvider={categoriesByProvider}
        />
      )}

      <Footer />
    </AppLayout>
  );
}

export default PromptLibrary;
