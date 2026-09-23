import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Compass,
  Users,
  PlusCircle,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { api } from '../../services/api';

export const Sidebar = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'CREATOR') {
      api.getMyCourses().then(data => setEnrolledCourses(data || [])).catch(() => {});
    }
  }, [user]);

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMIN';

  const studentLinks = [
    { to: '/dashboard', label: 'Painel do Aluno', icon: Home },
    { to: '/explore', label: 'Explorar Cursos', icon: Compass },
    { to: '/library', label: 'Os Meus Cursos', icon: BookOpen },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const creatorLinks = [
    { to: '/creator', label: 'Painel do Criador', icon: BarChart3 },
    { to: '/creator/courses/new', label: 'Criar Novo Curso', icon: PlusCircle },
    { to: '/creator/members', label: 'Alunos & Membros', icon: Users },
    { to: '/explore', label: 'Ver Catálogo', icon: Compass },
    { to: '/settings', label: 'Definições', icon: Settings },
  ];

  const currentLinks = isCreator ? creatorLinks : studentLinks;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-50 dark:bg-neutral-900 text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-neutral-800 shadow-xs'
        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900/80'
    }`;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black transition-all duration-200 select-none z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        <div className="flex items-center justify-between px-2">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              {isCreator ? 'Menu do Criador' : 'Menu Principal'}
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors ml-auto cursor-pointer"
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {currentLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/creator'} className={linkClass}>
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck className="w-5 h-5 shrink-0 text-amber-500" />
              {!collapsed && <span>Painel Admin</span>}
            </NavLink>
          )}
        </nav>

        {!isCreator && enrolledCourses.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-neutral-800">
            {!collapsed && (
              <div className="px-3 flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Aulas Ativas ({enrolledCourses.length})
                </span>
                <Link to="/library" className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Ver Todos
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-1">
              {enrolledCourses.slice(0, 4).map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || e.progressPercentage || 0);
                return (
                  <NavLink
                    key={course.id}
                    to={`/learn/${course.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-neutral-900 text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-neutral-800'
                          : 'text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900/80'
                      }`
                    }
                    title={`${course.title} (${progress}%)`}
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {course.title?.charAt(0) || 'C'}
                      </div>
                    )}

                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold text-xs">{course.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-slate-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950">
          <Link to="/settings" className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-neutral-900 transition-colors">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                  {isCreator ? 'Criador / Formador' : 'Cliente / Aluno'}
                </p>
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
};