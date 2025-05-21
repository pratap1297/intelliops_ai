import React from 'react';
import { CloudProvider } from '../types';
import { Cloud, Aperture as Azure, Server, Database } from 'lucide-react';

interface CloudTabsProps {
  activeProvider: CloudProvider;
  onProviderChange: (provider: CloudProvider) => void;
}

interface TabConfig {
  id: CloudProvider;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'aws', label: 'AWS', icon: Cloud },
  { id: 'azure', label: 'Azure', icon: Azure },
  { id: 'gcp', label: 'GCP', icon: Database },
  { id: 'onprem', label: 'On-Prem', icon: Server }
];

export function CloudTabs({ activeProvider, onProviderChange }: CloudTabsProps) {
  return (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeProvider === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onProviderChange(tab.id)}
            className={`
              flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}