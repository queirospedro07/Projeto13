import './PaginaRegisto.css';
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LuUser as Utilizador,
  LuMail as Mail,
  LuLock as Lock,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Logotipo } from '../../componentes/Logotipo';
import { SEO } from '../../componentes/SEO';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';

export const PaginaRegisto = () => {
  const { registar: registar, user: utilizador } = useAutenticacao();
  const [nome, definirNome] = useState('');
  const [nomeUtilizador, definirNomeUtilizador] = useState('');
  const [email, definirEmail] = useState('');
  const [palavraPasse, definirPalavraPasse] = useState('');
  const [confirmarPalavraPasse, definirConfirmarPalavraPasse] = useState('');
  const [aceitarTermos, definirAceitarTermos] = useState(false);
  const [erro, definirErro] = useState('');
  const [isCarregamento, definirIsCarregamento] = useState(false);
  const navigate = useNavigate();
  if (utilizador) {
    return (
      <Navigate
        to="/painel"
        replace
      />
    );
  }

  const tratarSubmeter = async (evento) => {
    evento.preventDefault();
    definirErro('');
    if (palavraPasse !== confirmarPalavraPasse) {
      definirErro('As palavras-passe não coincidem');

      return;
    }

    if (palavraPasse.length < 12) {
      definirErro('A palavra-passe deve ter pelo menos 12 caracteres');

      return;
    }

    if (!aceitarTermos) {
      definirErro('Por favor, aceite os Termos de Utilização e Política de Privacidade');

      return;
    }

    definirIsCarregamento(true);
    try {
      await registar({
        name: nome,
        username: nomeUtilizador,
        email,
        password: palavraPasse,
        termosAceites: aceitarTermos,
      });
      navigate('/painel');
    } catch (erro2) {
      definirErro(
        erro2.message || 'Falha ao criar conta. O utilizador ou email podem já estar em uso.',
      );
    } finally {
      definirIsCarregamento(false);
    }
  };

  return (
    <>
      <SEO
        title="Criar Conta Gratuita — NEXO"
        description="Junte-se à NEXO. Aprenda com cursos práticos, participe em sessões em direto e obtenha certificados verificados."
        canonical="/registar"
      />
      <div className="register-panel">
        <div className="register-panel-2">
          <div className="register-panel-3">
            <div className="register-panel-4">
              <Logotipo
                size="lg"
                to="/"
              />
            </div>
            <h2 className="register-heading">Criar Conta</h2>
            <p className="register-description">
              Junte-se a turmas colaborativas, aceda a aulas e participe em transmissões ao vivo.
            </p>
          </div>

          <div className="register-panel-5">
            {erro && (
              <div className="register-panel-6">
                <AlertCircle className="register-alert-circle" />
                <span className="register-label">{erro}</span>
              </div>
            )}

            <form
              onSubmit={tratarSubmeter}
              className="register-form"
            >
              <div>
                <label
                  htmlFor="register-name"
                  className="register-field-label"
                >
                  Nome Completo
                </label>
                <div className="register-panel-7">
                  <Utilizador className="register-user" />
                  <input
                    id="register-name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    required
                    placeholder="Ex.: João Silva"
                    value={nome}
                    onChange={(evento) => definirNome(evento.target.value)}
                    className="register-field"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-username"
                  className="register-field-label"
                >
                  Nome de Utilizador
                </label>
                <input
                  id="register-username"
                  name="username"
                  autoComplete="username"
                  type="text"
                  required
                  placeholder="ex.: joaosilva"
                  value={nomeUtilizador}
                  onChange={(evento) => definirNomeUtilizador(evento.target.value)}
                  className="register-field-2"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="register-field-label"
                >
                  E-mail
                </label>
                <div className="register-panel-7">
                  <Mail className="register-user" />
                  <input
                    id="register-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    placeholder="exemplo@dominio.com"
                    value={email}
                    onChange={(evento) => definirEmail(evento.target.value)}
                    className="register-field"
                  />
                </div>
              </div>

              <div className="register-panel-8">
                <div>
                  <label
                    htmlFor="register-password"
                    className="register-field-label"
                  >
                    Palavra-passe
                  </label>
                  <div className="register-panel-7">
                    <Lock className="register-user" />
                    <input
                      id="register-password"
                      name="password"
                      autoComplete="new-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={palavraPasse}
                      onChange={(evento) => definirPalavraPasse(evento.target.value)}
                      className="register-field"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-confirmPassword"
                    className="register-field-label"
                  >
                    Confirmar Palavra-passe
                  </label>
                  <input
                    id="register-confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmarPalavraPasse}
                    onChange={(evento) => definirConfirmarPalavraPasse(evento.target.value)}
                    className="register-field-2"
                  />
                </div>
              </div>

              <div className="register-panel-9">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={aceitarTermos}
                  onChange={(evento) => definirAceitarTermos(evento.target.checked)}
                  className="register-field-3"
                />
                <label
                  htmlFor="accept-terms"
                  className="register-field-label-2"
                >
                  Li e aceito os{' '}
                  <Link
                    to="/termos"
                    target="_blank"
                    className="register-link"
                  >
                    Termos de Utilização
                  </Link>{' '}
                  e a{' '}
                  <Link
                    to="/privacidade"
                    target="_blank"
                    className="register-link"
                  >
                    Política de Privacidade
                  </Link>{' '}
                  da plataforma NEXO.
                </label>
              </div>

              <button
                type="submit"
                disabled={isCarregamento}
                className="register-button"
              >
                {isCarregamento ? 'A criar conta...' : 'Criar Conta'}
              </button>
            </form>

            <div className="register-panel-10">
              Já possui uma conta?{' '}
              <Link
                to="/entrar"
                className="register-link-2"
              >
                Iniciar sessão
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaginaRegisto;
