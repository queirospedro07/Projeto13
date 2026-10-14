import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const fetchCurrentUser = async () => {
    try {
      const savedToken = getAuthToken();
      if (savedToken) {
        const userData = await api.getMe();
        setUser(userData.user || userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Falha ao carregar a sessão do utilizador:', err);
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
  const login = async credentials => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };
  const register = async userData => {
    const res = await api.register(userData);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };
  const demoLogin = async role => {
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
        setUser(userData?.user || userData);
      } catch (err) {
        console.error('Erro ao atualizar os dados do utilizador:', err);
      }
    }
  };
  return <AuthContext.Provider value={{
    user,
    token,
    isLoading,
    login,
    register,
    demoLogin,
    logout,
    refreshUser
  }}>
      {children}
    </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};