/**
 * Authentication hook
 * Manages user session state
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    const userStr = localStorage.getItem('user');

    if (jwt && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth?token=expired');
  };

  return {
    user,
    isAuthenticated,
    logout,
  };
}
