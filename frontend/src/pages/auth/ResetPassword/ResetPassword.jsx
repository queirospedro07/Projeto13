import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Logo } from '../../../components/ui/Logo';
import { SEO } from '../../../components/common/SEO';
import { api } from '../../../services/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token, password);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível redefinir a palavra-passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Nova Palavra-passe — NEXO"
        description="Defina uma nova palavra-passe para a sua conta NEXO."
        canonical="https://nexo.pt/reset-password"
      />
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="lg" to="/" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Criar nova palavra-passe
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              Escolha uma palavra-passe segura para voltar à sua conta.
            </p>
          </div>

          <Card className="border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-neutral-800 dark:bg-[#0c0d12] sm:p-8">
            {submitted ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Palavra-passe atualizada</h2>
                <p className="mt-2 mb-6 text-sm text-slate-600 dark:text-neutral-400">
                  Já pode iniciar sessão com a nova palavra-passe.
                </p>
                <Link to="/login">
                  <Button variant="primary" size="lg" className="w-full">Ir para início de sessão</Button>
                </Link>
              </div>
            ) : !token ? (
              <div className="py-4 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ligação incompleta</h2>
                <p className="mt-2 mb-6 text-sm text-slate-600 dark:text-neutral-400">
                  Peça uma nova ligação de recuperação para continuar.
                </p>
                <Link to="/forgot-password">
                  <Button variant="primary" size="lg" className="w-full">Pedir nova ligação</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                    Nova palavra-passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Pelo menos 8 caracteres.</p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                    Confirmar palavra-passe
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full">
                  Guardar nova palavra-passe
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};