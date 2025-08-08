'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

export function RouteGuard({ 
  children, 
  requireAuth = false,
  requireOnboarding = false 
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, userSummary } = useGlobalAuth();

  useEffect(() => {
    if (!isLoading) {
      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Check onboarding requirement
      if (requireOnboarding && isAuthenticated && userSummary) {
        if (userSummary.onboarding_stage === 'NEW' || userSummary.onboarding_stage === 'NEED_DEFAULT') {
          router.push('/onboarding');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, userSummary, requireAuth, requireOnboarding, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-muted-foreground">
            Checking authentication status
          </p>
        </div>
      </div>
    );
  }

  // Don't render if auth requirements not met
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to login
  }

  // Don't render if onboarding requirements not met  
  if (requireOnboarding && isAuthenticated && userSummary) {
    if (userSummary.onboarding_stage === 'NEW' || userSummary.onboarding_stage === 'NEED_DEFAULT') {
      return null; // Will redirect to onboarding
    }
  }

  return <>{children}</>;
}