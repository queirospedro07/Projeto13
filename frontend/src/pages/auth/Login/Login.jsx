import './Login.css';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { useAuth } from '../../../context/AuthContext';
export const Login = () => {
  const { login, user } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleRedirect = (role) => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'CREATOR') return '/creator';
    return '/dashboard';
  };

  if (user) {
    const target = location.state?.from?.pathname || getRoleRedirect(user.role);
    return <Navigate to={target} replace />;
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedUser = await login(
        {
          login: loginInput,
          password,
        },
        rememberMe,
      );
      const target = location.state?.from?.pathname || getRoleRedirect(loggedUser?.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Nome de utilizador ou palavra-passe incorretos');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <SEO
        title="Iniciar Sessão — NEXO"
        description="Aceda à sua conta NEXO para continuar os seus cursos, sessões em direto e comunidade de aprendizagem."
        canonical="https://nexo.pt/login"
      />
      <div className="login-panel">
        <div className="login-panel-2">
          <div className="login-panel-3">
            <div className="login-panel-4">
              <Logo size="lg" to="/" />
            </div>
            <h2 className="login-heading">Iniciar Sessão</h2>
            <p className="login-description">
              Aceda aos seus cursos, canais da comunidade e salas de transmissão ao vivo.
            </p>
          </div>

          <div className="login-panel-5">
            {error && (
              <div className="login-panel-6">
                <AlertCircle className="login-alert-circle" />
                <span className="login-label">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div>
                <label className="login-field-label">E-mail ou Nome de Utilizador</label>
                <div className="login-panel-7">
                  <Mail className="login-mail" />
                  <input
                    type="text"
                    required
                    placeholder="exemplo@dominio.com ou utilizador"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="login-field"
                  />
                </div>
              </div>

              <div>
                <div className="login-panel-8">
                  <label className="login-field-label-2">Palavra-passe</label>
                  <Link to="/forgot-password" className="login-link">
                    Esqueceu-se da palavra-passe?
                  </Link>
                </div>
                <div className="login-panel-7">
                  <Lock className="login-mail" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-field"
                  />
                </div>
              </div>

              <div className="login-panel-9">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-field-2"
                />
                <label htmlFor="remember" className="login-field-label-3">
                  Lembrar a sessão neste navegador
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="login-button">
                {isLoading ? 'A entrar...' : 'Entrar na Plataforma'}
              </button>
            </form>

            <div className="login-panel-10">
              Ainda não tem conta?{' '}
              <Link to="/register" className="login-link-2">
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
