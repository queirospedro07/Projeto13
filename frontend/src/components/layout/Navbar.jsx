import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Plus,
  BookOpen,
  Settings,
  Sun,
  Moon,
  Monitor,
  BarChart3,
  ArrowRight,
  MessageSquare,
  User as UserIcon,
  Sparkles,
  Shield,
  Search,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { useToast } from '../ui/Toast';
import { GlobalSearch } from './GlobalSearch';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    toast({
      title: 'Sessão Encerrada',
      message: 'Desconectado com sucesso da plataforma.',
      type: 'info'
    });
    navigate('/login');
  };

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMIN';
  const isPublicHome = !user && location.pathname === '/';
  const homeTarget = user ? (isCreator ? '/creator' : '/dashboard') : '/';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/95 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200/90 dark:border-neutral-900 transition-colors shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">

          {/* ── Left ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to="/" className="flex items-center gap-2 group select-none mr-1 sm:mr-2">
              <Logo size="md" showText={true} />
            </Link>

          </div>

          {/* ── Center search — visible sm+ for all, hidden on mobile ── */}
          {isPublicHome ? (
            <nav aria-label="Navegação principal" className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-slate-600 lg:flex">
              <a href="#vantagens" className="transition-colors hover:text-slate-950">A plataforma</a>
              <a href="#formacao" className="transition-colors hover:text-slate-950">Formações</a>
              <a href="#faq" className="transition-colors hover:text-slate-950">Perguntas</a>
            </nav>
          ) : (
            <div className="mx-2 hidden max-w-md flex-1 justify-center sm:mx-4 sm:flex">
              <GlobalSearch />
            </div>
          )}

          {/* ── Right ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Mobile search toggle — only for authenticated users on small screens */}
            {user && (
              <button
                onClick={() => setShowMobileSearch(v => !v)}
                className="sm:hidden p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Pesquisar"
                aria-label="Abrir pesquisa"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {!isPublicHome && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
                aria-label="Alternar tema"
                title="Alternar Tema"
              >
                {theme === 'system' ? (
                  <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : actualTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </button>
            )}

            {!user ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-neutral-200 hover:text-black dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors whitespace-nowrap"
                >
                  Iniciar Sessão
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-lg shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border border-slate-900 dark:border-white"
                >
                  <span>Criar Conta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {isCreator && (
                  <Link
                    to="/creator/courses/new"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-950 text-white text-xs font-semibold shadow-xs transition-all border border-slate-900 dark:border-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Curso</span>
                  </Link>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer"
                    aria-label={`Abrir menu de ${user.name}`}
                    aria-expanded={showProfileMenu}
                  >
                    <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" role={user.role} />
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-2xl shadow-2xl p-2 z-50 text-sm animate-fade-in flex flex-col gap-1">

                        {/* User card */}
                        <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl mb-1 flex items-center gap-2.5">
                          <Avatar src={user.avatarUrl} name={user.name} size="sm" role={user.role} />
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                              {user.email}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isAdmin
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : isCreator
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}>
                              {isCreator ? 'Formador' : isAdmin ? 'Admin' : 'Aluno'}
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                        >
                          <UserIcon className="w-4 h-4 text-indigo-500" />
                          <span>O Meu Perfil</span>
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>Mensagens & Chamadas</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-200/50 dark:border-amber-800/40 my-0.5"
                          >
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span>Painel de Administração</span>
                          </Link>
                        )}

                        {isCreator ? (
                          <Link
                            to="/creator"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            <span>Painel do Criador</span>
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/library"
                              onClick={() => setShowProfileMenu(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                            >
                              <BookOpen className="w-4 h-4 text-blue-500" />
                              <span>Os Meus Cursos</span>
                            </Link>

                            {!isAdmin && !isCreator && (
                              <Link
                                to="/creator/apply"
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-200/50 dark:border-indigo-800/40 my-0.5"
                              >
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span>Candidatura a Formador</span>
                              </Link>
                            )}
                          </>
                        )}

                        <Link
                          to="/help"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                        >
                          <HelpCircle className="w-4 h-4 text-blue-500" />
                          <span>Ajuda & Suporte</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Definições da Conta</span>
                        </Link>

                        <div className="border-t border-slate-100 dark:border-[#1a1a1a] my-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Terminar Sessão</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile search drawer (slides in below header) ── */}
        {showMobileSearch && (
          <div className="sm:hidden border-t border-slate-200 dark:border-neutral-800 px-4 py-3 bg-white/98 dark:bg-[#06070a]/98 animate-fade-in">
            <GlobalSearch onClose={() => setShowMobileSearch(false)} />
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
