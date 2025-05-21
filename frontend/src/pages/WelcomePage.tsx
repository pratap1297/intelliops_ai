import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <Header subtitle="Welcome" showActions={false} />
      
      
    </AppLayout>
  );
}
