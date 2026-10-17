import './MobileBottomNav.css';
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
  LuUser as User,
  LuShieldCheck as ShieldCheck,
  LuPhoneOff as PhoneOff,
  LuRadio as Radio,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useActiveCall } from '../../context/ActiveCallContext';
import { api } from '../../services/api';
export const MobileBottomNav = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeCall, leaveCall } = useActiveCall();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadDms, setUnreadDms] = useState(0);
  const [hasInCallClass, setHasInCallClass] = useState(false);
  useEffect(() => {
    const checkCallClass = () => {
      const inCall =
        document.body.classList.contains('in-active-call') ||
        Boolean(document.querySelector('[data-call-stage]'));
      setHasInCallClass(inCall);
    };
    checkCallClass();
    const observer = new MutationObserver(checkCallClass);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const fetchUnread = () => {
    if (user) {
      api
        .get('/social/dm/conversations')
        .then(({ data }) => data)
        .then((convs) => {
          const total = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadDms(total);
        })
        .catch(() => {});
    }
  };
  useEffect(() => {
    fetchUnread();
  }, [user?.id, location.pathname]);
  useEffect(() => {
    if (!socket) return;
    const handleNewDm = () => fetchUnread();
    socket.on('direct-message', handleNewDm);
    socket.on('new-direct-message', handleNewDm);
    return () => {
      socket.off('direct-message', handleNewDm);
      socket.off('new-direct-message', handleNewDm);
    };
  }, [socket]);
  const studentItems = [
    {
      to: '/dashboard',
      label: 'Painel',
      icon: Home,
    },
    {
      to: '/explore',
      label: 'Explorar',
      icon: Compass,
    },
    {
      to: '/library',
      label: 'Cursos',
      icon: BookOpen,
    },
    {
      to: '/messages',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: unreadDms,
    },
    {
      to: '/profile',
      label: 'Perfil',
      icon: User,
    },
  ];
  const creatorItems = [
    {
      to: '/creator',
      label: 'Estúdio',
      icon: BarChart3,
    },
    {
      to: '/creator/courses/new',
      label: 'Novo',
      icon: PlusCircle,
    },
    {
      to: '/creator/members',
      label: 'Alunos',
      icon: Users,
    },
    {
      to: '/messages',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: unreadDms,
    },
    {
      to: '/settings',
      label: 'Definições',
      icon: Settings,
    },
  ];
  const adminItems = [
    {
      to: '/admin',
      label: 'Admin',
      icon: ShieldCheck,
    },
    {
      to: '/creator',
      label: 'Estúdio',
      icon: BarChart3,
    },
    {
      to: '/library',
      label: 'Cursos',
      icon: BookOpen,
    },
    {
      to: '/messages',
      label: 'Mensagens',
      icon: MessageSquare,
      badge: unreadDms,
    },
    {
      to: '/profile',
      label: 'Perfil',
      icon: User,
    },
  ];
  const navItems = isAdmin ? adminItems : isCreator ? creatorItems : studentItems;
  if (hasInCallClass) {
    return null;
  }
  return createPortal(
    <nav aria-label="Navegação móvel" className="mobile-bottom-nav-navigation">
      {Boolean(activeCall) && (
        <div className="mobile-bottom-nav-panel">
          <button
            type="button"
            onClick={() => {
              if (activeCall.courseId) {
                navigate(`/learn/${activeCall.courseId}`);
              } else if (activeCall.peerId) {
                navigate(`/messages?userId=${activeCall.peerId}`);
              }
              try {
                window.dispatchEvent(
                  new CustomEvent('nexo_focus_call', {
                    detail: activeCall,
                  }),
                );
              } catch {}
            }}
            className="mobile-bottom-nav-button"
          >
            <Radio className="mobile-bottom-nav-radio" />
            <span className="mobile-bottom-nav-label">
              {activeCall.roomName || 'Voltar à chamada em curso'}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              leaveCall();
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
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/creator' || item.to === '/dashboard' || item.to === '/admin'}
            className={({ isActive }) =>
              `mobile-bottom-nav-nav-link ${isActive ? 'mobile-bottom-nav-nav-link-2' : 'mobile-bottom-nav-nav-link-3'}`
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
