import React, { useState, useEffect, useMemo } from 'react';
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
  UserPlus,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useActiveCall } from '../../context/ActiveCallContext';
import { Avatar } from '../ui/Avatar';
import { api } from '../../services/api';

export const Sidebar = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeCall } = useActiveCall();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [recentPeers, setRecentPeers] = useState([]);
  const [hiddenCourseIds, setHiddenCourseIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_hidden_courses') || localStorage.getItem('learnspace_hidden_courses') || '[]');
    } catch {
      return [];
    }
  });
  const [hideCompleted, setHideCompleted] = useState(() => {
    return (localStorage.getItem('nexo_hide_completed') ?? localStorage.getItem('learnspace_hide_completed')) === 'true';
  });

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMIN';

  const fetchSidebarData = () => {
    if (user) {
      api.getMyCourses().then(data => setEnrolledCourses(data || [])).catch(() => {});
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

  // Sincronizar cursos ocultos imediatamente com eventos locais e de armazenamento
  useEffect(() => {
    const handleSync = () => {
      try {
        setHiddenCourseIds(JSON.parse(localStorage.getItem('nexo_hidden_courses') || localStorage.getItem('learnspace_hidden_courses') || '[]'));
      } catch {
        setHiddenCourseIds([]);
      }
      setHideCompleted((localStorage.getItem('nexo_hide_completed') ?? localStorage.getItem('learnspace_hide_completed')) === 'true');
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('nexo_courses_visibility_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('nexo_courses_visibility_changed', handleSync);
    };
  }, []);

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

  // Filtrar e ordenar cursos inscritos (excluindo cursos ocultados)
  const sortedEnrolledCourses = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return [];

    const visibleCourses = enrolledCourses.filter(e => {
      const courseId = e.course?.id || e.courseId;
      if (!courseId) return false;
      const isFinished = e.isCompleted || Math.round(e.progressPercent || e.progressPercentage || 0) >= 100;
      if (hiddenCourseIds.includes(courseId)) return false;
      if (hideCompleted && isFinished) return false;
      return true;
    });

    return [...visibleCourses].sort((a, b) => {
      const progA = Math.round(a.progressPercent || a.progressPercentage || 0);
      const progB = Math.round(b.progressPercent || b.progressPercentage || 0);
      const isCompletedA = progA >= 100;
      const isCompletedB = progB >= 100;

      // Cursos incompletos têm prioridade sobre cursos já terminados
      if (!isCompletedA && isCompletedB) return -1;
      if (isCompletedA && !isCompletedB) return 1;

      // Se ambos incompletos: prioriza maior progresso ("quase a acabar")
      if (!isCompletedA && !isCompletedB) {
        if (progA !== progB) {
          return progB - progA;
        }
        const dateA = new Date(a.enrolledAt || 0).getTime();
        const dateB = new Date(b.enrolledAt || 0).getTime();
        return dateA - dateB;
      }

      // Se ambos completos
      const compA = new Date(a.completedAt || a.enrolledAt || 0).getTime();
      const compB = new Date(b.completedAt || b.enrolledAt || 0).getTime();
      return compB - compA;
    });
  }, [enrolledCourses, hiddenCourseIds, hideCompleted]);

  const hiddenCoursesCount = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    return enrolledCourses.filter(e => {
      const courseId = e.course?.id || e.courseId;
      const isFinished = e.isCompleted || Math.round(e.progressPercent || e.progressPercentage || 0) >= 100;
      return (courseId && hiddenCourseIds.includes(courseId)) || (hideCompleted && isFinished);
    }).length;
  }, [enrolledCourses, hiddenCourseIds, hideCompleted]);

  const isFriendsActive =
    location.pathname === '/messages' &&
    (location.search.includes('tab=friends') || location.search.includes('tab=add'));

  const isMessagesActive =
    location.pathname === '/messages' && !isFriendsActive;

  const getNavItemClass = (isActive) =>
    `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-bold'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#121827]'
    }`;

  const getIconClass = (isActive) =>
    `w-4 h-4 shrink-0 transition-colors ${
      isActive
        ? 'text-white'
        : 'text-slate-400 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-white'
    }`;

  const navClass = ({ isActive }) => getNavItemClass(isActive);

  const iconClass = (isActive) => getIconClass(isActive);

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-slate-200/90 dark:border-neutral-900 bg-white dark:bg-black transition-all duration-300 select-none z-30 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="flex-1 pt-2 pb-4 px-2.5 overflow-y-auto custom-scrollbar flex flex-col gap-3.5">
        <div className="flex items-center justify-between px-2 pt-0.5 pb-1">
          {!collapsed ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Navegação
            </span>
          ) : <span />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex flex-col gap-1">

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

          <NavLink to="/help" className={navClass}>
            {({ isActive }) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <HelpCircle className={iconClass(isActive)} />
                {!collapsed && <span className="truncate">Dúvidas & Suporte</span>}
              </div>
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

          <Link to="/messages" className={getNavItemClass(isMessagesActive)}>
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className={getIconClass(isMessagesActive)} />
              {!collapsed && <span className="truncate">Mensagens</span>}
            </div>
            {unreadDms > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shadow-xs">
                {unreadDms}
              </span>
            )}
          </Link>

          <Link to="/messages?tab=friends" className={getNavItemClass(isFriendsActive)}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className={getIconClass(isFriendsActive)} />
              {!collapsed && <span className="truncate">Redes & Amigos</span>}
            </div>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] shadow-xs">
                {pendingRequestsCount}
              </span>
            )}
          </Link>

          {!collapsed && recentPeers.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {recentPeers.map(p => {
                const isPeerActive = location.pathname === '/messages' && location.search.includes(`userId=${p.id}`);
                return (
                  <Link
                    key={p.id}
                    to={`/messages?userId=${p.id}`}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      isPeerActive
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
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
                  </Link>
                );
              })}
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

        {sortedEnrolledCourses.length > 0 && !collapsed && (
          <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="px-3 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Os Meus Cursos
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {sortedEnrolledCourses.slice(0, 4).map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || e.progressPercentage || 0);
                const isCourseInCall = activeCall && String(activeCall.courseId) === String(course.id);
                const targetPath = isCourseInCall
                  ? `/learn/${course.id}`
                  : location.pathname.startsWith('/courses/')
                  ? `/courses/${course.id}`
                  : `/learn/${course.id}`;

                return (
                  <NavLink
                    key={course.id}
                    to={targetPath}
                    onClick={() => {
                      if (isCourseInCall) {
                        try {
                          window.dispatchEvent(new CustomEvent('nexo_focus_call', { detail: activeCall }));
                        } catch {}
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-100 text-slate-950 dark:bg-zinc-800 dark:text-white font-bold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                      } ${isCourseInCall ? 'ring-1 ring-emerald-500/50' : ''}`
                    }
                    title={`${course.title} (${progress}%)${isCourseInCall ? ' • Em chamada ativa' : ''}`}
                  >
                    <div className="relative shrink-0">
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
                      {isCourseInCall && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-black absolute -top-1 -right-1 animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate font-bold text-xs leading-tight">{course.title}</p>
                        {isCourseInCall && (
                          <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider shrink-0">
                            Voz
                          </span>
                        )}
                      </div>
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