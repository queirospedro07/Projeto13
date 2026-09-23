import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, GraduationCap, Sparkles } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'CREATOR'>('STUDENT');
  const [acceptTerms, setAcceptTerms] = useState(true);
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
      await register({ name, username, email, password, role });
      if (role === 'CREATOR') {
        navigate('/creator/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta. O utilizador ou email podem já estar em uso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50 dark:bg-black transition-colors">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">Criar Conta</h2>
          <p className="text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Junte-se a turmas colaborativas, aceda a lições e participe em transmissões ao vivo.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e0e] shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Escolha do Perfil: Estudante ou Criador */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-2">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === 'STUDENT'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      role === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    {role === 'STUDENT' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Estudante / Aluno</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Aprender, assistir a aulas e participar nas turmas.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('CREATOR')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === 'CREATOR'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      role === 'CREATOR' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    {role === 'CREATOR' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Criador / Formador</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Criar cursos, gerir turmas e orientar alunos.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex.: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">Nome de Utilizador</label>
              <input
                type="text"
                required
                placeholder="ex.: joaosilva"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">Palavra-passe</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl pl-12 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1.5">Confirmar Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 mt-1 p-1">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 bg-slate-50 dark:bg-zinc-900"
              />
              <label htmlFor="accept-terms" className="text-sm text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
                Li e aceito os{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Termos de Serviço</span> e a{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidade</span> da plataforma LearnSpace.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'A criar conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 text-center text-sm text-slate-600 dark:text-zinc-400">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
              Iniciar sessão
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
