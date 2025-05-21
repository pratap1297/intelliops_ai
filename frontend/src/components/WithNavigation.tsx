import React from 'react';
import { NavigationProvider } from '../contexts/NavigationContext';

/**
 * Higher-order component that wraps a component with NavigationProvider
 * This ensures that any component using AppLayout has access to the navigation context
 */
export const WithNavigation = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => {
    return (
      <NavigationProvider>
        <Component {...props} />
      </NavigationProvider>
    );
  };

  // Set display name for debugging purposes
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `WithNavigation(${displayName})`;

  return WrappedComponent;
};
