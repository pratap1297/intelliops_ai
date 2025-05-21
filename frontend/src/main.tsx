import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Import and setup Axios interceptors for global error handling
import { setupAxiosInterceptors } from './lib/axios-interceptor';

// Import the ProviderAccessProvider
import { ProviderAccessProvider } from './contexts/ProviderAccessContext';

// Initialize Axios interceptors
setupAxiosInterceptors();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProviderAccessProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </ProviderAccessProvider>
  </StrictMode>
);