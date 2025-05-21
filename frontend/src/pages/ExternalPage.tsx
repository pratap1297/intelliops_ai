import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { NavigationProvider } from '../contexts/NavigationContext';
import { STACK_BASE_URL, FINOPS_BASE_URL } from '../config';

interface ExternalPageProps {
  url?: string;
}

export function ExternalPage({ url = 'https://example.com' }: ExternalPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Determine page subtitle based on URL - keeping this for the iframe title
  const getSubtitle = () => {
    if (url.includes(FINOPS_BASE_URL)) {
      return 'FinOps';
    } else if (url.includes(STACK_BASE_URL)) {
      return 'Infrastructure Management';
    }
    return 'External Service';
  };

  // Function to reload the iframe content
  const reloadIframe = () => {
    setIsLoading(true);
    // Simulate iframe reload
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <NavigationProvider>
      <AppLayout>
        <div className="flex flex-col h-full w-full">
          {/* Header removed - no more subtitle or refresh button */}
          
          <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
            {/* External Content */}
            <div className="flex-1 w-full h-full relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <iframe
                src={url}
                className="w-full h-full absolute inset-0 border-0"
                title={getSubtitle()}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      </AppLayout>
    </NavigationProvider>
  );
}
