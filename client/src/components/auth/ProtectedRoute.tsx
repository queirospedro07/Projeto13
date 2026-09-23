import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'STUDENT' | 'CREATOR' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-['60vh'] flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          A verificar credenciais de segurança...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'CREATOR' && user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
