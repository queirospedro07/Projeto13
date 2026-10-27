import './PaginaIniciarSessao.css';
import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LuLock as Lock, LuMail as Mail, LuCircleAlert as AlertCircle } from 'react-icons/lu';
import { Logotipo } from '../../componentes/Logotipo';
import { SEO } from '../../componentes/SEO';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';

export const PaginaIniciarSessao = () => {
  const { iniciarSessao: iniciarSessao, user: utilizador } = useAutenticacao();
  const [iniciarSessaoEntrada, definirIniciarSessaoEntrada] = useState('');
  const [palavraPasse, definirPalavraPasse] = useState('');
  const [rememberMe, definirRememberMe] = useState(false);
  const [erro, definirErro] = useState('');
  const [isCarregamento, definirIsCarregamento] = useState(false);
  const navigate = useNavigate();
  const localizacao = useLocation();
  const obterCargoRedirecionamento = (cargo) => {
    if (cargo === 'ADMIN') return '/administracao';
    if (cargo === 'CREATOR') return '/formador';

    return '/painel';
  };

  if (utilizador) {
    const destino =
      localizacao.state?.from?.pathname || obterCargoRedirecionamento(utilizador.role);

    return (
      <Navigate
        to={destino}
        replace
      />
    );
  }

  const tratarSubmeter = async (evento) => {
    evento.preventDefault();
    definirErro('');
    definirIsCarregamento(true);
    try {
      const loggedUtilizador = await iniciarSessao(
        {
          iniciarSessao: iniciarSessaoEntrada,
          password: palavraPasse,
        },
        rememberMe,
      );
      const destino =
        localizacao.state?.from?.pathname || obterCargoRedirecionamento(loggedUtilizador?.role);

      navigate(destino, {
        replace: true,
      });
    } catch (erro2) {
      definirErro(erro2.message || 'Nome de utilizador ou palavra-passe incorretos');
    } finally {
      definirIsCarregamento(false);
    }
  };

  return (
    <>
      <SEO
        title="Iniciar Sessão — NEXO"
        description="Aceda à sua conta NEXO para continuar os seus cursos, sessões em direto e comunidade de aprendizagem."
        canonical="/entrar"
      />
      <div className="login-panel">
        <div className="login-panel-2">
          <div className="login-panel-3">
            <div className="login-panel-4">
              <Logotipo
                size="lg"
                to="/"
              />
            </div>
            <h2 className="login-heading">Iniciar Sessão</h2>
            <p className="login-description">
              Aceda aos seus cursos, canais da comunidade e salas de transmissão ao vivo.
            </p>
          </div>

          <div className="login-panel-5">
            {erro && (
              <div
                className="login-panel-6"
                role="alert"
              >
                <AlertCircle className="login-alert-circle" />
                <span className="login-label">{erro}</span>
              </div>
            )}

            <form
              onSubmit={tratarSubmeter}
              className="login-form"
            >
              <div>
                <label
                  htmlFor="login-identifier"
                  className="login-field-label"
                >
                  E-mail ou Nome de Utilizador
                </label>
                <div className="login-panel-7">
                  <Mail className="login-mail" />
                  <input
                    id="login-identifier"
                    name="username"
                    autoComplete="username"
                    type="text"
                    required
                    placeholder="exemplo@dominio.com ou utilizador"
                    value={iniciarSessaoEntrada}
                    onChange={(evento) => definirIniciarSessaoEntrada(evento.target.value)}
                    className="login-field"
                  />
                </div>
              </div>

              <div>
                <div className="login-panel-8">
                  <label
                    htmlFor="login-password"
                    className="login-field-label-2"
                  >
                    Palavra-passe
                  </label>
                </div>
                <div className="login-panel-7">
                  <Lock className="login-mail" />
                  <input
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={palavraPasse}
                    onChange={(evento) => definirPalavraPasse(evento.target.value)}
                    className="login-field"
                  />
                </div>
              </div>

              <div className="login-panel-9">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(evento) => definirRememberMe(evento.target.checked)}
                  className="login-field-2"
                />
                <label
                  htmlFor="remember"
                  className="login-field-label-3"
                >
                  Lembrar a sessão neste navegador
                </label>
              </div>

              <button
                type="submit"
                disabled={isCarregamento}
                className="login-button"
              >
                {isCarregamento ? 'A entrar...' : 'Entrar na Plataforma'}
              </button>
            </form>

            <div className="login-panel-10">
              Ainda não tem conta?{' '}
              <Link
                to="/registar"
                className="login-link-2"
              >
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaginaIniciarSessao;
