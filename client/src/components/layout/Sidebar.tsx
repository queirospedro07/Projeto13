import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Compass, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  Trophy, 
  PlusCircle, 
  FolderPlus, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Flame,
  GraduationCap,
  Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';
import { api } from '../../services/api';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.getMyCourses()
        .then(data => setEnrolledCourses(data || []))
        .catch(() => {});
    }
  }, [user]);

  const mainLinks = [
    { to: '/dashboard', label: 'Painel Principal', icon: Home },
    { to: '/library', label: 'Os Meus Cursos', icon: BookOpen },
    { to: '/community', label: 'Explorar Cursos', icon: Compass },
    { to: '/messages', label: 'Mensagens', icon: MessageSquare },
  ];

  const growthLinks = [
    { to: '/progress', label: 'O Meu Progresso', icon: TrendingUp },
    { to: '/achievements', label: 'Conquistas & Badges', icon: Award },
    { to: '/leaderboard', label: 'Classificação Geral', icon: Trophy },
  ];

  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
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
      {/* Navigation section */}
      <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* Collapse toggle */}
        <div className="flex items-center justify-between px-2">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Navegação
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

        {/* Main section */}
        <nav className="flex flex-col gap-1">
          {mainLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Enrolled Courses Shortcuts Section */}
        {enrolledCourses.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-neutral-800">
            {!collapsed && (
              <div className="px-3 flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Os Meus Cursos ({enrolledCourses.length})
                </span>
                <Link to="/library" className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Ver Todos
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-1">
              {enrolledCourses.slice(0, 5).map(e => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent !== undefined && e.progressPercent !== null ? e.progressPercent : (e.progressPercentage || 0));
                return (
                  <NavLink
                    key={course.id}
                    to={`/learn/${course.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                        isActive
                          ? 'bg-blue-50 dark:bg-neutral-900 text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-neutral-800 shadow-xs'
                          : 'text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900/80'
                      }`
                    }
                    title={`${course.title} (${progress}% concluído)`}
                  >
                    {/* Course Thumbnail / Icon Avatar */}
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black font-black flex items-center justify-center text-xs shrink-0">
                        {course.title?.charAt(0) || 'C'}
                      </div>
                    )}

                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold text-xs leading-tight">{course.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-slate-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono font-bold">
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

        {/* Growth & Gamification */}
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-neutral-800">
          {!collapsed && (
            <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
              Evolução & Conquistas
            </span>
          )}
          {growthLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Creator Studio */}
        {isCreator && (
          <div className="flex flex-col gap-1">
            {!collapsed && (
              <span className="px-3 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-between">
                <span>Criador</span>
              </span>
            )}
            <NavLink to="/creator" end className={linkClass}>
              <FolderPlus className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Visão Geral</span>}
            </NavLink>
            <NavLink to="/creator/courses/new" className={linkClass}>
              <PlusCircle className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Novo Curso</span>}
            </NavLink>
            <NavLink to="/creator/members" className={linkClass}>
              <Users className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Alunos & Membros</span>}
            </NavLink>
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            {!collapsed && (
              <span className="px-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                Administração
              </span>
            )}
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Painel Admin</span>}
            </NavLink>
          </div>
        )}

        {/* Settings */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800">
          <NavLink to="/settings" className={linkClass}>
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Definições</span>}
          </NavLink>
        </div>
      </div>

      {/* User Status bottom card */}
      {user && (
        <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-md">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {user.streakDays}d
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1">
                    <span>Nível {user.level}</span>
                    <span className="text-slate-700 dark:text-neutral-200 font-bold">{user.xp % 400} / 400 XP</span>
                  </div>
                  <ProgressBar value={user.xp % 400} max={400} size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
