'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalStore } from '@/stores/global-store';

const PROTECTED_ROUTES = ['/resumes', '/compare', '/dashboard', '/analyze', '/optimize'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/register'];
const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';

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
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirect unauthenticated users trying to access protected routes
    if (!isAuthenticated && isProtectedRoute) {
      router.push(LOGIN_ROUTE);
      return;
    }

    // Redirect authenticated users from public routes to dashboard
    if (isAuthenticated && isPublicRoute && pathname !== '/') {
      router.push(DASHBOARD_ROUTE);
      return;
    }

    // Redirect authenticated users from home to dashboard
    if (isAuthenticated && pathname === '/') {
      router.push(DASHBOARD_ROUTE);
      return;
    }

  }, [isLoading, isAuthenticated, userSummary, pathname, router]);

  return <>{children}</>;
}
