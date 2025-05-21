import React, { useState } from 'react';
import { Layout, Cloud, Server, Database, Network, Settings, Box } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { INFRASTRUCTURE_URLS, FEATURES } from '../config';

interface InfraTab {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
}

export function InfrastructurePage() {
  const [activeTabId, setActiveTabId] = useState('overview');

  // Only show external tabs if the feature is enabled
  const showExternalTabs = FEATURES.enableExternalServices;

  const infraTabs: InfraTab[] = [
    ...(showExternalTabs ? [
      {
        id: 'overview',
        name: 'Overview',
        icon: Layout,
        url: INFRASTRUCTURE_URLS.overview
      },
      {
        id: 'compute',
        name: 'Compute',
        icon: Server,
        url: INFRASTRUCTURE_URLS.compute
      },
      {
        id: 'storage',
        name: 'Storage',
        icon: Database,
        url: INFRASTRUCTURE_URLS.storage
      },
      {
        id: 'network',
        name: 'Network',
        icon: Network,
        url: INFRASTRUCTURE_URLS.network
      },
      {
        id: 'containers',
        name: 'Containers',
        icon: Box,
        url: INFRASTRUCTURE_URLS.containers
      },
    ] : []),
    // Local routes are always available
    {
      id: 'upload',
      name: 'Upload',
      icon: Cloud,
      url: '/infrastructure/upload'
    },
    ...(showExternalTabs ? [
      {
        id: 'config',
        name: 'Configuration',
        icon: Settings,
        url: INFRASTRUCTURE_URLS.config
      }
    ] : [])
  ];

  const activeTab = infraTabs.find(tab => tab.id === activeTabId) || infraTabs[0];

  return (
    <AppLayout>
      <div className="flex-1 flex">
        {/* Infrastructure Navigation */}
        <div className="w-48 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Infrastructure</h2>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {infraTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTabId === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header removed */}
          
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full flex flex-col">
              {/* URL Display row removed */}

              {/* External Content */}
              <div className="flex-1 h-full">
                {activeTab.id === 'upload' ? (
                  // For internal routes, don't use iframe
                  <div className="p-8">
                    <h3 className="text-xl font-semibold mb-4">Infrastructure Upload</h3>
                    <p className="mb-4">Upload your infrastructure templates here.</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Drag and drop files here or click to browse</p>
                      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Upload Template
                      </button>
                    </div>
                  </div>
                ) : (
                  // For external URLs, use iframe
                  <div className="w-full h-full relative">
                    <iframe
                      src={activeTab.url}
                      className="w-full h-full absolute inset-0 border-0"
                      title={`Infrastructure ${activeTab.name}`}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
