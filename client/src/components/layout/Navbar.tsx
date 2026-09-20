import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Sparkles, 
  UserCheck, 
  LogOut, 
  Settings, 
  ShieldAlert, 
  FolderPlus,
  Compass,
  Users,
  Flame,
  Check,
  Home,
  BookOpen,
  Trophy,
  User as UserIcon,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Plus,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';
import { soundEffects } from '../../services/soundEffects';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || '');

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => {
          setNotifications(data || []);
          setUnreadCount((data || []).filter((n: any) => !n.isRead).length);
        })
        .catch(() => {});
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    soundEffects.playLeaveCall();
    toast({
      title: 'Sessão Encerrada',
      message: 'Desconectado com sucesso da plataforma.',
      type: 'info'
    });
    navigate('/login');
  };

  const isCurrentActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 h-16 transition-colors shadow-xs">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        
        {/* ========================================================================= */}
        {/* 1. LEFT BRANDING */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group select-none">
            <Logo size="md" showText={false} />
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white font-sans">
              LearnSpace
            </span>
          </Link>

          {/* Public guest navigation (only when not logged in) */}
          {!user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-neutral-400">
              <Link
                to="/community"
                className={`px-3.5 py-2 rounded-xl transition-colors hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 ${
                  isCurrentActive('/community') ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-neutral-900 font-bold' : ''
                }`}
              >
                Explorar Cursos
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3.5 py-2 rounded-xl transition-colors hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 ${
                  isCurrentActive('/leaderboard') ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-neutral-900 font-bold' : ''
                }`}
              >
                Classificação
              </Link>
            </nav>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER: SLEEK SEARCH BAR (INTERACTIVE & EXPANDED) */}
        {/* ========================================================================= */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-slate-100/90 dark:bg-[#121214] border border-slate-200/90 dark:border-neutral-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#161618] text-slate-500 dark:text-zinc-400 text-sm transition-all shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            title={`Pesquisar (${isMac ? '⌘K' : 'Ctrl+K'})`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="text-slate-500 dark:text-zinc-400 font-medium text-xs sm:text-sm truncate">
                Pesquisar cursos, lições, espaços, criadores...
              </span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-[11px] text-slate-600 dark:text-zinc-300 font-mono shadow-2xs font-semibold">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT CONTROLS: ACTION BUTTONS & USER PROFILE */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* GUEST ACTIONS (NOT LOGGED IN) */}
          {!user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Theme Toggle for Guest */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Alternar Tema"
              >
                {theme === 'system' ? (
                  <Monitor className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                ) : actualTheme === 'dark' ? (
                  <Moon className="w-4.5 h-4.5 text-blue-400" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-500" />
                )}
              </button>

              <Link
                to="/login"
                className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
              >
                Iniciar Sessão
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Criar Conta</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* AUTHENTICATED ACTIONS (LOGGED IN) */
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Quick Create Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => { setShowCreateMenu(!showCreateMenu); setShowProfileMenu(false); setShowNotifications(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  title="Ação Rápida / Criar"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Criar</span>
                </button>

                {showCreateMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-2xl shadow-2xl p-2 z-50 text-sm animate-fade-in flex flex-col gap-1">
                    <div className="px-3 py-1 text-slate-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                      Ações Rápidas
                    </div>
                    {(user.role === 'CREATOR' || user.role === 'ADMIN') && (
                      <Link
                        to="/creator/courses/new"
                        onClick={() => setShowCreateMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-[#141414] text-slate-800 dark:text-zinc-200 text-xs font-bold transition-colors"
                      >
                        <FolderPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Novo Curso</span>
                      </Link>
                    )}
                    <Link
                      to="/community"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-[#141414] text-slate-800 dark:text-zinc-200 text-xs font-bold transition-colors"
                    >
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Explorar Cursos</span>
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-[#141414] text-slate-800 dark:text-zinc-200 text-xs font-bold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Conversa Direta (DM)</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Streak & XP Gamification Pill */}
              <Link
                to="/progress"
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0e0e0e] border border-slate-200 dark:border-[#222222] text-xs font-extrabold hover:bg-slate-200 dark:hover:bg-[#161616] transition-colors"
                title="Sequência diária de estudo e experiência"
              >
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{user.streakDays || 1}d</span>
                </div>
                <div className="h-3 w-px bg-slate-300 dark:bg-neutral-800" />
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                  <span>{user.xp || 0} XP</span>
                </div>
              </Link>

              {/* Direct Messages Shortcut */}
              <Link
                to="/messages"
                className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors relative cursor-pointer"
                title="Mensagens Diretas"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); setShowCreateMenu(false); }}
                  className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors relative cursor-pointer"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-black animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-3xl shadow-2xl p-4 z-50 text-sm animate-fade-in">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-[#1a1a1a]">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">Notificações</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-sm font-medium">
                          Sem novas notificações de momento.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <Link
                            key={n.id}
                            to={n.link || '#'}
                            onClick={() => setShowNotifications(false)}
                            className={`p-3 rounded-2xl flex flex-col gap-1 transition-colors ${
                              n.isRead 
                                ? 'bg-slate-50 dark:bg-[#121212] text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#181818]' 
                                : 'bg-blue-50 dark:bg-[#0c192c] text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/70 dark:hover:bg-[#0f233f]'
                            }`}
                          >
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{n.title}</span>
                            <span className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2">{n.content}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Quick Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors cursor-pointer"
                title={`Tema: ${theme === 'system' ? 'Sincronizado' : actualTheme === 'dark' ? 'Modo Escuro (Preto Puro)' : 'Modo Claro'} (Clique para alternar)`}
              >
                {theme === 'system' ? (
                  <Monitor className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                ) : actualTheme === 'dark' ? (
                  <Moon className="w-4.5 h-4.5 text-blue-400" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-500" />
                )}
              </button>

              {/* Profile Avatar & Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setShowCreateMenu(false); }}
                  className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer"
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-3xl shadow-2xl p-3 z-50 text-sm animate-fade-in flex flex-col gap-1">
                    
                    {/* Profile Header */}
                    <div className="p-3 bg-slate-50 dark:bg-[#121212] border border-slate-100 dark:border-[#222222] rounded-2xl mb-2 flex items-center gap-3">
                      <Avatar src={user.avatarUrl} name={user.name} size="md" status="online" />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate">@{user.username}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold uppercase">
                            Nível {user.level || 1}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-zinc-300 font-bold">{user.xp || 0} XP</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white font-semibold transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      <span>O Meu Perfil</span>
                    </Link>

                    <Link
                      to="/library"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white font-semibold transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      <span>Os Meus Cursos</span>
                    </Link>

                    <Link
                      to="/progress"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white font-semibold transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      <span>Progresso & Badges</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white font-semibold transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      <span>Definições & Segurança</span>
                    </Link>

                    <div className="border-t border-slate-100 dark:border-[#1a1a1a] my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
};
