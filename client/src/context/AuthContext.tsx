import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  demoLogin: (role: 'student' | 'creator' | 'admin') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  triggerXpCelebration: (amount: number, message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const savedToken = getAuthToken();
      if (savedToken) {
        const userData = await api.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (userData: any) => {
    const res = await api.register(userData);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const demoLogin = async (role: 'student' | 'creator' | 'admin') => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };

  const triggerXpCelebration = (amount: number, message?: string) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']
    });

    if (user) {
      setUser(prev => prev ? { ...prev, xp: prev.xp + amount } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        triggerXpCelebration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
