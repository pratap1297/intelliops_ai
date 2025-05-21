import React, { useState, useEffect } from 'react';
import { X, Plus, Shield } from 'lucide-react';
import { Prompt, CloudProvider } from '../types';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: Omit<Prompt, 'id' | 'user_id'>) => void;
  initialData?: Prompt;
  title: string;
  existingCategories: string[];
  categoriesByProvider: Record<string, string[]>;
}

const cloudProviders: { id: CloudProvider; name: string }[] = [
  { id: 'aws', name: 'AWS' },
  { id: 'gcp', name: 'GCP' },
  { id: 'azure', name: 'Azure' },
  { id: 'onprem', name: 'On-Premises' },
];

export function PromptDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  title,
  existingCategories,
  categoriesByProvider
}: PromptDialogProps) {
  const [formData, setFormData] = React.useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    command: initialData?.command || '',
    cloud_provider: initialData?.cloud_provider || 'aws' as CloudProvider,
    is_system: initialData?.is_system || false,
  });
  const [isAddingNewCategory, setIsAddingNewCategory] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Check if user is admin
  React.useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      // Check both is_admin (backend format) and isAdmin (frontend format)
      const adminStatus = currentUser.is_admin !== undefined ? currentUser.is_admin : currentUser.isAdmin;
      setIsAdmin(Boolean(adminStatus));
      console.log('Admin status in PromptDialog:', adminStatus, 'isAdmin set to:', Boolean(adminStatus));
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, []);

  // Reset form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        category: initialData.category,
        command: initialData.command,
        cloud_provider: initialData.cloud_provider,
        is_system: initialData.is_system || false,
      });
      setIsAddingNewCategory(false);
      setNewCategory('');
    }
  }, [initialData]);

  // Get available categories for the selected cloud provider
  const availableCategories = React.useMemo(() => {
    // Add null check to prevent accessing properties of undefined
    if (!categoriesByProvider) {
      return [];
    }
    return categoriesByProvider[formData.cloud_provider] || [];
  }, [categoriesByProvider, formData.cloud_provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!formData.command.trim()) {
      alert('Please enter a command');
      return;
    }
    
    // Validate category
    const category = isAddingNewCategory ? newCategory : formData.category;
    if (!category || category === '') {
      alert('Please select or create a category');
      return;
    }
    
    console.log('Submitting prompt:', {
      ...formData,
      category: category,
      is_system: isAdmin ? formData.is_system : false
    });
    
    // Submit the form data
    try {
      onSubmit({
        ...formData,
        category: category,
        is_system: isAdmin ? formData.is_system : false, // Only admin can create system prompts
      });
      onClose();
    } catch (error) {
      console.error('Error submitting prompt:', error);
      alert('Failed to create prompt. Please try again.');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsAddingNewCategory(true);
    } else {
      setIsAddingNewCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  // Reset category when cloud provider changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, category: '' }));
    setIsAddingNewCategory(false);
    setNewCategory('');
  }, [formData.cloud_provider]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {initialData?.is_system && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                System Prompt
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cloud Provider
            </label>
            <select
              value={formData.cloud_provider}
              onChange={(e) => setFormData({ ...formData, cloud_provider: e.target.value as CloudProvider })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {cloudProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            {isAddingNewCategory ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(false)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Cancel new category
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="new">+ Add new category</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Command
            </label>
            <input
              type="text"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Admin-only system prompt option */}
          {isAdmin && (
            <div className="flex items-center">
              <input
                id="is_system"
                type="checkbox"
                checked={formData.is_system}
                onChange={(e) => setFormData({ ...formData, is_system: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_system" className="ml-2 block text-sm text-gray-900">
                Make this a system prompt
              </label>
              <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}