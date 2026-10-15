import './CookieConsent.css';
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
    functional: true,
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
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: true,
        functional: true,
        date: new Date().toISOString(),
      }),
    );
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        functional: false,
        date: new Date().toISOString(),
      }),
    );
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({ ...preferences, essential: true, date: new Date().toISOString() }),
    );
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div role="region" aria-label="Consentimento de Cookies" className="cookie-consent-panel">
      <div className="cookie-consent-panel-2">
        <div className="cookie-consent-panel-3">
          <Cookie className="cookie-consent-cookie" />
        </div>

        <div className="cookie-consent-panel-4">
          <div className="cookie-consent-panel-5">
            <h4 className="cookie-consent-caption">Privacidade & Cookies</h4>
            <button
              onClick={() => setIsVisible(false)}
              className="cookie-consent-button"
              aria-label="Fechar aviso de cookies"
            >
              <X className="cookie-consent-x" />
            </button>
          </div>

          <p className="cookie-consent-description">
            Utilizamos cookies essenciais para garantir o funcionamento seguro da plataforma,
            memorizar a sua sessão e aperfeiçoar a sua experiência de formação, em conformidade com
            o RGPD. Saiba mais na nossa{' '}
            <Link to="/privacy" className="cookie-consent-link">
              Política de Privacidade
            </Link>
            .
          </p>

          {showDetails && (
            <div className="cookie-consent-panel-6">
              <label className="cookie-consent-field-label">
                <span>Cookies Essenciais (Autenticação e Sessão)</span>
                <input type="checkbox" checked disabled className="cookie-consent-field" />
              </label>
              <label className="cookie-consent-field-label-2">
                <span>Cookies de Métricas Anónimas</span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                  className="cookie-consent-field"
                />
              </label>
            </div>
          )}

          <div className="cookie-consent-panel-7">
            {!showDetails ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="cookie-consent-button-2"
                >
                  Aceitar Todos
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRejectNonEssential}
                  className="cookie-consent-button-3"
                >
                  Apenas Essenciais
                </Button>
                <button onClick={() => setShowDetails(true)} className="cookie-consent-button-4">
                  Personalizar
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCustom}
                  className="cookie-consent-button-5"
                >
                  Guardar Preferências
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="cookie-consent-button-6"
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
