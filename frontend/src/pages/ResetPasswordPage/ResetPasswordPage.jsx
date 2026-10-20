import './ResetPasswordPage.css';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuCircleAlert as AlertCircle,
  LuCircleCheck as CheckCircle2,
  LuLock as Lock,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');

      return;
    }

    setIsLoading(true);
    try {
      await api
        .post('/auth/reset-password', {
          token,
          password,
        })
        .then(({ data }) => data);
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
      <div className="reset-password-panel">
        <div className="reset-password-panel-2">
          <div className="reset-password-panel-3">
            <div className="reset-password-panel-4">
              <Logo
                size="lg"
                to="/"
              />
            </div>
            <h1 className="reset-password-title">Criar nova palavra-passe</h1>
            <p className="reset-password-description">
              Escolha uma palavra-passe segura para voltar à sua conta.
            </p>
          </div>

          <Card className="reset-password-card">
            {submitted ? (
              <div className="reset-password-panel-5">
                <CheckCircle2 className="reset-password-check-circle2" />
                <h2 className="reset-password-heading">Palavra-passe atualizada</h2>
                <p className="reset-password-description-2">
                  Já pode iniciar sessão com a nova palavra-passe.
                </p>
                <Link to="/login">
                  <Button
                    as="span"
                    variant="primary"
                    size="lg"
                    className="reset-password-button"
                  >
                    Ir para início de sessão
                  </Button>
                </Link>
              </div>
            ) : !token ? (
              <div className="reset-password-panel-5">
                <AlertCircle className="reset-password-alert-circle" />
                <h2 className="reset-password-heading">Ligação incompleta</h2>
                <p className="reset-password-description-2">
                  Peça uma nova ligação de recuperação para continuar.
                </p>
                <Link to="/forgot-password">
                  <Button
                    as="span"
                    variant="primary"
                    size="lg"
                    className="reset-password-button"
                  >
                    Pedir nova ligação
                  </Button>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="reset-password-form"
              >
                {error && (
                  <div
                    role="alert"
                    className="reset-password-panel-6"
                  >
                    <AlertCircle className="reset-password-alert-circle-2" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="new-password"
                    className="reset-password-field-label"
                  >
                    Nova palavra-passe
                  </label>
                  <div className="reset-password-panel-7">
                    <Lock className="reset-password-lock" />
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="reset-password-field"
                    />
                  </div>
                  <p className="reset-password-description-3">Pelo menos 12 caracteres.</p>
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="reset-password-field-label"
                  >
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
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="reset-password-field-2"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="reset-password-button-2"
                >
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

export default ResetPasswordPage;
