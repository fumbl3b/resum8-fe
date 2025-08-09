'use client';

import { useState, useEffect } from 'react';

interface User {
  email: string;
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
    // Check for existing session on mount
    checkAuthSession();
  }, []);

  const checkAuthSession = () => {
    const session = localStorage.getItem('resum8_user_session');
    const userData = localStorage.getItem('resum8_user_data');
    
    if (session === 'active' && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid user data, clear session
        logout();
      }
    }
    
    setIsLoading(false);
  };

  const login = (email: string, name?: string) => {
    const userData = { email, name };
    
    localStorage.setItem('resum8_user_session', 'active');
    localStorage.setItem('resum8_user_data', JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  const updateProfile = (profileData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...profileData };
    
    localStorage.setItem('resum8_user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('resum8_user_session');
    localStorage.removeItem('resum8_user_data');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    updateProfile,
  };
}