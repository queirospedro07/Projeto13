import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, BookOpen, Settings, BarChart3, PlusCircle, Users, MessageSquare, User, ShieldCheck, PhoneOff, Radio } from 'lucide-react';
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
      const inCall = document.body.classList.contains('in-active-call') || Boolean(document.querySelector('[data-call-stage]'));
      setHasInCallClass(inCall);
    };
    checkCallClass();
    const observer = new MutationObserver(checkCallClass);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMIN';

  const fetchUnread = () => {
    if (user) {
      api.getDirectConversations()
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
    { to: '/dashboard', label: 'Painel', icon: Home },
    { to: '/explore', label: 'Explorar', icon: Compass },
    { to: '/library', label: 'Cursos', icon: BookOpen },
    { to: '/messages', label: 'Mensagens', icon: MessageSquare, badge: unreadDms },
    { to: '/profile', label: 'Perfil', icon: User },
  ];

  const creatorItems = [
    { to: '/creator', label: 'Estúdio', icon: BarChart3 },
    { to: '/creator/courses/new', label: 'Novo', icon: PlusCircle },
    { to: '/creator/members', label: 'Alunos', icon: Users },
    { to: '/messages', label: 'Mensagens', icon: MessageSquare, badge: unreadDms },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const adminItems = [
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
    { to: '/explore', label: 'Explorar', icon: Compass },
    { to: '/messages', label: 'Mensagens', icon: MessageSquare, badge: unreadDms },
    { to: '/profile', label: 'Perfil', icon: User },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const navItems = isAdmin ? adminItems : isCreator ? creatorItems : studentItems;

  if (hasInCallClass) {
    return null;
  }

  return createPortal(
    <nav
      aria-label="Navegação móvel"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 w-full border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-black/95 select-none"
    >
      {Boolean(activeCall) && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              if (activeCall.courseId) {
                navigate(`/learn/${activeCall.courseId}`);
              } else if (activeCall.peerId) {
                navigate(`/messages?userId=${activeCall.peerId}`);
              }
              try {
                window.dispatchEvent(new CustomEvent('nexo_focus_call', { detail: activeCall }));
              } catch {}
            }}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
            <span className="truncate font-bold text-emerald-700 dark:text-emerald-300">
              {activeCall.roomName || 'Voltar à chamada em curso'}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              leaveCall();
            }}
            className="p-1 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Sair da chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-xl items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/creator' || item.to === '/dashboard' || item.to === '/admin'}
            className={({ isActive }) =>
              `relative flex min-w-0 min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-5 h-5 shrink-0" />
              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black shrink-0 leading-tight">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="truncate max-w-[62px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>,
    document.body
  );
};