import './Navbar.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuLogOut as LogOut,
  LuPlus as Plus,
  LuBookOpen as BookOpen,
  LuSettings as Settings,
  LuSun as Sun,
  LuMoon as Moon,
  LuMonitor as Monitor,
  LuChartNoAxesColumn as BarChart3,
  LuArrowRight as ArrowRight,
  LuMessageSquare as MessageSquare,
  LuUser as UserIcon,
  LuSparkles as Sparkles,
  LuShield as Shield,
  LuSearch as Search,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../Avatar';
import { Logo } from '../Logo';
import { useToast } from '../Toast';
import { GlobalSearch } from '../GlobalSearch';
export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, actualTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    toast({
      title: 'Sessão Encerrada',
      message: 'Desconectado com sucesso da plataforma.',
      type: 'info',
    });
    navigate('/login');
  };
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const homeTarget = user ? (isAdmin ? '/admin' : isCreator ? '/creator' : '/dashboard') : '/';
  return (
    <>
      <header className="navbar-header app-navbar">
        <div className="navbar-panel">
          {/* Logótipo */}
          <div className="navbar-panel-2">
            <Link to={homeTarget} className="navbar-link ui-group">
              <Logo size="md" showText={true} />
            </Link>
          </div>

          {/* Barra de pesquisa central */}
          <div className="navbar-panel-3">
            <GlobalSearch />
          </div>

          {/* Ações à direita */}
          <div className="navbar-panel-2">
            {/* Botão de pesquisa para mobile */}
            {user && (
              <button
                onClick={() => setShowMobileSearch((v) => !v)}
                className="navbar-button"
                title="Pesquisar"
                aria-label="Abrir pesquisa"
              >
                <Search className="navbar-search" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="navbar-button-2"
              aria-label="Alternar tema"
              title="Alternar Tema"
            >
              {theme === 'system' ? (
                <Monitor className="navbar-monitor" />
              ) : actualTheme === 'dark' ? (
                <Moon className="navbar-moon" />
              ) : (
                <Sun className="navbar-sun" />
              )}
            </button>

            {!user ? (
              <div className="navbar-panel-4">
                <Link to="/login" className="navbar-link-2">
                  Iniciar Sessão
                </Link>
                <Link to="/register" className="navbar-link-3">
                  <span>Criar Conta</span>
                  <ArrowRight className="navbar-arrow-right" />
                </Link>
              </div>
            ) : (
              <div className="navbar-panel-5">
                {isCreator && (
                  <Link to="/creator/courses/new" className="navbar-link-4">
                    <Plus className="navbar-search" />
                    <span>Novo Curso</span>
                  </Link>
                )}

                <div className="navbar-panel-6">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="navbar-button-3"
                    aria-label={`Abrir menu de ${user.name}`}
                    aria-expanded={showProfileMenu}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="sm"
                      status="online"
                      role={user.role}
                    />
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="navbar-panel-7" onClick={() => setShowProfileMenu(false)} />
                      <div className="navbar-panel-8">
                        {/* User card */}
                        <div className="navbar-panel-9">
                          <Avatar
                            src={user.avatarUrl}
                            name={user.name}
                            size="sm"
                            role={user.role}
                          />
                          <div className="navbar-panel-10">
                            <p className="navbar-description">{user.name}</p>
                            <p className="navbar-description-2">{user.email}</p>
                            <span
                              className={`navbar-label ${isAdmin ? 'navbar-label-2' : isCreator ? 'navbar-label-3' : 'navbar-label-4'}`}
                            >
                              {isAdmin ? 'Admin & Formador' : isCreator ? 'Formador' : 'Aluno'}
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="navbar-link-5"
                        >
                          <UserIcon className="navbar-user-icon" />
                          <span>O Meu Perfil</span>
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setShowProfileMenu(false)}
                          className="navbar-link-5"
                        >
                          <MessageSquare className="navbar-message-square" />
                          <span>Mensagens & Chamadas</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="navbar-link-6"
                          >
                            <Shield className="navbar-sun" />
                            <span>Painel de Administração</span>
                          </Link>
                        )}

                        {isCreator && (
                          <Link
                            to="/creator"
                            onClick={() => setShowProfileMenu(false)}
                            className="navbar-link-5"
                          >
                            <BarChart3 className="navbar-message-square" />
                            <span>Painel do Criador</span>
                          </Link>
                        )}

                        <Link
                          to="/library"
                          onClick={() => setShowProfileMenu(false)}
                          className="navbar-link-5"
                        >
                          <BookOpen className="navbar-message-square" />
                          <span>Os Meus Cursos</span>
                        </Link>

                        {!isAdmin && user?.role !== 'CREATOR' && (
                          <Link
                            to="/creator/apply"
                            onClick={() => setShowProfileMenu(false)}
                            className="navbar-link-7"
                          >
                            <Sparkles className="navbar-user-icon" />
                            <span>Candidatura a Formador</span>
                          </Link>
                        )}

                        <Link
                          to="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="navbar-link-5"
                        >
                          <Settings className="navbar-settings" />
                          <span>Definições da Conta</span>
                        </Link>

                        <div className="navbar-panel-11" />

                        <button onClick={handleLogout} className="navbar-button-4">
                          <LogOut className="navbar-search" />
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

        {/* Pesquisa em mobile */}
        {showMobileSearch && (
          <div className="navbar-panel-12 navbar-mobile-search-surface">
            <GlobalSearch onClose={() => setShowMobileSearch(false)} />
          </div>
        )}
      </header>
    </>
  );
};
export default Navbar;
