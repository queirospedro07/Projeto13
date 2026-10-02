import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { useAuth } from '../../../context/AuthContext';
import { DefaultAvatarPicker } from '../../../components/ui/DefaultAvatarPicker';
import { DEFAULT_AVATAR_URL } from '../../../constants/defaultAvatars';
export const Register = () => {
  const {
    register,
    user
  } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSubmit = async e => {
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
      setError('Por favor, aceite os Termos de Utilização e Política de Privacidade');
      return;
    }
    setIsLoading(true);
    try {
      const createdUser = await register({
        name,
        username,
        email,
        password,
        avatarUrl
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha ao criar conta. O utilizador ou email podem já estar em uso.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <SEO
        title="Criar Conta Gratuita — NEXO"
        description="Junte-se à NEXO. Aprenda com cursos práticos, participe em mentorias WebRTC em direto e obtenha certificados verificados."
        canonical="https://nexo.pt/register"
      />
      <div className="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 bg-slate-50 dark:bg-black transition-colors">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Criar Conta
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Junte-se a turmas colaborativas, aceda a aulas e participe em transmissões ao vivo.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] shadow-xs">
          {error && <div className="mb-6 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="font-medium text-xs sm:text-sm">{error}</span>
            </div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DefaultAvatarPicker value={avatarUrl} onChange={setAvatarUrl} label="Escolha o seu avatar" />
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" required placeholder="Ex.: João Silva" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                Nome de Utilizador
              </label>
              <input type="text" required placeholder="ex.: joaosilva" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" required placeholder="exemplo@dominio.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                  Confirmar Palavra-passe
                </label>
                <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div className="flex items-start gap-2.5 mt-1">
              <input id="accept-terms" type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-neutral-700 text-slate-900 focus:ring-slate-900 cursor-pointer bg-slate-50 dark:bg-neutral-900" />
              <label htmlFor="accept-terms" className="text-xs text-slate-600 dark:text-neutral-400 cursor-pointer select-none">
                Li e aceito os{' '}
                <Link to="/terms" target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Termos de Utilização
                </Link>{' '}
                e a{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Política de Privacidade
                </Link>{' '}
                da plataforma NEXO.
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="mt-3 w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-900 dark:border-white">
              {isLoading ? 'A criar conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-neutral-800 text-center text-xs text-slate-600 dark:text-neutral-400">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-semibold text-slate-900 dark:text-white hover:underline transition-colors">
              Iniciar sessão
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};