import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, BookOpen, Settings, BarChart3, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const isCreator = user?.role === 'CREATOR';

  const studentItems = [
    { to: '/dashboard', label: 'Painel', icon: Home },
    { to: '/explore', label: 'Explorar', icon: Compass },
    { to: '/library', label: 'Cursos', icon: BookOpen },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const creatorItems = [
    { to: '/creator', label: 'Estúdio', icon: BarChart3 },
    { to: '/creator/courses/new', label: 'Novo', icon: PlusCircle },
    { to: '/creator/members', label: 'Alunos', icon: Users },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const navItems = isCreator ? creatorItems : studentItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-slate-200 dark:border-neutral-800 py-2.5 px-4 flex items-center justify-around shadow-lg">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/creator'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
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