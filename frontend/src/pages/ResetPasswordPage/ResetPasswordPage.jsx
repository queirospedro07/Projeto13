import './ResetPasswordPage.css';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuCircleAlert as AlertCircle,
  LuCircleCheck as CheckCircle2,
  LuLock as Lock,
} from 'react-icons/lu';
import { Botao } from '../../components/Button';
import { Cartao } from '../../components/Card';
import { Logotipo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

export const PaginaReporPalavraPasse = () => {
  const [pesquisarParametros] = useSearchParams();
  const token = pesquisarParametros.get('token') || '';
  const [palavraPasse, definirPalavraPasse] = useState('');
  const [confirmarPalavraPasse, definirConfirmarPalavraPasse] = useState('');
  const [erro, definirErro] = useState('');
  const [isCarregamento, definirIsCarregamento] = useState(false);
  const [submitted, definirSubmitted] = useState(false);
  const tratarSubmeter = async (evento) => {
    evento.preventDefault();
    definirErro('');
    if (palavraPasse !== confirmarPalavraPasse) {
      definirErro('As palavras-passe não coincidem.');

      return;
    }

    definirIsCarregamento(true);
    try {
      await api
        .post('/autenticacao/repor-palavra-passe', {
          token,
          password: palavraPasse,
        })
        .then(({ data: dados }) => dados);
      definirSubmitted(true);
    } catch (requestErro) {
      definirErro(requestErro.message || 'Não foi possível redefinir a palavra-passe.');
    } finally {
      definirIsCarregamento(false);
    }
  };

  return (
    <>
      <SEO
        title="Nova Palavra-passe — NEXO"
        description="Defina uma nova palavra-passe para a sua conta NEXO."
        canonical="/repor-palavra-passe"
      />
      <div className="reset-password-panel">
        <div className="reset-password-panel-2">
          <div className="reset-password-panel-3">
            <div className="reset-password-panel-4">
              <Logotipo
                size="lg"
                to="/"
              />
            </div>
            <h1 className="reset-password-title">Criar nova palavra-passe</h1>
            <p className="reset-password-description">
              Escolha uma palavra-passe segura para voltar à sua conta.
            </p>
          </div>

          <Cartao className="reset-password-card">
            {submitted ? (
              <div className="reset-password-panel-5">
                <CheckCircle2 className="reset-password-check-circle2" />
                <h2 className="reset-password-heading">Palavra-passe atualizada</h2>
                <p className="reset-password-description-2">
                  Já pode iniciar sessão com a nova palavra-passe.
                </p>
                <Link to="/entrar">
                  <Botao
                    as="span"
                    variant="primary"
                    size="lg"
                    className="reset-password-button"
                  >
                    Ir para início de sessão
                  </Botao>
                </Link>
              </div>
            ) : !token ? (
              <div className="reset-password-panel-5">
                <AlertCircle className="reset-password-alert-circle" />
                <h2 className="reset-password-heading">Ligação incompleta</h2>
                <p className="reset-password-description-2">
                  Peça uma nova ligação de recuperação para continuar.
                </p>
                <Link to="/recuperar-palavra-passe">
                  <Botao
                    as="span"
                    variant="primary"
                    size="lg"
                    className="reset-password-button"
                  >
                    Pedir nova ligação
                  </Botao>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={tratarSubmeter}
                className="reset-password-form"
              >
                {erro && (
                  <div
                    role="alert"
                    className="reset-password-panel-6"
                  >
                    <AlertCircle className="reset-password-alert-circle-2" />
                    <span>{erro}</span>
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
                      value={palavraPasse}
                      onChange={(evento) => definirPalavraPasse(evento.target.value)}
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
                    value={confirmarPalavraPasse}
                    onChange={(evento) => definirConfirmarPalavraPasse(evento.target.value)}
                    className="reset-password-field-2"
                  />
                </div>
                <Botao
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isCarregamento}
                  className="reset-password-button-2"
                >
                  Guardar nova palavra-passe
                </Botao>
              </form>
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
};

export default PaginaReporPalavraPasse;
