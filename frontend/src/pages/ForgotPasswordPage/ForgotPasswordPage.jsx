import './ForgotPasswordPage.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuMail as Mail,
  LuCircleCheck as CheckCircle2,
  LuArrowLeft as ArrowLeft,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api
        .post('/auth/forgot-password', {
          email,
        })
        .then(({ data }) => data);

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
      <div className="forgot-password-panel">
        <div className="forgot-password-panel-2">
          <div className="forgot-password-panel-3">
            <div className="forgot-password-panel-4">
              <Logo
                size="lg"
                to="/"
              />
            </div>
            <h2 className="forgot-password-heading">Recuperar Palavra-passe</h2>
            <p className="forgot-password-description">
              Introduza o seu email para enviarmos um link de recuperação.
            </p>
          </div>

          <Card className="forgot-password-card">
            {submitted ? (
              <div className="forgot-password-panel-5">
                <CheckCircle2 className="forgot-password-check-circle2" />
                <h3 className="forgot-password-subheading">Verifique o seu correio eletrónico</h3>
                <p className="forgot-password-description-2">
                  {safeDevResetUrl ? (
                    <>
                      O email não foi enviado neste ambiente local. Use a ligação de teste para
                      redefinir a palavra-passe de{' '}
                      <span className="forgot-password-label">{email}</span>.
                    </>
                  ) : (
                    <>
                      Se existir uma conta associada a{' '}
                      <span className="forgot-password-label">{email}</span>, receberá instruções
                      para redefinir a palavra-passe.
                    </>
                  )}
                </p>
                {safeDevResetUrl && (
                  <div className="forgot-password-panel-6">
                    <p className="forgot-password-description-3">Ligação de teste local</p>
                    <a
                      href={safeDevResetUrl}
                      className="forgot-password-link"
                    >
                      Redefinir palavra-passe
                    </a>
                  </div>
                )}
                <Link to="/login">
                  <Button
                    as="span"
                    variant="secondary"
                    size="lg"
                    className="forgot-password-button"
                  >
                    Voltar ao Início de Sessão
                  </Button>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="forgot-password-form"
              >
                {error && (
                  <div
                    role="alert"
                    className="forgot-password-panel-7"
                  >
                    <AlertCircle className="forgot-password-alert-circle" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="forgot-password-field-label"
                  >
                    Endereço de Email
                  </label>
                  <div className="forgot-password-panel-8">
                    <Mail className="forgot-password-mail" />
                    <input
                      id="recovery-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="o-seu-email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="forgot-password-field"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="forgot-password-button-2"
                >
                  Enviar Link de Recuperação
                </Button>

                <div className="forgot-password-panel-9">
                  <Link
                    to="/login"
                    className="forgot-password-link-2"
                  >
                    <ArrowLeft className="forgot-password-arrow-left" /> Voltar ao Início de Sessão
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
