import React from 'react';
import { CloudProvider } from '../types';
import { Cloud, Aperture as Azure, Server, Database, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeProvider: CloudProvider;
  onProviderChange: (provider: CloudProvider) => void;
  onExpandedChange?: (expanded: boolean) => void;
  isExpanded: boolean;
}

interface ProviderConfig {
  id: CloudProvider;
  label: string;
  icon: React.ElementType;
}

const providers: ProviderConfig[] = [
  { id: 'aws', label: 'AWS', icon: Cloud },
  { id: 'azure', label: 'Azure', icon: Azure },
  { id: 'gcp', label: 'GCP', icon: Database },
  { id: 'onprem', label: 'On-Prem', icon: Server }
];

export function Sidebar({ activeProvider, onProviderChange, onExpandedChange, isExpanded }: SidebarProps) {
  const handleExpand = (expanded: boolean) => {
    onExpandedChange?.(expanded);
  };

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-48' : 'w-16'
      }`}
    >
      <div className={`flex items-center justify-between ${isExpanded ? 'px-4 py-3' : 'p-2'} border-b border-gray-200`}>
        {isExpanded ? (
          <>
            <h2 className="text-sm font-medium text-gray-900">Providers</h2>
            <button
              onClick={() => handleExpand(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
          </>
        ) : (
          <button
            onClick={() => handleExpand(true)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors mx-auto"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
      
      <div className="flex-1 p-2">
        <div className="space-y-1">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isActive = activeProvider === provider.id;
            
            return (
              <button
                key={provider.id}
                onClick={() => {
                  onProviderChange(provider.id);
                  handleExpand(false);
                }}
                className={`
                  w-full flex items-center ${isExpanded ? 'px-3 py-2' : 'p-2'} rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
                title={!isExpanded ? provider.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {isExpanded && (
                  <span className={`ml-3 font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    {provider.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}