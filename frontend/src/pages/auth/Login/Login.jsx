import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { useAuth } from '../../../context/AuthContext';
export const Login = () => {
  const {
    login,
    user
  } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedUser = await login({
        login: loginInput,
        password
      });
      navigate('/dashboard');
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
        description="Aceda à sua conta NEXO para continuar os seus cursos, mentorias WebRTC e comunidade de aprendizagem."
        canonical="https://nexo.pt/login"
      />
      <div className="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 bg-slate-50 dark:bg-black transition-colors">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Iniciar Sessão
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Aceda aos seus cursos, canais da comunidade e salas de transmissão ao vivo.
          </p>
        </div>

        
        <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] shadow-xs">
          {error && <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium text-xs sm:text-sm">{error}</span>
            </div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                E-mail ou Nome de Utilizador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" required placeholder="exemplo@dominio.com ou utilizador" value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200">
                  Palavra-passe
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                  Esqueceu-se da palavra-passe?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-slate-900 focus:ring-slate-900 cursor-pointer bg-slate-50 dark:bg-neutral-900" />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-600 dark:text-neutral-400 select-none cursor-pointer">
                Lembrar a sessão neste navegador
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-900 dark:border-white">
              {isLoading ? 'A entrar...' : 'Entrar na Plataforma'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-neutral-800 text-center text-xs text-slate-600 dark:text-neutral-400">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-semibold text-slate-900 dark:text-white hover:underline transition-colors">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};