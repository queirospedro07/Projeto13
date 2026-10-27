import './PaginaRecuperarPalavraPasse.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuMail as Mail,
  LuCircleCheck as CheckCircle2,
  LuArrowLeft as ArrowLeft,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Botao } from '../../componentes/Botao';
import { Cartao } from '../../componentes/Cartao';
import { Logotipo } from '../../componentes/Logotipo';
import { SEO } from '../../componentes/SEO';
import { api } from '../../servicos/api';

export const PaginaRecuperarPalavraPasse = () => {
  const [email, definirEmail] = useState('');
  const [submitted, definirSubmitted] = useState(false);
  const [isCarregamento, definirIsCarregamento] = useState(false);
  const [erro, definirErro] = useState('');
  const [devReporUrl, definirDevReporUrl] = useState('');
  const tratarSubmeter = async (evento) => {
    evento.preventDefault();
    definirErro('');
    definirIsCarregamento(true);
    try {
      const response = await api
        .post('/autenticacao/recuperar-palavra-passe', {
          email,
        })
        .then(({ data: dados }) => dados);

      definirDevReporUrl(response.devResetUrl || '');
      definirSubmitted(true);
    } catch (requestErro) {
      definirErro(requestErro.message || 'Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      definirIsCarregamento(false);
    }
  };

  const seguroDevReporUrl = (() => {
    if (!devReporUrl) return '';
    try {
      const parsed = new URL(devReporUrl, window.location.origin);
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
        canonical="/recuperar-palavra-passe"
      />
      <div className="forgot-password-panel">
        <div className="forgot-password-panel-2">
          <div className="forgot-password-panel-3">
            <div className="forgot-password-panel-4">
              <Logotipo
                size="lg"
                to="/"
              />
            </div>
            <h2 className="forgot-password-heading">Recuperar Palavra-passe</h2>
            <p className="forgot-password-description">
              Introduza o seu email para enviarmos um link de recuperação.
            </p>
          </div>

          <Cartao className="forgot-password-card">
            {submitted ? (
              <div className="forgot-password-panel-5">
                <CheckCircle2 className="forgot-password-check-circle2" />
                <h3 className="forgot-password-subheading">Verifique o seu correio eletrónico</h3>
                <p className="forgot-password-description-2">
                  {seguroDevReporUrl ? (
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
                {seguroDevReporUrl && (
                  <div className="forgot-password-panel-6">
                    <p className="forgot-password-description-3">Ligação de teste local</p>
                    <a
                      href={seguroDevReporUrl}
                      className="forgot-password-link"
                    >
                      Redefinir palavra-passe
                    </a>
                  </div>
                )}
                <Link to="/entrar">
                  <Botao
                    as="span"
                    variant="secondary"
                    size="lg"
                    className="forgot-password-button"
                  >
                    Voltar ao Início de Sessão
                  </Botao>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={tratarSubmeter}
                className="forgot-password-form"
              >
                {erro && (
                  <div
                    role="alert"
                    className="forgot-password-panel-7"
                  >
                    <AlertCircle className="forgot-password-alert-circle" />
                    <span>{erro}</span>
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
                      onChange={(evento) => definirEmail(evento.target.value)}
                      className="forgot-password-field"
                    />
                  </div>
                </div>

                <Botao
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isCarregamento}
                  className="forgot-password-button-2"
                >
                  Enviar Link de Recuperação
                </Botao>

                <div className="forgot-password-panel-9">
                  <Link
                    to="/entrar"
                    className="forgot-password-link-2"
                  >
                    <ArrowLeft className="forgot-password-arrow-left" /> Voltar ao Início de Sessão
                  </Link>
                </div>
              </form>
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
};

export default PaginaRecuperarPalavraPasse;
