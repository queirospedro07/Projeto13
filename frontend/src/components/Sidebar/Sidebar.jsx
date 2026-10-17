import './Sidebar.css';
import { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LuHouse as Home,
  LuBookOpen as BookOpen,
  LuCompass as Compass,
  LuMessageSquare as MessageSquare,
  LuUsers as Users,
  LuCirclePlus as PlusCircle,
  LuSettings as Settings,
  LuShieldCheck as ShieldCheck,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChartNoAxesColumn as BarChart3,
  LuUserPlus as UserPlus,
  LuMic as Mic,
  LuMicOff as MicOff,
  LuHeadphones as Headphones,
  LuHeadphoneOff as HeadphoneOff,
  LuPhoneOff as PhoneOff,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useActiveCall } from '../../context/ActiveCallContext';
import { Avatar } from '../Avatar';
import { api } from '../../services/api';
export const Sidebar = () => {
  const { user } = useAuth();
  const { socket, onlineUsers = [] } = useSocket();
  const { activeCall, isMicMuted, isDeafened, toggleMic, toggleDeafen, leaveCall } =
    useActiveCall();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [unreadDms, setUnreadDms] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [recentPeers, setRecentPeers] = useState([]);
  const [pinnedPeerIds, setPinnedPeerIds] = useState([]);
  const [pinnedCourseIds, setPinnedCourseIds] = useState([]);
  const [hiddenCourseIds, setHiddenCourseIds] = useState([]);
  const [hideCompleted, setHideCompleted] = useState(false);
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const fetchSidebarData = () => {
    if (user) {
      api
        .get('/courses/my-learning')
        .then(({ data }) => data)
        .then((data) => setEnrolledCourses(data || []))
        .catch(() => {});
      api
        .get('/social/dm/conversations')
        .then(({ data }) => data)
        .then((convs) => {
          const total = (convs || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadDms(total);
          const peers = (convs || [])
            .map((c) => ({
              ...c.peer,
              unreadCount: c.unreadCount || 0,
            }))
            .filter((p) => p && p.id);
          setRecentPeers(peers);
        })
        .catch(() => {});
      api
        .get('/social/friends')
        .then(({ data }) => data)
        .then((data) => {
          setPendingRequestsCount(data?.incoming?.length || 0);
        })
        .catch(() => {});
    }
  };
  useEffect(() => {
    fetchSidebarData();
  }, [user?.id, isCreator, location.pathname]);

  // Keep sidebar pins and course visibility in sync with same-tab changes.
  useEffect(() => {
    const handleSync = () => {
      try {
        setPinnedPeerIds(JSON.parse(localStorage.getItem(`nexo_pinned_peers_${user?.id}`) || '[]'));
        setPinnedCourseIds(
          JSON.parse(localStorage.getItem(`nexo_pinned_courses_${user?.id}`) || '[]'),
        );
        setHiddenCourseIds(
          JSON.parse(
            localStorage.getItem('nexo_hidden_courses') ||
              localStorage.getItem('learnspace_hidden_courses') ||
              '[]',
          ),
        );
      } catch {
        setPinnedPeerIds([]);
        setPinnedCourseIds([]);
        setHiddenCourseIds([]);
      }
      setHideCompleted(
        (localStorage.getItem('nexo_hide_completed') ??
          localStorage.getItem('learnspace_hide_completed')) === 'true',
      );
    };
    handleSync();
    window.addEventListener('storage', handleSync);
    window.addEventListener('nexo_courses_visibility_changed', handleSync);
    window.addEventListener('nexo_pins_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('nexo_courses_visibility_changed', handleSync);
      window.removeEventListener('nexo_pins_changed', handleSync);
    };
  }, [user?.id]);
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
    const visibleCourses = enrolledCourses.filter((e) => {
      const courseId = e.course?.id || e.courseId;
      if (!courseId) return false;
      if (!pinnedCourseIds.includes(courseId)) return false;
      const isFinished =
        e.isCompleted || Math.round(e.progressPercent || e.progressPercentage || 0) >= 100;
      if (hiddenCourseIds.includes(courseId)) return false;
      if (hideCompleted && isFinished) return false;
      return true;
    });
    return [...visibleCourses].sort((a, b) => {
      const idA = a.course?.id || a.courseId;
      const idB = b.course?.id || b.courseId;
      return pinnedCourseIds.indexOf(idA) - pinnedCourseIds.indexOf(idB);
    });
  }, [enrolledCourses, hiddenCourseIds, hideCompleted, pinnedCourseIds]);
  const hiddenCoursesCount = useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return 0;
    return enrolledCourses.filter((e) => {
      const courseId = e.course?.id || e.courseId;
      const isFinished =
        e.isCompleted || Math.round(e.progressPercent || e.progressPercentage || 0) >= 100;
      return (courseId && hiddenCourseIds.includes(courseId)) || (hideCompleted && isFinished);
    }).length;
  }, [enrolledCourses, hiddenCourseIds, hideCompleted]);
  const isFriendsActive =
    location.pathname === '/messages' &&
    (location.search.includes('tab=friends') || location.search.includes('tab=add'));
  const isMessagesActive = location.pathname === '/messages' && !isFriendsActive;
  const pinnedPeers = recentPeers.filter((peer) => pinnedPeerIds.includes(peer.id));
  const getNavItemClass = (isActive) =>
    `sidebar-get-nav-item-class ui-group ${isActive ? 'sidebar-get-nav-item-class-2' : 'sidebar-get-nav-item-class-3'}`;
  const getIconClass = (isActive) =>
    `sidebar-get-icon-class ${isActive ? 'sidebar-get-icon-class-2' : 'sidebar-get-icon-class-3'}`;
  const navClass = ({ isActive }) => getNavItemClass(isActive);
  const iconClass = (isActive) => getIconClass(isActive);
  return (
    <aside
      className={`sidebar-sidebar app-sidebar ${collapsed ? 'sidebar-sidebar-2' : 'sidebar-sidebar-3'}`}
    >
      <div className="sidebar-panel custom-scrollbar">
        <div className="sidebar-panel-2">
          {!collapsed ? <span className="sidebar-label">Navegação</span> : <span />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-button"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="sidebar-chevron-right" />
            ) : (
              <ChevronLeft className="sidebar-chevron-right" />
            )}
          </button>
        </div>

        <div className="sidebar-panel-3">
          <NavLink to="/dashboard" className={navClass}>
            {({ isActive }) => (
              <div className="sidebar-panel-4">
                <Home className={iconClass(isActive)} />
                {!collapsed && <span className="sidebar-label-2">Início</span>}
              </div>
            )}
          </NavLink>

          <NavLink to="/explore" className={navClass}>
            {({ isActive }) => (
              <div className="sidebar-panel-4">
                <Compass className={iconClass(isActive)} />
                {!collapsed && <span className="sidebar-label-2">Explorar</span>}
              </div>
            )}
          </NavLink>

          <NavLink to="/library" className={navClass}>
            {({ isActive }) => (
              <>
                <div className="sidebar-panel-4">
                  <BookOpen className={iconClass(isActive)} />
                  {!collapsed && <span className="sidebar-label-2">Os Meus Cursos</span>}
                </div>
                {!collapsed && enrolledCourses.length > 0 && (
                  <span
                    className={`sidebar-label-3 ${isActive ? 'sidebar-label-4' : 'sidebar-label-5'}`}
                  >
                    {enrolledCourses.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>

        <div className="sidebar-panel-5">
          {!collapsed && (
            <div className="sidebar-panel-6">
              <span className="sidebar-label">Social & Mensagens</span>
              <Link to="/messages?tab=add" className="sidebar-link" title="Adicionar Amigo">
                <UserPlus className="sidebar-chevron-right" />
              </Link>
            </div>
          )}

          <Link to="/messages" className={getNavItemClass(isMessagesActive)}>
            <div className="sidebar-panel-4">
              <MessageSquare className={getIconClass(isMessagesActive)} />
              {!collapsed && <span className="sidebar-label-2">Mensagens</span>}
            </div>
            {unreadDms > 0 && <span className="sidebar-label-6">{unreadDms}</span>}
          </Link>

          <Link to="/messages?tab=friends" className={getNavItemClass(isFriendsActive)}>
            <div className="sidebar-panel-4">
              <Users className={getIconClass(isFriendsActive)} />
              {!collapsed && <span className="sidebar-label-2">Redes & Amigos</span>}
            </div>
            {pendingRequestsCount > 0 && (
              <span className="sidebar-label-7">{pendingRequestsCount}</span>
            )}
          </Link>

          {!collapsed && pinnedPeers.length > 0 && (
            <div className="sidebar-panel-7">
              {pinnedPeers.map((p) => {
                const isPeerActive =
                  location.pathname === '/messages' &&
                  new URLSearchParams(location.search).get('userId') === p.id;
                const isOnline = Boolean(
                  typeof onlineUsers?.has === 'function'
                    ? onlineUsers.has(p.id)
                    : Array.isArray(onlineUsers) &&
                        onlineUsers.some(
                          (u) =>
                            String(typeof u === 'string' ? u : u?.userId || u?.id) === String(p.id),
                        ),
                );
                return (
                  <Link
                    key={p.id}
                    to={`/messages?userId=${p.id}`}
                    className={`sidebar-link-2 ${isPeerActive ? 'sidebar-link-3' : 'sidebar-link-4'}`}
                  >
                    <div className="sidebar-panel-8">
                      <div className="sidebar-panel-9">
                        <Avatar src={p.avatarUrl} name={p.name} size="xs" />
                        <span
                          className={`sidebar-label-8 ${isOnline ? 'sidebar-label-10' : 'sidebar-label-11'} sidebar-label-9`}
                        />
                      </div>
                      <span className="sidebar-label-12">{p.name}</span>
                    </div>
                    {p.unreadCount > 0 && <span className="sidebar-label-13" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {isCreator && (
          <div className="sidebar-panel-5">
            {!collapsed && <span className="sidebar-label-14">Área de Criador</span>}

            <NavLink to="/creator" end className={navClass}>
              {({ isActive }) => (
                <div className="sidebar-panel-4">
                  <BarChart3 className={iconClass(isActive)} />
                  {!collapsed && <span className="sidebar-label-2">Painel Geral</span>}
                </div>
              )}
            </NavLink>

            <NavLink to="/creator/courses/new" className={navClass}>
              {({ isActive }) => (
                <div className="sidebar-panel-4">
                  <PlusCircle className={iconClass(isActive)} />
                  {!collapsed && <span className="sidebar-label-2">Novo Curso</span>}
                </div>
              )}
            </NavLink>

            <NavLink to="/creator/members" className={navClass}>
              {({ isActive }) => (
                <div className="sidebar-panel-4">
                  <Users className={iconClass(isActive)} />
                  {!collapsed && <span className="sidebar-label-2">Alunos & Vendas</span>}
                </div>
              )}
            </NavLink>
          </div>
        )}

        {isAdmin && (
          <div className="sidebar-panel-5">
            {!collapsed && <span className="sidebar-label-14">Administração</span>}

            <NavLink to="/admin" className={navClass}>
              {({ isActive }) => (
                <div className="sidebar-panel-4">
                  <ShieldCheck className="sidebar-shield-check" />
                  {!collapsed && <span className="sidebar-label-2">Painel de Controlo</span>}
                </div>
              )}
            </NavLink>
          </div>
        )}

        {sortedEnrolledCourses.length > 0 && !collapsed && (
          <div className="sidebar-panel-10">
            <div className="sidebar-panel-11">
              <span className="sidebar-label">Os Meus Cursos</span>
            </div>

            <div className="sidebar-panel-3">
              {sortedEnrolledCourses.map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || e.progressPercentage || 0);
                const isCourseInCall =
                  activeCall && String(activeCall.courseId) === String(course.id);
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
                          window.dispatchEvent(
                            new CustomEvent('nexo_focus_call', {
                              detail: activeCall,
                            }),
                          );
                        } catch {}
                      }
                    }}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'sidebar-nav-link-2' : 'sidebar-nav-link-3'} ${isCourseInCall ? 'sidebar-nav-link-4' : ''}`
                    }
                    title={`${course.title} (${progress}%)${isCourseInCall ? ' • Em chamada ativa' : ''}`}
                  >
                    <div className="sidebar-panel-9">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="sidebar-image"
                        />
                      ) : (
                        <div className="sidebar-panel-12">{course.title?.charAt(0) || 'C'}</div>
                      )}
                      {isCourseInCall && <span className="sidebar-label-15" />}
                    </div>

                    <div className="sidebar-panel-13">
                      <div className="sidebar-panel-14">
                        <p className="sidebar-description">{course.title}</p>
                        {isCourseInCall && <span className="sidebar-label-16">Voz</span>}
                      </div>
                      <div className="sidebar-panel-15">
                        <div className="sidebar-panel-16">
                          <div
                            className="sidebar-panel-17 sidebar-dynamic-1"
                            style={{
                              '--sidebar-width': `${progress}%`,
                            }}
                          />
                        </div>
                        <span className="sidebar-label-17">{progress}%</span>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {Boolean(activeCall) && (
        <div className={`sidebar-panel-18 ${collapsed ? 'sidebar-panel-19' : 'sidebar-panel-20'}`}>
          <div className="sidebar-panel-8">
            <span className="sidebar-label-18" />
            {!collapsed && (
              <div className="sidebar-panel-21">
                <p className="sidebar-description-2">Voz Conectada</p>
                <p className="sidebar-description-3">{activeCall.roomName || 'Chamada em curso'}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              leaveCall();
            }}
            className="sidebar-button-2"
            title="Desconectar / Sair da Chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="sidebar-chevron-right" />
          </button>
        </div>
      )}

      {user && (
        <div className="sidebar-panel-22">
          <div className="sidebar-panel-23">
            <Link to="/profile" className="sidebar-link-5">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                role={user.role}
                size="sm"
                status="online"
                className="sidebar-avatar"
              />
              {!collapsed && (
                <div className="sidebar-panel-21">
                  <p className="sidebar-description-4">{user.name}</p>
                  <p className="sidebar-description-5">@{user.username}</p>
                </div>
              )}
            </Link>

            {!collapsed && (
              <div className="sidebar-panel-24">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMic();
                  }}
                  className={`sidebar-button-3 ${isMicMuted ? 'sidebar-button-4' : 'sidebar-button-5'}`}
                  title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
                  aria-label={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
                >
                  {isMicMuted ? (
                    <MicOff className="sidebar-mic-off" />
                  ) : (
                    <Mic className="sidebar-chevron-right" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDeafen();
                  }}
                  className={`sidebar-button-3 ${isDeafened ? 'sidebar-button-4' : 'sidebar-button-5'}`}
                  title={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                  aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                >
                  {isDeafened ? (
                    <HeadphoneOff className="sidebar-mic-off" />
                  ) : (
                    <Headphones className="sidebar-chevron-right" />
                  )}
                </button>

                {Boolean(activeCall) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      leaveCall();
                    }}
                    className="sidebar-button-6"
                    title="Desconectar / Sair da Chamada"
                    aria-label="Sair da chamada"
                  >
                    <PhoneOff className="sidebar-chevron-right" />
                  </button>
                )}

                <Link to="/settings" className="sidebar-link-6" title="Definições da conta">
                  <Settings className="sidebar-chevron-right" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
