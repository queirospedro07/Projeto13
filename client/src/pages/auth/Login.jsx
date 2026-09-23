import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';
export const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
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
  return <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50 dark:bg-black transition-colors">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Iniciar Sessão
          </h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Aceda aos seus cursos, canais da comunidade e salas de transmissão ao vivo.
          </p>
        </div>

        
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e0e] shadow-xl">
          {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium">{error}</span>
            </div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-2">
                E-mail ou Nome de Utilizador
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" required placeholder="exemplo@dominio.com ou utilizador" value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200">
                  Palavra-passe
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                  Esqueceu-se da palavra-passe?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" />
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-5 h-5 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer bg-slate-50 dark:bg-zinc-900" />
              <label htmlFor="remember" className="ml-2.5 text-sm font-medium text-slate-600 dark:text-zinc-400 select-none cursor-pointer">
                Lembrar a sessão neste navegador
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50">
              {isLoading ? 'A entrar...' : 'Entrar na Plataforma'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 text-center text-sm text-slate-600 dark:text-zinc-400">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>;
};