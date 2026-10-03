import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, Settings, BarChart3, PlusCircle, Users, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [unreadDms, setUnreadDms] = useState(0);

  const isCreator = user?.role === 'CREATOR';

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

  const navItems = isCreator ? creatorItems : studentItems;

  return (
    <nav
      aria-label="Navegação móvel"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 w-full border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-black/95 select-none"
    >
      <div className="mx-auto flex w-full max-w-xl items-center justify-around">
        {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/creator' || item.to === '/dashboard'}
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
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black shrink-0 leading-tight">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span className="truncate max-w-[62px]">{item.label}</span>
        </NavLink>
      ))}
      </div>
    </nav>
  );
};