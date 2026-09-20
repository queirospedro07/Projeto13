import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    if (!acceptTerms) {
      setError('Por favor, aceite os Termos de Serviço e Política de Privacidade');
      return;
    }

    setIsLoading(true);
    try {
      await register({ name, username, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta. O utilizador ou email podem já estar em uso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Criar Conta</h2>
          <p className="text-base text-slate-600 mt-2 max-w-sm mx-auto">
            Junte-se a turmas colaborativas, aceda a lições e participe em transmissões ao vivo.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Pedro Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Nome de Utilizador</label>
              <input
                type="text"
                required
                placeholder="pedro"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="pedro@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Palavra-passe</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Confirmar Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'A criar conta...' : 'Criar Conta Gratuita'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline transition-colors">
              Iniciar sessão
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
