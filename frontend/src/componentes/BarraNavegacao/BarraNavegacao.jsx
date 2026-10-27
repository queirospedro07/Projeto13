import { podeEnsinar } from '../../utilitarios/permissoes';
import './BarraNavegacao.css';
import Notificacoes from '../Notificacoes/Notificacoes';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LuLogOut as LogOut,
  LuPlus as Plus,
  LuBookOpen as BookOpen,
  LuSettings as Settings,
  LuSun as Sun,
  LuMoon as Moon,
  LuMonitor as Monitor,
  LuChartNoAxesColumn as BarChart3,
  LuArrowRight as ArrowRight,
  LuMessageSquare as MessageSquare,
  LuUser as UserIcon,
  LuSparkles as Sparkles,
  LuShield as Shield,
  LuSearch as Search,
} from 'react-icons/lu';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useTema } from '../../contextos/ContextoTema';
import { Avatar } from '../Avatar';
import { Logotipo } from '../Logotipo';
import { useAvisos } from '../Avisos';
import { PesquisaGlobal } from '../PesquisaGlobal';

export const BarraNavegacao = () => {
  const { user: utilizador, terminarSessao: terminarSessao } = useAutenticacao();
  const { theme: tema, toggleTheme: alternarTema, actualTheme: actualTema } = useTema();
  const { toast: aviso } = useAvisos();
  const navigate = useNavigate();
  const localizacao = useLocation();
  const eAreaGestao = /^\/(formador|administracao)(\/|$)/.test(localizacao.pathname);
  const [mostrarPerfilMenu, definirMostrarPerfilMenu] = useState(false);
  const [mostrarMobilePesquisar, definirMostrarMobilePesquisar] = useState(false);
  const tratarTerminarSessao = () => {
    terminarSessao();
    definirMostrarPerfilMenu(false);
    aviso({
      title: 'Sessão Encerrada',
      message: 'Desconectado com sucesso da plataforma.',
      type: 'info',
    });
    navigate('/entrar');
  };

  const isFormador = podeEnsinar(utilizador);
  const isAdministracao = utilizador?.role === 'ADMIN';
  const homeDestino = utilizador
    ? isAdministracao
      ? '/administracao'
      : isFormador
        ? '/formador'
        : '/painel'
    : '/';

  return (
    <>
      <header className="navbar-header app-navbar">
        <div className="navbar-panel">
          {/* Logótipo */}
          <div className="navbar-panel-2">
            <Link
              to={homeDestino}
              className="navbar-link ui-group"
            >
              <Logotipo
                size="md"
                showText={true}
              />
            </Link>
          </div>

          {/* Barra de pesquisa central */}
          <div className="navbar-panel-3">
            <PesquisaGlobal />
          </div>

          {/* Ações à direita */}
          <div className="navbar-panel-2">
            {/* Botão de pesquisa para mobile */}
            {utilizador && (
              <button
                onClick={() => definirMostrarMobilePesquisar((v) => !v)}
                className="navbar-button"
                title="Pesquisar"
                aria-label="Abrir pesquisa"
              >
                <Search className="navbar-search" />
              </button>
            )}

            <button
              onClick={alternarTema}
              className="navbar-button-2"
              aria-label="Alternar tema"
              title="Alternar Tema"
            >
              {tema === 'system' ? (
                <Monitor className="navbar-monitor" />
              ) : actualTema === 'dark' ? (
                <Moon className="navbar-moon" />
              ) : (
                <Sun className="navbar-sun" />
              )}
            </button>

            {!utilizador ? (
              <div className="navbar-panel-4">
                <Link
                  to="/entrar"
                  className="navbar-link-2"
                >
                  Iniciar Sessão
                </Link>
                <Link
                  to="/registar"
                  className="navbar-link-3"
                >
                  <span>Criar Conta</span>
                  <ArrowRight className="navbar-arrow-right" />
                </Link>
              </div>
            ) : (
              <div className="navbar-panel-5">
                <Notificacoes key={utilizador.id} />
                {isFormador && !eAreaGestao && (
                  <Link
                    to="/formador/cursos/novo"
                    className="navbar-link-4"
                  >
                    <Plus className="navbar-search" />
                    <span>Criar curso</span>
                  </Link>
                )}

                <div className="navbar-panel-6">
                  <button
                    onClick={() => definirMostrarPerfilMenu(!mostrarPerfilMenu)}
                    className="navbar-button-3"
                    aria-label={`Abrir menu de ${utilizador.name}`}
                    aria-expanded={mostrarPerfilMenu}
                  >
                    <Avatar
                      src={utilizador.urlAvatar}
                      name={utilizador.name}
                      size="sm"
                      status="online"
                      role={utilizador.role}
                    />
                  </button>

                  {mostrarPerfilMenu && (
                    <>
                      <div
                        className="navbar-panel-7"
                        onClick={() => definirMostrarPerfilMenu(false)}
                      />
                      <div className="navbar-panel-8">
                        {/* Utilizador card */}
                        <div className="navbar-panel-9">
                          <Avatar
                            src={utilizador.urlAvatar}
                            name={utilizador.name}
                            size="sm"
                            role={utilizador.role}
                          />
                          <div className="navbar-panel-10">
                            <p className="navbar-description">{utilizador.name}</p>
                            <p className="navbar-description-2">{utilizador.email}</p>
                            <span
                              className={`navbar-label ${isAdministracao ? 'navbar-label-2' : isFormador ? 'navbar-label-3' : 'navbar-label-4'}`}
                            >
                              {isAdministracao
                                ? isFormador
                                  ? 'Administracao & Formador'
                                  : 'Administrador'
                                : isFormador
                                  ? 'Formador'
                                  : 'Aluno'}
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/perfil"
                          onClick={() => definirMostrarPerfilMenu(false)}
                          className="navbar-link-5"
                        >
                          <UserIcon className="navbar-user-icon" />
                          <span>O Meu Perfil</span>
                        </Link>

                        <Link
                          to="/mensagens"
                          onClick={() => definirMostrarPerfilMenu(false)}
                          className="navbar-link-5"
                        >
                          <MessageSquare className="navbar-message-square" />
                          <span>Mensagens & Chamadas</span>
                        </Link>

                        {isAdministracao && (
                          <Link
                            to="/administracao"
                            onClick={() => definirMostrarPerfilMenu(false)}
                            className="navbar-link-6"
                          >
                            <Shield className="navbar-sun" />
                            <span>Painel de Administração</span>
                          </Link>
                        )}

                        {isFormador && (
                          <Link
                            to="/formador"
                            onClick={() => definirMostrarPerfilMenu(false)}
                            className="navbar-link-5"
                          >
                            <BarChart3 className="navbar-message-square" />
                            <span>Formação</span>
                          </Link>
                        )}

                        <Link
                          to="/biblioteca"
                          onClick={() => definirMostrarPerfilMenu(false)}
                          className="navbar-link-5"
                        >
                          <BookOpen className="navbar-message-square" />
                          <span>Os Meus Cursos</span>
                        </Link>

                        {!isAdministracao && utilizador?.role !== 'CREATOR' && (
                          <Link
                            to="/formador/candidatar"
                            onClick={() => definirMostrarPerfilMenu(false)}
                            className="navbar-link-7"
                          >
                            <Sparkles className="navbar-user-icon" />
                            <span>Candidatura a Formador</span>
                          </Link>
                        )}

                        <Link
                          to="/definicoes"
                          onClick={() => definirMostrarPerfilMenu(false)}
                          className="navbar-link-5"
                        >
                          <Settings className="navbar-settings" />
                          <span>Definições da Conta</span>
                        </Link>

                        <div className="navbar-panel-11" />

                        <button
                          onClick={tratarTerminarSessao}
                          className="navbar-button-4"
                        >
                          <LogOut className="navbar-search" />
                          <span>Terminar Sessão</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pesquisa em mobile */}
        {mostrarMobilePesquisar && (
          <div className="navbar-panel-12 navbar-mobile-search-surface">
            <PesquisaGlobal onClose={() => definirMostrarMobilePesquisar(false)} />
          </div>
        )}
      </header>
    </>
  );
};

export default BarraNavegacao;
