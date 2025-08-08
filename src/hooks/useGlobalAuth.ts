'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useGlobalStore } from '@/stores/global-store';

export function useGlobalAuth() {
  const {
    isAuthenticated,
    user,
    isLoading,
    userSummary,
    setAuth,
    clearAuth,
    setLoading,
    setUserSummary,
  } = useGlobalStore();

  const checkAuthSession = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        // No token, user is not logged in
        setLoading(false);
        return;
      }

      // Verify token and get user data
      const userResponse = await apiClient.getCurrentUser();
      const user = {
        id: userResponse.user.id,
        email: userResponse.user.email
      };
      
      setAuth(user, true);
      
      // Get user summary for onboarding state
      try {
        const summaryResponse = await apiClient.getUserSummary();
        setUserSummary(summaryResponse);
      } catch (summaryError) {
        console.warn('Failed to fetch user summary:', summaryError);
        // Continue without summary - non-critical
      }
      
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be expired or invalid, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      clearAuth();
    }
  };

  useEffect(() => {
    checkAuthSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login({ email, password });
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      const user = {
        id: response.user.id,
        email: response.user.email
      };
      
      setAuth(user, true);
      
      // Get user summary after login
      try {
        const summaryResponse = await apiClient.getUserSummary();
        setUserSummary(summaryResponse);
      } catch (summaryError) {
        console.warn('Failed to fetch user summary after login:', summaryError);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      await apiClient.register({ email, password });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearAuth();
  };

  const refreshUserSummary = async () => {
    try {
      const summaryResponse = await apiClient.getUserSummary();
      setUserSummary(summaryResponse);
    } catch (error) {
      console.error('Failed to refresh user summary:', error);
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    userSummary,
    login,
    register,
    logout,
    refreshUserSummary,
  };
}