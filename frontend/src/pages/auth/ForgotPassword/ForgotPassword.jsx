import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { api } from '../../../services/api';
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.forgotPassword(email);
      setDevResetUrl(response.devResetUrl || '');
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  const safeDevResetUrl = (() => {
    if (!devResetUrl) return '';
    try {
      const parsed = new URL(devResetUrl, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
      return '';
    } catch {
      return '';
    }
  })();

  return (
    <>
      <SEO
        title="Recuperar Palavra-passe — NEXO"
        description="Recupere o acesso à sua conta NEXO com o envio de um link seguro para o seu endereço de email."
        canonical="https://nexo.pt/forgot-password"
      />
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50 dark:bg-black transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Recuperar Palavra-passe
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Introduza o seu email para enviarmos um link de recuperação.
          </p>
        </div>

        <Card className="p-8 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] shadow-xl shadow-slate-200/50 dark:shadow-none">
          {submitted ? <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Verifique o seu correio eletrónico
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 mb-8 leading-relaxed">
                {safeDevResetUrl ? (
                  <>O email não foi enviado neste ambiente local. Use a ligação de teste para redefinir a palavra-passe de <span className="font-bold text-slate-900 dark:text-white">{email}</span>.</>
                ) : (
                  <>Se existir uma conta associada a <span className="font-bold text-slate-900 dark:text-white">{email}</span>, receberá instruções para redefinir a palavra-passe.</>
                )}
              </p>
              {safeDevResetUrl && (
                <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-left text-sm text-amber-900 dark:text-amber-300">
                  <p className="font-semibold">Ligação de teste local</p>
                  <a href={safeDevResetUrl} className="mt-1 inline-block break-all font-medium underline underline-offset-2">
                    Redefinir palavra-passe
                  </a>
                </div>
              )}
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full font-bold">
                  Voltar ao Início de Sessão
                </Button>
              </Link>
            </div> : <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="recovery-email" className="block text-xs font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wider mb-2">
                  Endereço de Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input id="recovery-email" name="email" type="email" autoComplete="email" required placeholder="o-seu-email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-900 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none transition-all shadow-xs" />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full font-bold shadow-md shadow-blue-500/20">
                Enviar Link de Recuperação
              </Button>

              <div className="text-center mt-3">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Voltar ao Início de Sessão
                </Link>
              </div>
            </form>}
          </Card>
        </div>
      </div>
    </>
  );
};