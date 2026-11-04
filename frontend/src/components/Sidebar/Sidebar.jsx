import { lerJsonCompativel } from '../../utils/fieldCompatibility.js';
import { podeEnsinar } from '../../utils/permissions';
import './Sidebar.css';
import { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LuHouse as Home,
  LuBookOpen as BookOpen,
  LuCompass as Compass,
  LuMessageSquare as MessageSquare,
  LuUsers as Users,
  LuCirclePlus as PlusCircle,
  LuSettings as Settings,
  LuShieldCheck as ShieldCheck,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChartNoAxesColumn as BarChart3,
  LuUserPlus as UserPlus,
  LuMic as Mic,
  LuMicOff as MicOff,
  LuHeadphones as Headphones,
  LuHeadphoneOff as HeadphoneOff,
  LuPhoneOff as PhoneOff,
} from 'react-icons/lu';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useChamadaAtiva } from '../../contexts/ActiveCallContext';
import { Avatar } from '../Avatar';
import { api } from '../../services/api';

export const BarraLateral = () => {
  const { user: utilizador } = useAutenticacao();
  const { socket, onlineUsers: onlineUtilizadores = [] } = useSocket();
  const {
    activeCall: ativoChamada,
    isMicMuted,
    isDeafened,
    toggleMic: alternarMic,
    toggleDeafen: alternarSilenciarAudio,
    leaveCall: sairChamada,
  } = useChamadaAtiva();
  const localizacao = useLocation();
  const [collapsed, definirCollapsed] = useState(false);
  const [enrolledCursos, definirEnrolledCursos] = useState([]);
  const [naoLidasDms, definirNaoLidasDms] = useState(0);
  const [pendenteRequestsContar, definirPendenteRequestsContar] = useState(0);
  const [recentesParticipantes, definirRecentesParticipantes] = useState([]);
  const [afixadoParticipanteIds, definirAfixadoParticipanteIds] = useState([]);
  const [afixadoCursoIds, definirAfixadoCursoIds] = useState([]);
  const [ocultoCursoIds, definirOcultoCursoIds] = useState([]);
  const [ocultarConcluido, definirOcultarConcluido] = useState(false);
  const isFormador = podeEnsinar(utilizador);
  const isAdministracao = utilizador?.role === 'ADMIN';
  const carregarBarraLateralDados = () => {
    if (utilizador) {
      api
        .get('/cursos/minha-aprendizagem')
        .then(({ data: dados }) => dados)
        .then((dados) => definirEnrolledCursos(dados || []))
        .catch(() => {});
      api
        .get('/social/dm/conversas')
        .then(({ data: dados }) => dados)
        .then((convs) => {
          const total = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);

          definirNaoLidasDms(total);

          const participantes = (convs || [])
            .map((c) => ({
              ...c.peer,
              unreadCount: c.unreadCount || 0,
            }))
            .filter((p) => p && p.id);

          definirRecentesParticipantes(participantes);
        })
        .catch(() => {});
      api
        .get('/social/amigos')
        .then(({ data: dados }) => dados)
        .then((dados) => {
          definirPendenteRequestsContar(dados?.incoming?.length || 0);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    carregarBarraLateralDados();
  }, [utilizador?.id, isFormador, localizacao.pathname]);

  // Sincroniza os cursos afixados e a visibilidade com alterações na mesma página.
  useEffect(() => {
    const tratarSincronizar = () => {
      try {
        definirAfixadoParticipanteIds(
          lerJsonCompativel(localStorage.getItem(`nexo_pinned_peers_${utilizador?.id}`) || '[]'),
        );
        definirAfixadoCursoIds(
          lerJsonCompativel(localStorage.getItem(`nexo_pinned_courses_${utilizador?.id}`) || '[]'),
        );
        definirOcultoCursoIds(
          lerJsonCompativel(
            localStorage.getItem('nexo_hidden_courses') ||
              localStorage.getItem('learnspace_hidden_courses') ||
              '[]',
          ),
        );
      } catch {
        definirAfixadoParticipanteIds([]);
        definirAfixadoCursoIds([]);
        definirOcultoCursoIds([]);
      }

      definirOcultarConcluido(
        (localStorage.getItem('nexo_hide_completed') ??
          localStorage.getItem('learnspace_hide_completed')) === 'true',
      );
    };

    tratarSincronizar();
    window.addEventListener('storage', tratarSincronizar);
    window.addEventListener('nexo_courses_visibility_changed', tratarSincronizar);
    window.addEventListener('nexo_pins_changed', tratarSincronizar);

    return () => {
      window.removeEventListener('storage', tratarSincronizar);
      window.removeEventListener('nexo_courses_visibility_changed', tratarSincronizar);
      window.removeEventListener('nexo_pins_changed', tratarSincronizar);
    };
  }, [utilizador?.id]);
  useEffect(() => {
    if (!socket) return;
    const tratarNovoMensagemDireta = () => {
      carregarBarraLateralDados();
    };

    socket.on('direct-message', tratarNovoMensagemDireta);
    socket.on('new-direct-message', tratarNovoMensagemDireta);

    return () => {
      socket.off('direct-message', tratarNovoMensagemDireta);
      socket.off('new-direct-message', tratarNovoMensagemDireta);
    };
  }, [socket]);

  // Filtrar e ordenar cursos inscritos (excluindo cursos ocultados)
  const sortedEnrolledCursos = useMemo(() => {
    if (!enrolledCursos || enrolledCursos.length === 0) return [];
    const visibleCursos = enrolledCursos.filter((evento) => {
      const cursoId = evento.course?.id || evento.idCurso;
      if (!cursoId) return false;
      if (!afixadoCursoIds.includes(cursoId)) return false;
      const isFinished =
        evento.isCompleted ||
        Math.round(evento.percentagemProgresso || evento.progressPercentage || 0) >= 100;
      if (ocultoCursoIds.includes(cursoId)) return false;
      if (ocultarConcluido && isFinished) return false;

      return true;
    });

    return [...visibleCursos].sort((a, b) => {
      const idA = a.course?.id || a.idCurso;
      const idB = b.course?.id || b.idCurso;

      return afixadoCursoIds.indexOf(idA) - afixadoCursoIds.indexOf(idB);
    });
  }, [enrolledCursos, ocultoCursoIds, ocultarConcluido, afixadoCursoIds]);

  const isAmigosAtivo =
    localizacao.pathname === '/mensagens' &&
    (localizacao.search.includes('tab=friends') || localizacao.search.includes('tab=add'));
  const isMensagensAtivo = localizacao.pathname === '/mensagens' && !isAmigosAtivo;
  const afixadoParticipantes = recentesParticipantes.filter((participante) =>
    afixadoParticipanteIds.includes(participante.id),
  );
  const obterNavegacaoItemTurma = (isAtivo) =>
    `sidebar-get-nav-item-class ui-group ${isAtivo ? 'sidebar-get-nav-item-class-2' : 'sidebar-get-nav-item-class-3'}`;
  const obterIconeTurma = (isAtivo) =>
    `sidebar-get-icon-class ${isAtivo ? 'sidebar-get-icon-class-2' : 'sidebar-get-icon-class-3'}`;
  const navegacaoTurma = ({ isActive: isAtivo }) => obterNavegacaoItemTurma(isAtivo);
  const iconeTurma = (isAtivo) => obterIconeTurma(isAtivo);

  return (
    <aside className={`sidebar-sidebar ${collapsed ? 'sidebar-sidebar-2' : 'sidebar-sidebar-3'}`}>
      <div className="sidebar-panel custom-scrollbar">
        <div className="sidebar-panel-2">
          {!collapsed ? <span className="sidebar-label">Navegação</span> : <span />}
          <button
            onClick={() => definirCollapsed(!collapsed)}
            className="sidebar-button"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="sidebar-chevron-right" />
            ) : (
              <ChevronLeft className="sidebar-chevron-right" />
            )}
          </button>
        </div>

        <div className="sidebar-panel-3">
          <NavLink
            to="/painel"
            aria-label="Início"
            className={navegacaoTurma}
          >
            {({ isActive: isAtivo }) => (
              <div className="sidebar-panel-4">
                <Home className={iconeTurma(isAtivo)} />
                {!collapsed && <span className="sidebar-label-2">Início</span>}
              </div>
            )}
          </NavLink>

          <NavLink
            to="/explorar"
            aria-label="Explorar"
            className={navegacaoTurma}
          >
            {({ isActive: isAtivo }) => (
              <div className="sidebar-panel-4">
                <Compass className={iconeTurma(isAtivo)} />
                {!collapsed && <span className="sidebar-label-2">Explorar</span>}
              </div>
            )}
          </NavLink>

          <NavLink
            to="/biblioteca"
            aria-label="Biblioteca"
            className={navegacaoTurma}
          >
            {({ isActive: isAtivo }) => (
              <>
                <div className="sidebar-panel-4">
                  <BookOpen className={iconeTurma(isAtivo)} />
                  {!collapsed && <span className="sidebar-label-2">Biblioteca</span>}
                </div>
                {!collapsed && enrolledCursos.length > 0 && (
                  <span
                    className={`sidebar-label-3 ${isAtivo ? 'sidebar-label-4' : 'sidebar-label-5'}`}
                  >
                    {enrolledCursos.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="sidebar-panel-5">
          {!collapsed && (
            <div className="sidebar-panel-6">
              <span className="sidebar-label">Comunicação</span>
              <Link
                to="/messages?tab=add"
                className="sidebar-link"
                title="Adicionar Amigo"
              >
                <UserPlus className="sidebar-chevron-right" />
              </Link>
            </div>
          )}

          <Link
            to="/mensagens"
            aria-label="Mensagens"
            className={obterNavegacaoItemTurma(isMensagensAtivo)}
          >
            <div className="sidebar-panel-4">
              <MessageSquare className={obterIconeTurma(isMensagensAtivo)} />
              {!collapsed && <span className="sidebar-label-2">Mensagens</span>}
            </div>
            {naoLidasDms > 0 && <span className="sidebar-label-6">{naoLidasDms}</span>}
          </Link>

          <Link
            to="/messages?tab=friends"
            aria-label="Amigos"
            className={obterNavegacaoItemTurma(isAmigosAtivo)}
          >
            <div className="sidebar-panel-4">
              <Users className={obterIconeTurma(isAmigosAtivo)} />
              {!collapsed && <span className="sidebar-label-2">Amigos</span>}
            </div>
            {pendenteRequestsContar > 0 && (
              <span className="sidebar-label-7">{pendenteRequestsContar}</span>
            )}
          </Link>

          {!collapsed && afixadoParticipantes.length > 0 && (
            <div className="sidebar-panel-7">
              {afixadoParticipantes.map((p) => {
                const isParticipanteAtivo =
                  localizacao.pathname === '/mensagens' &&
                  new URLSearchParams(localizacao.search).get('idUtilizador') === p.id;
                const isOnline = Boolean(
                  typeof onlineUtilizadores?.has === 'function'
                    ? onlineUtilizadores.has(p.id)
                    : Array.isArray(onlineUtilizadores) &&
                        onlineUtilizadores.some(
                          (u) =>
                            String(typeof u === 'string' ? u : u?.idUtilizador || u?.id) ===
                            String(p.id),
                        ),
                );

                return (
                  <Link
                    key={p.id}
                    to={`/messages?idUtilizador=${p.id}`}
                    className={`sidebar-link-2 ${isParticipanteAtivo ? 'sidebar-link-3' : 'sidebar-link-4'}`}
                  >
                    <div className="sidebar-panel-8">
                      <div className="sidebar-panel-9">
                        <Avatar
                          src={p.urlAvatar}
                          name={p.name}
                          size="xs"
                        />
                        <span
                          className={`sidebar-label-8 ${isOnline ? 'sidebar-label-10' : 'sidebar-label-11'} sidebar-label-9`}
                        />
                      </div>
                      <span className="sidebar-label-12">{p.name}</span>
                    </div>
                    {p.unreadCount > 0 && <span className="sidebar-label-13" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {isFormador && (
          <nav
            className="sidebar-panel-5"
            aria-label="Formação"
          >
            {!collapsed && <h2 className="sidebar-label-14">Área de criador</h2>}
            <NavLink
              to="/formador"
              end
              className={navegacaoTurma}
              aria-label="Visão geral"
              title={collapsed ? 'Visão geral' : undefined}
            >
              {({ isActive: isAtivo }) => (
                <div className="sidebar-panel-4">
                  <BarChart3
                    className={iconeTurma(isAtivo)}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="sidebar-label-2">Painel geral</span>}
                </div>
              )}
            </NavLink>
            <NavLink
              to="/formador/cursos/novo"
              className={navegacaoTurma}
              aria-label="Criar curso"
              title={collapsed ? 'Criar curso' : undefined}
            >
              {({ isActive: isAtivo }) => (
                <div className="sidebar-panel-4">
                  <PlusCircle
                    className={iconeTurma(isAtivo)}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="sidebar-label-2">Novo curso</span>}
                </div>
              )}
            </NavLink>
            <NavLink
              to="/formador/avaliacoes"
              className={navegacaoTurma}
              aria-label="Avaliar trabalhos"
              title={collapsed ? 'Avaliar trabalhos' : undefined}
            >
              {({ isActive: isAtivo }) => (
                <div className="sidebar-panel-4">
                  <BookOpen
                    className={iconeTurma(isAtivo)}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="sidebar-label-2">Avaliar trabalhos</span>}
                </div>
              )}
            </NavLink>
            <NavLink
              to="/formador/membros"
              className={navegacaoTurma}
              aria-label="Alunos"
              title={collapsed ? 'Alunos' : undefined}
            >
              {({ isActive: isAtivo }) => (
                <div className="sidebar-panel-4">
                  <Users
                    className={iconeTurma(isAtivo)}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="sidebar-label-2">Alunos</span>}
                </div>
              )}
            </NavLink>
          </nav>
        )}

        {isAdministracao && (
          <nav
            className="sidebar-panel-5"
            aria-label="Administração"
          >
            {!collapsed && <h2 className="sidebar-label-14">Administração</h2>}
            <NavLink
              to="/administracao"
              className={navegacaoTurma}
              aria-label="Painel de controlo"
              title={collapsed ? 'Painel de controlo' : undefined}
            >
              {({ isActive: isAtivo }) => (
                <div className="sidebar-panel-4">
                  <ShieldCheck
                    className={iconeTurma(isAtivo)}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="sidebar-label-2">Painel de controlo</span>}
                </div>
              )}
            </NavLink>
          </nav>
        )}

        {sortedEnrolledCursos.length > 0 && !collapsed && (
          <div className="sidebar-panel-10">
            <div className="sidebar-panel-11">
              <span className="sidebar-label">Os meus cursos</span>
            </div>

            <div className="sidebar-panel-3">
              {sortedEnrolledCursos.map((evento) => {
                const curso = evento.course;
                if (!curso) return null;
                const progresso = Math.round(
                  evento.percentagemProgresso || evento.progressPercentage || 0,
                );
                const isCursoInChamada =
                  ativoChamada && String(ativoChamada.idCurso) === String(curso.id);
                const destinoCaminho = isCursoInChamada
                  ? `/aprender/${curso.id}`
                  : localizacao.pathname.startsWith('/cursos/')
                    ? `/cursos/${curso.id}`
                    : `/aprender/${curso.id}`;

                return (
                  <NavLink
                    key={curso.id}
                    to={destinoCaminho}
                    onClick={() => {
                      if (isCursoInChamada) {
                        try {
                          window.dispatchEvent(
                            new CustomEvent('nexo_focus_call', {
                              detail: ativoChamada,
                            }),
                          );
                        } catch {}
                      }
                    }}
                    className={({ isActive: isAtivo }) =>
                      `sidebar-nav-link ${isAtivo ? 'sidebar-nav-link-2' : 'sidebar-nav-link-3'} ${isCursoInChamada ? 'sidebar-nav-link-4' : ''}`
                    }
                    title={`${curso.title} (${progresso}%)${isCursoInChamada ? ' • Em chamada ativa' : ''}`}
                  >
                    <div className="sidebar-panel-9">
                      {curso.urlMiniatura ? (
                        <img
                          src={curso.urlMiniatura}
                          alt={curso.title}
                          className="sidebar-image"
                        />
                      ) : (
                        <div className="sidebar-panel-12">{curso.title?.charAt(0) || 'C'}</div>
                      )}
                      {isCursoInChamada && <span className="sidebar-label-15" />}
                    </div>

                    <div className="sidebar-panel-13">
                      <div className="sidebar-panel-14">
                        <p className="sidebar-description">{curso.title}</p>
                        {isCursoInChamada && <span className="sidebar-label-16">Voz</span>}
                      </div>
                      <div className="sidebar-panel-15">
                        <div className="sidebar-panel-16">
                          <div
                            className="sidebar-panel-17 sidebar-dynamic-1"
                            style={{
                              '--sidebar-width': `${progresso}%`,
                            }}
                          />
                        </div>
                        <span className="sidebar-label-17">{progresso}%</span>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {Boolean(ativoChamada) && (
        <div className={`sidebar-panel-18 ${collapsed ? 'sidebar-panel-19' : 'sidebar-panel-20'}`}>
          <div className="sidebar-panel-8">
            <span className="sidebar-label-18" />
            {!collapsed && (
              <div className="sidebar-panel-21">
                <p className="sidebar-description-2">Voz Conectada</p>
                <p className="sidebar-description-3">
                  {ativoChamada.roomName || 'Chamada em curso'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(evento) => {
              evento.preventDefault();
              evento.stopPropagation();
              sairChamada();
            }}
            className="sidebar-button-2"
            title="Desconectar / Sair da Chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="sidebar-chevron-right" />
          </button>
        </div>
      )}

      {utilizador && (
        <div className="sidebar-panel-22">
          <div className="sidebar-panel-23">
            <Link
              to="/perfil"
              aria-label="O meu perfil"
              className="sidebar-link-5"
            >
              <Avatar
                src={utilizador.urlAvatar}
                name={utilizador.name}
                role={utilizador.role}
                size="sm"
                status="online"
                className="sidebar-avatar"
              />
              {!collapsed && (
                <div className="sidebar-panel-21">
                  <p className="sidebar-description-4">{utilizador.name}</p>
                  <p className="sidebar-description-5">@{utilizador.username}</p>
                </div>
              )}
            </Link>

            {!collapsed && (
              <div className="sidebar-panel-24">
                <button
                  type="button"
                  onClick={(evento) => {
                    evento.preventDefault();
                    evento.stopPropagation();
                    alternarMic();
                  }}
                  className={`sidebar-button-3 ${isMicMuted ? 'sidebar-button-4' : 'sidebar-button-5'}`}
                  title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
                  aria-label={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
                >
                  {isMicMuted ? (
                    <MicOff className="sidebar-mic-off" />
                  ) : (
                    <Mic className="sidebar-chevron-right" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(evento) => {
                    evento.preventDefault();
                    evento.stopPropagation();
                    alternarSilenciarAudio();
                  }}
                  className={`sidebar-button-3 ${isDeafened ? 'sidebar-button-4' : 'sidebar-button-5'}`}
                  title={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                  aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                >
                  {isDeafened ? (
                    <HeadphoneOff className="sidebar-mic-off" />
                  ) : (
                    <Headphones className="sidebar-chevron-right" />
                  )}
                </button>

                {Boolean(ativoChamada) && (
                  <button
                    type="button"
                    onClick={(evento) => {
                      evento.preventDefault();
                      evento.stopPropagation();
                      sairChamada();
                    }}
                    className="sidebar-button-6"
                    title="Desconectar / Sair da Chamada"
                    aria-label="Sair da chamada"
                  >
                    <PhoneOff className="sidebar-chevron-right" />
                  </button>
                )}

                <Link
                  to="/definicoes"
                  className="sidebar-link-6"
                  title="Definições da conta"
                >
                  <Settings className="sidebar-chevron-right" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default BarraLateral;
