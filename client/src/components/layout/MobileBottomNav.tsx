import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MessageSquare, User, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Início', icon: Home },
    { to: '/library', label: 'Os Meus Cursos', icon: BookOpen },
    { to: '/community', label: 'Explorar Cursos', icon: Compass },
    { to: '/messages', label: 'Mensagens', icon: MessageSquare },
    { to: user ? `/profile/${user.username}` : '/login', label: 'Perfil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-slate-200 dark:border-neutral-800 py-3 px-4 flex items-center justify-around shadow-lg">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};
