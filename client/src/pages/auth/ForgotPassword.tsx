import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Logo } from '../../components/ui/Logo';
import { api } from '../../services/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" to="/" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recuperar Palavra-passe</h2>
          <p className="text-sm text-slate-500 mt-1">Introduza o seu email para enviarmos um link de recuperação.</p>
        </div>

        <Card className="p-8 border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Verifique o seu correio eletrónico</h3>
              <p className="text-sm text-slate-600 mt-2 mb-8 leading-relaxed">
                Se existir uma conta associada a <span className="font-bold text-slate-900">{email}</span>, enviámos instruções para redefinir a palavra-passe.
              </p>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full font-bold">
                  Voltar ao Início de Sessão
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Endereço de Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="o-seu-email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs"
                  />
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
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
