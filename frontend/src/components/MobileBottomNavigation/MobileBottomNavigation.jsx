import { podeEnsinar } from '../../utils/permissions';
import './MobileBottomNavigation.css';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LuHouse as Home,
  LuCompass as Compass,
  LuBookOpen as BookOpen,
  LuSettings as Settings,
  LuChartNoAxesColumn as BarChart3,
  LuCirclePlus as PlusCircle,
  LuUsers as Users,
  LuMessageSquare as MessageSquare,
  LuUser as Utilizador,
  LuShieldCheck as ShieldCheck,
  LuPhoneOff as PhoneOff,
  LuRadio as Radio,
} from 'react-icons/lu';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useChamadaAtiva } from '../../contexts/ActiveCallContext';
import { api } from '../../services/api';

export const NavegacaoInferiorMovel = () => {
  const { user: utilizador } = useAutenticacao();
  const { socket } = useSocket();
  const { activeCall: ativoChamada, leaveCall: sairChamada } = useChamadaAtiva();
  const localizacao = useLocation();
  const navigate = useNavigate();
  const [naoLidasDms, definirNaoLidasDms] = useState(0);
  const [temInChamadaTurma, definirTemInChamadaTurma] = useState(false);

  useEffect(() => {
    const verificarChamadaTurma = () => {
      const inChamada =
        document.body.classList.contains('in-active-call') ||
        Boolean(document.querySelector('[data-call-stage]'));

      definirTemInChamadaTurma(inChamada);
    };

    verificarChamadaTurma();

    const observer = new MutationObserver(verificarChamadaTurma);

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const isFormador = podeEnsinar(utilizador);
  const isAdministracao = utilizador?.role === 'ADMIN';
  const carregarNaoLidas = () => {
    if (utilizador) {
      api
        .get('/social/dm/conversas')
        .then(({ data: dados }) => dados)
        .then((convs) => {
          const total = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);

          definirNaoLidasDms(total);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    carregarNaoLidas();
  }, [utilizador?.id, localizacao.pathname]);
  useEffect(() => {
    if (!socket) return;
    const tratarNovoMensagemDireta = () => carregarNaoLidas();

    socket.on('direct-message', tratarNovoMensagemDireta);
    socket.on('new-direct-message', tratarNovoMensagemDireta);

    return () => {
      socket.off('direct-message', tratarNovoMensagemDireta);
      socket.off('new-direct-message', tratarNovoMensagemDireta);
    };
  }, [socket]);

  const alunoItens = [
    {
      to: '/painel',
      label: 'Painel',
      icon: Home,
    },
    {
      to: '/explorar',
      label: 'Explorar',
      icon: Compass,
    },
    {
      to: '/biblioteca',
      label: 'Cursos',
      icon: BookOpen,
    },
    {
      to: '/mensagens',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: naoLidasDms,
    },
    {
      to: '/perfil',
      label: 'Perfil',
      icon: Utilizador,
    },
  ];
  const formadorItens = [
    {
      to: '/formador',
      label: 'Formação',
      icon: BarChart3,
    },
    {
      to: '/formador/cursos/novo',
      label: 'Novo',
      icon: PlusCircle,
    },
    {
      to: '/formador/membros',
      label: 'Alunos',
      icon: Users,
    },
    {
      to: '/mensagens',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: naoLidasDms,
    },
    {
      to: '/definicoes',
      label: 'Definições',
      icon: Settings,
    },
  ];
  const administracaoItens = [
    {
      to: '/administracao',
      label: 'Administração',
      icon: ShieldCheck,
    },
    {
      to: '/formador',
      label: 'Formação',
      icon: BarChart3,
    },
    {
      to: '/biblioteca',
      label: 'Cursos',
      icon: BookOpen,
    },
    {
      to: '/mensagens',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: naoLidasDms,
    },
    {
      to: '/perfil',
      label: 'Perfil',
      icon: Utilizador,
    },
  ];
  const navegacaoItens = isAdministracao
    ? administracaoItens
    : isFormador
      ? formadorItens
      : alunoItens;
  if (temInChamadaTurma) {
    return null;
  }

  return createPortal(
    <nav
      aria-label="Navegação móvel"
      className="mobile-bottom-nav-navigation"
    >
      {Boolean(ativoChamada) && (
        <div className="mobile-bottom-nav-panel">
          <button
            type="button"
            onClick={() => {
              if (ativoChamada.idCurso) {
                navigate(`/aprender/${ativoChamada.idCurso}`);
              } else if (ativoChamada.peerId) {
                navigate(`/messages?idUtilizador=${ativoChamada.peerId}`);
              }

              try {
                window.dispatchEvent(
                  new CustomEvent('nexo_focus_call', {
                    detail: ativoChamada,
                  }),
                );
              } catch {}
            }}
            className="mobile-bottom-nav-button"
          >
            <Radio className="mobile-bottom-nav-radio" />
            <span className="mobile-bottom-nav-label">
              {ativoChamada.roomName || 'Voltar à chamada em curso'}
            </span>
          </button>
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              sairChamada();
            }}
            className="mobile-bottom-nav-button-2"
            title="Sair da chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="mobile-bottom-nav-phone-off" />
          </button>
        </div>
      )}
      <div className="mobile-bottom-nav-panel-2">
        {navegacaoItens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/formador' || item.to === '/painel' || item.to === '/administracao'}
            className={({ isActive: isAtivo }) =>
              `mobile-bottom-nav-nav-link ${isAtivo ? 'mobile-bottom-nav-nav-link-2' : 'mobile-bottom-nav-nav-link-3'}`
            }
          >
            <div className="mobile-bottom-nav-panel-3">
              <item.icon className="mobile-bottom-nav-mobile-bottom-nav" />
              {Boolean(item.badge && item.badge > 0) && (
                <span className="mobile-bottom-nav-label-2">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="mobile-bottom-nav-label-3">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>,
    document.body,
  );
};
