'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  onboarding_stage: string;
  default_resume_id?: number;
  has_default_resume: boolean;
  created_at: string;
  // Extended profile fields
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  bio?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken) {
      try {
        // Verify token by fetching user info
        const userInfo = await apiClient.getCurrentUser();
        
        // Merge with existing profile data if available
        const existingProfile = localStorage.getItem('resum8_user_data');
        let profileData = {};
        if (existingProfile) {
          try {
            profileData = JSON.parse(existingProfile);
          } catch {
            // Invalid profile data, ignore
          }
        }

        const userData = { ...userInfo, ...profileData };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Update stored user data
        localStorage.setItem('resum8_user_data', JSON.stringify(userData));
        localStorage.setItem('resum8_user_session', 'active');
      } catch {
        // Token is invalid, clear auth state
        logout();
      }
    }
    
    setIsLoading(false);
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.login({ email, password });
      
      // Set user data
      const userData = { 
        ...response.user,
        email: response.user.email,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage for profile extensions
      localStorage.setItem('resum8_user_session', 'active');
      localStorage.setItem('resum8_user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      await apiClient.register({ email, password });
      // Note: Registration doesn't auto-login, user needs to login after
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const updateProfile = (profileData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...profileData };
    
    localStorage.setItem('resum8_user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    apiClient.logout(); // This clears tokens in the API client
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };
}