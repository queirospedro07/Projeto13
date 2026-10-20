import { useContext, useState, useEffect, useRef } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

import { AuthContext } from './contexts';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const sessionRequest = useRef(0);
  const fetchCurrentUser = async () => {
    const requestId = ++sessionRequest.current;

    setIsLoading(true);
    setSessionError('');
    try {
      const savedToken = getAuthToken();
      if (savedToken) {
        const userData = await api.get('/auth/me').then(({ data }) => data);
        if (requestId === sessionRequest.current) setUser(userData.user || userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (requestId !== sessionRequest.current) return;
      if (err.status === 401) {
        removeAuthToken();
        setToken(null);
        setUser(null);
      } else {
        setSessionError(
          'Não foi possível verificar a sua sessão. Verifique a ligação e tente novamente.',
        );
      }
    } finally {
      if (requestId === sessionRequest.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials, remember = false) => {
    const res = await api.post('/auth/login', credentials).then(({ data }) => data);

    sessionRequest.current++;
    setSessionError('');
    setIsLoading(false);
    setAuthToken(res.token, remember);
    setToken(res.token);
    setUser(res.user);

    return res.user;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData).then(({ data }) => data);

    sessionRequest.current++;
    setSessionError('');
    setIsLoading(false);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);

    return res.user;
  };

  const demoLogin = async (role) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/auth/demo/${role}`).then(({ data }) => data);

      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionRequest.current++;
    setSessionError('');
    setIsLoading(false);
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await api.get('/auth/me').then(({ data }) => data);

        setUser(userData?.user || userData);
      } catch (err) {
        console.error('Erro ao atualizar os dados do utilizador:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sessionError,
        retrySession: fetchCurrentUser,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
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
