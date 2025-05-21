import React from 'react';
import { NavigationManager } from '../components/NavigationManager';
import { AppLayout } from '../components/AppLayout';

const NavigationManagerPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto">
        <NavigationManager />
      </div>
    </AppLayout>
  );
};

export default NavigationManagerPage;
