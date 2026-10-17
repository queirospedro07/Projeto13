import './ProtectedRoute.css';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Button';
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="protected-route-panel">
        <div className="protected-route-panel-2"></div>
        <p className="protected-route-description">A verificar credenciais de segurança...</p>
      </div>
    );
  }
  if (sessionError) {
    return (
      <div className="protected-route-panel" role="alert">
        <p>{sessionError}</p>
        <Button onClick={retrySession}>Tentar novamente</Button>
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
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
