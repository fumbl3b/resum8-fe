'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalStore } from '@/stores/global-store';

const PROTECTED_ROUTES = ['/resumes', '/compare'];
const ONBOARDING_ROUTE = '/onboarding';
const LOGIN_ROUTE = '/login';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userSummary, fetchUserSummary, isLoading, isAuthenticated } = useGlobalStore();

  useEffect(() => {
    fetchUserSummary();
  }, [fetchUserSummary]);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (!isAuthenticated && isProtectedRoute) {
      router.push(LOGIN_ROUTE);
      return;
    }

    if (isAuthenticated && !userSummary?.has_default_resume && pathname !== ONBOARDING_ROUTE) {
      router.push(ONBOARDING_ROUTE);
      return;
    }

  }, [isLoading, isAuthenticated, userSummary, pathname, router]);

  return <>{children}</>;
}
