'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api';
import { UserSummaryResponse, UserResponse } from '@/lib/types';

interface GlobalState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  userSummary: UserSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchUserSummary: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  userSummary: null,
  isLoading: true,
  error: null,

  fetchUserSummary: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const userSummary = await apiClient.getUserSummary();
      // The new API combines user info with summary
      set({ 
        isAuthenticated: true, 
        user: null, // User data is now part of userSummary
        userSummary, 
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        user: null, 
        userSummary: null, 
        isLoading: false, 
        error: 'Session expired. Please log in again.' 
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  login: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ isAuthenticated: true });
    get().fetchUserSummary();
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false, user: null, userSummary: null });
  },
}));
