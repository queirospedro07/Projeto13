import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export const ProtectedRoute = ({
  children,
  requiredRole
}) => {
  const {
    user,
    isLoading
  } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-black text-slate-600 dark:text-slate-300 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          A verificar credenciais de segurança...
        </p>
      </div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }
  if (requiredRole) {
    const isAuthorized = user.role === requiredRole || user.role === 'ADMIN';
    if (!isAuthorized) {
      if (requiredRole === 'CREATOR') {
        return <Navigate to="/creator/apply" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};