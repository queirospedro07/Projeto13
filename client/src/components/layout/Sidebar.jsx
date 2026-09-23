import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Compass,
  MessageSquare,
  Users,
  PlusCircle,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import { api } from '../../services/api';

export const Sidebar = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [recentPeers, setRecentPeers] = useState([]);

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMIN';

  const fetchSidebarData = () => {
    if (user) {
      if (!isCreator) {
        api.getMyCourses().then(data => setEnrolledCourses(data || [])).catch(() => {});
      }
      api.getDirectConversations().then(convs => {
        const total = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadDms(total);
        const peers = (convs || []).slice(0, 4).map(c => ({
          ...c.peer,
          unreadCount: c.unreadCount || 0
        })).filter(p => p && p.id);
        setRecentPeers(peers);
      }).catch(() => {});
      api.getFriends().then(data => {
        setPendingRequestsCount(data?.incoming?.length || 0);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, [user?.id, isCreator, location.pathname]);

  useEffect(() => {
    if (!socket) return;
    const handleNewDm = () => {
      fetchSidebarData();
    };
    socket.on('direct-message', handleNewDm);
    socket.on('new-direct-message', handleNewDm);
    return () => {
      socket.off('direct-message', handleNewDm);
      socket.off('new-direct-message', handleNewDm);
    };
  }, [socket]);

  const navClass = ({ isActive }) =>
    `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
      isActive
        ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-bold'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/80'
    }`;

  const iconClass = (isActive) =>
    `w-4 h-4 shrink-0 transition-colors ${
      isActive
        ? 'text-white dark:text-black'
        : 'text-slate-400 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-white'
    }`;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0b0c0e] transition-all duration-300 select-none z-30 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-600" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate block">
                  LearnSpace
                </span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate font-medium">
                  Aprender & Conectar
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 mb-1">
              Navegação
            </span>
          )}

          <NavLink to="/dashboard" className={navClass}>
            {({ isActive }) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <Home className={iconClass(isActive)} />
                {!collapsed && <span className="truncate">Início</span>}
              </div>
            )}
          </NavLink>

          <NavLink to="/explore" className={navClass}>
            {({ isActive }) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <Compass className={iconClass(isActive)} />
                {!collapsed && <span className="truncate">Explorar</span>}
              </div>
            )}
          </NavLink>

          <NavLink to="/library" className={navClass}>
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Os Meus Cursos</span>}
                </div>
                {!collapsed && enrolledCourses.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-slate-800 text-slate-200 dark:bg-zinc-200 dark:text-black'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {enrolledCourses.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Social & Mensagens
              </span>
              <Link
                to="/messages?tab=add"
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Adicionar Amigo"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <NavLink to="/messages" end className={navClass}>
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Mensagens</span>}
                </div>
                {unreadDms > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs">
                    {unreadDms}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink to="/messages?tab=friends" className={navClass}>
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Redes & Amigos</span>}
                </div>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] shadow-xs">
                    {pendingRequestsCount}
                  </span>
                )}
              </>
            )}
          </NavLink>

          {!collapsed && recentPeers.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {recentPeers.map(p => (
                <NavLink
                  key={p.id}
                  to={`/messages?userId=${p.id}`}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar src={p.avatarUrl} name={p.name} size="xs" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-black absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <span className="truncate text-xs">{p.name}</span>
                  </div>
                  {p.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {isCreator && (
          <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            {!collapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 mb-1">
                Área de Criador
              </span>
            )}

            <NavLink to="/creator" end className={navClass}>
              {({ isActive }) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <BarChart3 className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Painel Geral</span>}
                </div>
              )}
            </NavLink>

            <NavLink to="/creator/courses/new" className={navClass}>
              {({ isActive }) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlusCircle className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Novo Curso</span>}
                </div>
              )}
            </NavLink>

            <NavLink to="/creator/members" className={navClass}>
              {({ isActive }) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={iconClass(isActive)} />
                  {!collapsed && <span className="truncate">Alunos & Vendas</span>}
                </div>
              )}
            </NavLink>
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            {!collapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 mb-1">
                Administração
              </span>
            )}

            <NavLink to="/admin" className={navClass}>
              {({ isActive }) => (
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  {!collapsed && <span className="truncate">Painel de Controlo</span>}
                </div>
              )}
            </NavLink>
          </div>
        )}

        {!isCreator && enrolledCourses.length > 0 && !collapsed && (
          <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="px-3 flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Continuar Aulas
              </span>
              <Link to="/library" className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="flex flex-col gap-1">
              {enrolledCourses.slice(0, 3).map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || e.progressPercentage || 0);
                return (
                  <NavLink
                    key={course.id}
                    to={`/learn/${course.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-100 text-slate-950 dark:bg-zinc-800 dark:text-white font-bold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                      }`
                    }
                    title={`${course.title} (${progress}%)`}
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200/80 dark:border-zinc-800"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        {course.title?.charAt(0) || 'C'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-xs leading-tight">{course.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 bg-slate-200/80 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#08080a]">
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" className="shrink-0" />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                    @{user.username}
                  </p>
                </div>
              )}
            </Link>

            {!collapsed && (
              <Link
                to="/settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors shrink-0"
                title="Definições da conta"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;