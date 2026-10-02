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
  return (
    <>
      <SEO
        title="Recuperar Palavra-passe — NEXO"
        description="Recupere o acesso à sua conta NEXO com o envio de um link seguro para o seu endereço de email."
        canonical="https://nexo.pt/forgot-password"
      />
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Recuperar Palavra-passe
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Introduza o seu email para enviarmos um link de recuperação.
          </p>
        </div>

        <Card className="p-8 border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          {submitted ? <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">
                Verifique o seu correio eletrónico
              </h3>
              <p className="text-sm text-slate-600 mt-2 mb-8 leading-relaxed">
                {devResetUrl ? (
                  <>O email não foi enviado neste ambiente local. Use a ligação de teste para redefinir a palavra-passe de <span className="font-bold text-slate-900">{email}</span>.</>
                ) : (
                  <>Se existir uma conta associada a <span className="font-bold text-slate-900">{email}</span>, receberá instruções para redefinir a palavra-passe.</>
                )}
              </p>
              {devResetUrl && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                  <p className="font-semibold">Ligação de teste local</p>
                  <a href={devResetUrl} className="mt-1 inline-block break-all font-medium underline underline-offset-2">
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
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="recovery-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Endereço de Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input id="recovery-email" name="email" type="email" autoComplete="email" required placeholder="o-seu-email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs" />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full font-bold shadow-md shadow-blue-500/20">
                Enviar Link de Recuperação
              </Button>

              <div className="text-center mt-3">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
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