'use client';

import { useState, useEffect, useCallback } from 'react';
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
  // Auth disabled for testing - always authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>({
    id: 1,
    email: "test@example.com",
    onboarding_stage: "completed",
    has_default_resume: true,
    created_at: new Date().toISOString(),
    name: "Test User"
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    apiClient.logout(); // This clears tokens in the API client
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const checkAuthSession = useCallback(async () => {
    // Auth disabled for testing - skip session check
    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  const login = async (email: string, password: string): Promise<void> => {
    // Auth disabled for testing - always succeed
    console.log('Login bypassed for testing');
  };

  const register = async (email: string, password: string): Promise<void> => {
    // Auth disabled for testing - always succeed
    console.log('Registration bypassed for testing');
  };

  const updateProfile = (profileData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...profileData };
    
    localStorage.setItem('resum8_user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
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