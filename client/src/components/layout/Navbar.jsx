import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  User as UserIcon
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
  const homeTarget = user ? (isCreator ? '/creator' : '/dashboard') : '/';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 h-16 transition-colors shadow-xs">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 shrink-0">
          <Link to={homeTarget} className="flex items-center gap-2.5 group select-none">
            <Logo size="md" showText={false} />
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white font-sans">
              LearnSpace
            </span>
          </Link>

          <Link
            to="/explore"
            className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Explorar Cursos
          </Link>

          {user && (
            <Link
              to="/messages"
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Mensagens & Chamadas</span>
            </Link>
          )}
        </div>

        <div className="flex-1 max-w-md mx-2 sm:mx-6 flex justify-center">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
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

          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-bold text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white rounded-xl transition-colors"
              >
                Iniciar Sessão
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Criar Conta</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isCreator && (
                <Link
                  to="/creator/courses/new"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Curso</span>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer"
                >
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" status="online" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] rounded-2xl shadow-2xl p-2 z-50 text-sm animate-fade-in flex flex-col gap-1">
                    <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl mb-1 flex items-center gap-2.5">
                      <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase">
                          {isCreator ? 'Criador' : user.role === 'ADMIN' ? 'Admin' : 'Aluno'}
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
                      <Link
                        to="/library"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#141414] text-slate-700 dark:text-zinc-300 font-semibold text-xs"
                      >
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Os Meus Cursos</span>
                      </Link>
                    )}

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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;