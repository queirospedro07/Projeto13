import './CookieConsent.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuCookie as Cookie, LuX as X } from 'react-icons/lu';
import { Botao } from '../Button';

export const ConsentimentoCookies = () => {
  const [isVisible, definirIsVisible] = useState(false);
  const [mostrarDetalhes, definirMostrarDetalhes] = useState(false);
  const [preferencias, definirPreferencias] = useState({
    essential: true,
    // always true
    analytics: true,
    functional: true,
  });

  useEffect(() => {
    const consentimento = localStorage.getItem('nexo_cookie_consent');
    if (!consentimento) {
      // Atrasa ligeiramente a apresentação do aviso.
      const timer = setTimeout(() => definirIsVisible(true), 1200);

      return () => clearTimeout(timer);
    }
  }, []);

  const tratarAceitarTodos = () => {
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: true,
        functional: true,
        date: new Date().toISOString(),
      }),
    );
    definirIsVisible(false);
  };

  const tratarRejeitarNaoEssential = () => {
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        functional: false,
        date: new Date().toISOString(),
      }),
    );
    definirIsVisible(false);
  };

  const tratarGuardarPersonalizado = () => {
    localStorage.setItem(
      'nexo_cookie_consent',
      JSON.stringify({
        ...preferencias,
        essential: true,
        date: new Date().toISOString(),
      }),
    );
    definirIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Consentimento de Cookies"
      className="cookie-consent-panel"
    >
      <div className="cookie-consent-panel-2">
        <div className="cookie-consent-panel-3">
          <Cookie className="cookie-consent-cookie" />
        </div>

        <div className="cookie-consent-panel-4">
          <div className="cookie-consent-panel-5">
            <h4 className="cookie-consent-caption">Privacidade & Cookies</h4>
            <button
              onClick={() => definirIsVisible(false)}
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
            <Link
              to="/privacidade"
              className="cookie-consent-link"
            >
              Política de Privacidade
            </Link>
            .
          </p>

          {mostrarDetalhes && (
            <div className="cookie-consent-panel-6">
              <label className="cookie-consent-field-label">
                <span>Cookies Essenciais (Autenticação e Sessão)</span>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="cookie-consent-field"
                />
              </label>
              <label className="cookie-consent-field-label-2">
                <span>Cookies de Métricas Anónimas</span>
                <input
                  type="checkbox"
                  checked={preferencias.analytics}
                  onChange={(evento) =>
                    definirPreferencias((p) => ({
                      ...p,
                      analytics: evento.target.checked,
                    }))
                  }
                  className="cookie-consent-field"
                />
              </label>
            </div>
          )}

          <div className="cookie-consent-panel-7">
            {!mostrarDetalhes ? (
              <>
                <Botao
                  variant="primary"
                  size="sm"
                  onClick={tratarAceitarTodos}
                  className="cookie-consent-button-2"
                >
                  Aceitar Todos
                </Botao>
                <Botao
                  variant="secondary"
                  size="sm"
                  onClick={tratarRejeitarNaoEssential}
                  className="cookie-consent-button-3"
                >
                  Apenas Essenciais
                </Botao>
                <button
                  onClick={() => definirMostrarDetalhes(true)}
                  className="cookie-consent-button-4"
                >
                  Personalizar
                </button>
              </>
            ) : (
              <>
                <Botao
                  variant="primary"
                  size="sm"
                  onClick={tratarGuardarPersonalizado}
                  className="cookie-consent-button-5"
                >
                  Guardar Preferências
                </Botao>
                <Botao
                  variant="secondary"
                  size="sm"
                  onClick={() => definirMostrarDetalhes(false)}
                  className="cookie-consent-button-6"
                >
                  Voltar
                </Botao>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentimentoCookies;
