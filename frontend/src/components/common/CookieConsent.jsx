import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie, Check, X, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // always true
    analytics: true,
    functional: true
  });

  useEffect(() => {
    const consent = localStorage.getItem('nexo_cookie_consent');
    if (!consent) {
      // Delay showing banner slightly for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('nexo_cookie_consent', JSON.stringify({ essential: true, analytics: true, functional: true, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('nexo_cookie_consent', JSON.stringify({ essential: true, analytics: false, functional: false, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem('nexo_cookie_consent', JSON.stringify({ ...preferences, essential: true, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Consentimento de Cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-[9990] bg-white/95 dark:bg-[#0c0d10]/95 backdrop-blur-md border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 text-slate-900 dark:text-white animate-fade-in transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Privacidade & Cookies
            </h4>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md"
              aria-label="Fechar aviso de cookies"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            Utilizamos cookies essenciais para garantir o funcionamento seguro da plataforma, memorizar a sua sessão e aperfeiçoar a sua experiência de formação, em conformidade com o RGPD. Saiba mais na nossa{' '}
            <Link to="/privacy" className="text-blue-600 dark:text-blue-400 underline font-semibold">
              Política de Privacidade
            </Link>.
          </p>

          {showDetails && (
            <div className="pt-2 pb-1 space-y-2 border-t border-slate-100 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-300 animate-fade-in">
              <label className="flex items-center justify-between cursor-not-allowed opacity-75">
                <span>Cookies Essenciais (Autenticação e Sessão)</span>
                <input type="checkbox" checked disabled className="rounded text-blue-600 accent-blue-600" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Cookies de Métricas Anónimas</span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                  className="rounded text-blue-600 accent-blue-600"
                />
              </label>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-2">
            {!showDetails ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-100 text-xs font-bold py-1.5 px-3"
                >
                  Aceitar Todos
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRejectNonEssential}
                  className="text-xs font-semibold py-1.5 px-3"
                >
                  Apenas Essenciais
                </Button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white underline ml-auto cursor-pointer"
                >
                  Personalizar
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCustom}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3"
                >
                  Guardar Preferências
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="text-xs py-1.5 px-3"
                >
                  Voltar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
