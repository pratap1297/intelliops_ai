import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProviderAccess } from '../contexts/ProviderAccessContext';

interface ProviderAccessGuardProps {
  children: React.ReactNode;
}

export function ProviderAccessGuard({ children }: ProviderAccessGuardProps) {
  const { hasProviderAccess, isCheckingAccess, checkProviderAccess } = useProviderAccess();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // These paths are always accessible regardless of provider access
  const allowedPaths = ['/welcome', '/profile', '/login', '/register', '/forgot-password', '/reset-password'];
  const isAllowedPath = allowedPaths.includes(location.pathname);

  // Check provider access on mount and when location changes
  useEffect(() => {
    // If it's an allowed path, we can render immediately
    if (isAllowedPath) {
      setIsReady(true);
      return;
    }

    // If we're already done checking, we can determine what to render
    if (!isCheckingAccess) {
      setIsReady(true);
      return;
    }

    // Otherwise, we need to check provider access
    const checkAccess = async () => {
      await checkProviderAccess();
      setIsReady(true);
    };

    checkAccess();
  }, [isAllowedPath, isCheckingAccess, checkProviderAccess, location.pathname]);

  // Don't render anything until we're ready
  // This prevents any flashing of protected content
  if (!isReady) {
    return null;
  }

  // If no provider access and not on an allowed path, redirect to welcome page
  if (!hasProviderAccess && !isAllowedPath) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // If has provider access or on an allowed path, render children
  return <>{children}</>;
}