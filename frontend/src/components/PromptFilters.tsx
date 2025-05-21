import React from 'react';
import { Heart } from 'lucide-react';

interface PromptFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: () => void;
  // We're removing the provider props since they're handled by AppLayout
}

export function PromptFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onFavoritesToggle,
}: PromptFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Favorites Toggle */}
        <button
          onClick={onFavoritesToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            showFavoritesOnly
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-red-500 text-red-500' : ''}`} />
          {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}