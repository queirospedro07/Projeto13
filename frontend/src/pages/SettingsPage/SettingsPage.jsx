import './SettingsPage.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Eye,
  Lock,
  Globe,
  MessageSquare,
  Users,
  Bell,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [emailNotifs, setEmailNotifs] = useState(() => {
    return localStorage.getItem(`nexo_notif_email_${user?.id}`) !== 'false';
  });
  const [courseUpdates, setCourseUpdates] = useState(() => {
    return localStorage.getItem(`nexo_notif_course_${user?.id}`) !== 'false';
  });
  const [chatMentions, setChatMentions] = useState(() => {
    return localStorage.getItem(`nexo_notif_mentions_${user?.id}`) !== 'false';
  });

  // Profile Privacy & Visibility settings
  const [isPublic, setIsPublic] = useState(user?.profile?.isPublic !== false);
  const [showBio, setShowBio] = useState(user?.profile?.showBio !== false);
  const [showLocation, setShowLocation] = useState(user?.profile?.showLocation !== false);
  const [showSocials, setShowSocials] = useState(user?.profile?.showSocials !== false);
  const [showStats, setShowStats] = useState(user?.profile?.showStats !== false);
  const [showCourses, setShowCourses] = useState(user?.profile?.showCourses !== false);

  // Direct Messages & Permissions settings
  const [dmPermission, setDmPermission] = useState(() => {
    return localStorage.getItem(`nexo_dm_permission_${user?.id}`) || 'FRIENDS_ONLY';
  });
  const [requireMessageRequest, setRequireMessageRequest] = useState(() => {
    return localStorage.getItem(`nexo_msg_request_${user?.id}`) !== 'false';
  });
  const [friendsListVisibility, setFriendsListVisibility] = useState(() => {
    return localStorage.getItem(`nexo_friends_visibility_${user?.id}`) || 'FRIENDS';
  });
  const [onlineStatusVisibility, setOnlineStatusVisibility] = useState(() => {
    return localStorage.getItem(`nexo_online_visibility_${user?.id}`) || 'PUBLIC';
  });
  const [showReadReceipts, setShowReadReceipts] = useState(() => {
    return localStorage.getItem(`nexo_read_receipts_${user?.id}`) !== 'false';
  });

  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingMessaging, setIsSavingMessaging] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setDmPermission(localStorage.getItem(`nexo_dm_permission_${user.id}`) || 'FRIENDS_ONLY');
      setRequireMessageRequest(localStorage.getItem(`nexo_msg_request_${user.id}`) !== 'false');
      setFriendsListVisibility(
        localStorage.getItem(`nexo_friends_visibility_${user.id}`) || 'FRIENDS',
      );
      setOnlineStatusVisibility(
        localStorage.getItem(`nexo_online_visibility_${user.id}`) || 'PUBLIC',
      );
      setShowReadReceipts(localStorage.getItem(`nexo_read_receipts_${user.id}`) !== 'false');
      setEmailNotifs(localStorage.getItem(`nexo_notif_email_${user.id}`) !== 'false');
      setCourseUpdates(localStorage.getItem(`nexo_notif_course_${user.id}`) !== 'false');
      setChatMentions(localStorage.getItem(`nexo_notif_mentions_${user.id}`) !== 'false');
    }
    if (user?.profile) {
      setIsPublic(user.profile.isPublic !== false);
      setShowBio(user.profile.showBio !== false);
      setShowLocation(user.profile.showLocation !== false);
      setShowSocials(user.profile.showSocials !== false);
      setShowStats(user.profile.showStats !== false);
      setShowCourses(user.profile.showCourses !== false);
    }
  }, [user]);

  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    try {
      await api.updateProfile({
        isPublic,
        showBio,
        showLocation,
        showSocials,
        showStats,
        showCourses,
      });
      await refreshUser();
      toast({
        title: 'Privacidade Atualizada',
        message: 'A visibilidade dos elementos do seu perfil foi guardada com sucesso.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erro ao guardar',
        message: err.message || 'Não foi possível guardar as definições de visibilidade.',
        type: 'error',
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleSaveMessagingPermissions = () => {
    setIsSavingMessaging(true);
    try {
      if (user?.id) {
        localStorage.setItem(`nexo_dm_permission_${user.id}`, dmPermission);
        localStorage.setItem(`nexo_msg_request_${user.id}`, String(requireMessageRequest));
        localStorage.setItem(`nexo_friends_visibility_${user.id}`, friendsListVisibility);
        localStorage.setItem(`nexo_online_visibility_${user.id}`, onlineStatusVisibility);
        localStorage.setItem(`nexo_read_receipts_${user.id}`, String(showReadReceipts));
      }
      toast({
        title: 'Permissões Guardadas',
        message:
          'As suas definições de mensagens, recibos de leitura e privacidade de contactos foram atualizadas.',
        type: 'success',
      });
    } catch (_) {
      toast({
        title: 'Erro',
        message: 'Falha ao guardar preferências locais.',
        type: 'error',
      });
    } finally {
      setIsSavingMessaging(false);
    }
  };

  const handleSavePreferences = () => {
    if (user?.id) {
      localStorage.setItem(`nexo_notif_email_${user.id}`, String(emailNotifs));
      localStorage.setItem(`nexo_notif_course_${user.id}`, String(courseUpdates));
      localStorage.setItem(`nexo_notif_mentions_${user.id}`, String(chatMentions));
    }
    toast({
      title: 'Notificações Atualizadas',
      message: 'As suas preferências de notificações foram atualizadas com sucesso.',
      type: 'success',
    });
  };

  return (
    <div className="settings-page-panel">
      <div className="settings-page-panel-2">
        <div className="settings-page-panel-3">
          <Badge size="md" variant="primary">
            Definições
          </Badge>
        </div>
        <h1 className="settings-page-title">Definições da Conta</h1>
        <p className="settings-page-description">
          Gira as suas preferências visuais, permissões de mensagens, privacidade e sessão.
        </p>
      </div>

      {/* 1. Aparência & Tema */}
      <Card className="settings-page-card">
        <h3 className="settings-page-subheading">Aparência & Tema</h3>
        <p className="settings-page-description-2">
          Escolha o modo de apresentação visual da plataforma.
        </p>

        <div className="settings-page-panel-4">
          <button
            onClick={() => setTheme('light')}
            className={`settings-page-button ${
              theme === 'light' ? 'settings-page-button-2' : 'settings-page-button-3'
            }`}
          >
            <div className="settings-page-panel-5">
              <Sun className="settings-page-sun" />
              {theme === 'light' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Modo Claro (Padrão)</p>
              <p className="settings-page-description-4">Fundo branco puro & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`settings-page-button ${
              theme === 'dark' ? 'settings-page-button-2' : 'settings-page-button-3'
            }`}
          >
            <div className="settings-page-panel-5">
              <Moon className="settings-page-moon" />
              {theme === 'dark' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Modo Escuro (Preto OLED)</p>
              <p className="settings-page-description-4">Preto puro (#000000) & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`settings-page-button ${
              theme === 'system' ? 'settings-page-button-2' : 'settings-page-button-3'
            }`}
          >
            <div className="settings-page-panel-5">
              <Monitor className="settings-page-monitor" />
              {theme === 'system' && <Check className="settings-page-check" />}
            </div>
            <div>
              <p className="settings-page-description-3">Sincronizado com o Sistema</p>
              <p className="settings-page-description-4">Segue as preferências do sistema</p>
            </div>
          </button>
        </div>
      </Card>

      {/* 2. Permissões de Contacto & Mensagens Diretas (DMs) */}
      <Card className="settings-page-card-2">
        <div className="settings-page-panel-6">
          <h3 className="settings-page-subheading-2">
            <MessageSquare className="settings-page-check" />
            <span>Permissões de Contacto & Mensagens Diretas (DMs)</span>
          </h3>
          <p className="settings-page-description-5">
            Defina quem tem autorização para lhe enviar mensagens diretas e como funcionam os
            pedidos de conversa.
          </p>
        </div>

        <div className="settings-page-panel-7">
          {/* Quem pode enviar DMs */}
          <div className="settings-page-panel-8">
            <div className="settings-page-panel-9">
              <label htmlFor="dm-permission" className="settings-page-field-label">
                Quem me pode enviar Mensagens Diretas
              </label>
              <p className="settings-page-description-6">
                Controlo restrito para evitar mensagens indesejadas de desconhecidos.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Select
                id="dm-permission"
                value={dmPermission}
                onChange={(e) => setDmPermission(e.target.value)}
                className="settings-page-select"
              >
                <option value="FRIENDS_ONLY" className="settings-page-option">
                  Apenas Amigos e Conexões Aceites
                </option>
                <option value="CLASSMATES" className="settings-page-option">
                  Amigos, Colegas de Curso e Formadores
                </option>
                <option value="ALL" className="settings-page-option">
                  Todos os utilizadores registados
                </option>
                <option value="NONE" className="settings-page-option">
                  Ninguém (Desativar DMs privadas)
                </option>
              </Select>
            </div>
          </div>

          {/* Modo Pedido de Mensagem */}
          <div className="settings-page-panel-11">
            <div className="settings-page-panel-12">
              <label htmlFor="req-msg-toggle" className="settings-page-field-label-2">
                Exigir Pedido Prévio para não-amigos
              </label>
              <p className="settings-page-description-6">
                Quando ativado, os utilizadores que não estão na sua lista de amigos devem enviar
                primeiro uma solicitação de conversa. Apenas após aceitar o pedido é que as
                mensagens diretas são entregues na sua caixa principal.
              </p>
            </div>
            <input
              id="req-msg-toggle"
              type="checkbox"
              checked={requireMessageRequest}
              onChange={(e) => setRequireMessageRequest(e.target.checked)}
              className="settings-page-field"
            />
          </div>

          {/* Visibilidade da Lista de Amigos */}
          <div className="settings-page-panel-13">
            <div className="settings-page-panel-9">
              <label htmlFor="friends-vis" className="settings-page-field-label">
                Visibilidade da Lista de Amigos e Conexões
              </label>
              <p className="settings-page-description-6">
                Quem pode visualizar os seus amigos e colegas conectados no seu perfil.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Select
                id="friends-vis"
                value={friendsListVisibility}
                onChange={(e) => setFriendsListVisibility(e.target.value)}
                className="settings-page-select"
              >
                <option value="PUBLIC" className="settings-page-option">
                  Público (Todos os utilizadores)
                </option>
                <option value="FRIENDS" className="settings-page-option">
                  Apenas os Meus Amigos
                </option>
                <option value="PRIVATE" className="settings-page-option">
                  Privado (Apenas eu)
                </option>
              </Select>
            </div>
          </div>

          {/* Estado de Presença / Atividade */}
          <div className="settings-page-panel-13">
            <div className="settings-page-panel-9">
              <label htmlFor="online-vis" className="settings-page-field-label">
                Estado de Presença (Online / Atividade)
              </label>
              <p className="settings-page-description-6">
                Mostrar quando se encontra online na plataforma e em chamadas de mentoria.
              </p>
            </div>

            <div className="settings-page-panel-10">
              <Select
                id="online-vis"
                value={onlineStatusVisibility}
                onChange={(e) => setOnlineStatusVisibility(e.target.value)}
                className="settings-page-select"
              >
                <option value="PUBLIC" className="settings-page-option">
                  Mostrar a Todos (Online)
                </option>
                <option value="FRIENDS" className="settings-page-option">
                  Apenas para Amigos
                </option>
                <option value="HIDDEN" className="settings-page-option">
                  Invisível / Ocultar Sempre
                </option>
              </Select>
            </div>
          </div>

          {/* Recibos de Leitura ("Dar Vista") */}
          <div className="settings-page-panel-11">
            <div className="settings-page-panel-12">
              <label htmlFor="read-receipts-toggle" className="settings-page-field-label-2">
                Recibos de Leitura (&quot;Dar Vista&quot;)
              </label>
              <p className="settings-page-description-6">
                Permitir que os seus contactos vejam quando leu as mensagens deles (duplo visto azul
                e hora de visualização) e ver quando as suas mensagens foram vistas.
              </p>
            </div>
            <input
              id="read-receipts-toggle"
              type="checkbox"
              checked={showReadReceipts}
              onChange={(e) => setShowReadReceipts(e.target.checked)}
              className="settings-page-field"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveMessagingPermissions}
          isLoading={isSavingMessaging}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Permissões de Mensagens
        </Button>
      </Card>

      {/* 3. Privacidade e Visibilidade do Perfil */}
      <Card className="settings-page-card-2">
        <div className="settings-page-panel-14">
          <div>
            <h3 className="settings-page-subheading-2">
              <ShieldCheck className="settings-page-check" />
              <span>Privacidade & Elementos do Perfil</span>
            </h3>
            <p className="settings-page-description-5">
              Escolha exatamente o que os outros utilizadores podem ver na sua página pública de
              perfil.
            </p>
          </div>
          <Link to={`/profile/${user?.username || user?.id}`} className="settings-page-link">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="settings-page-eye" />}
              className="settings-page-button-5"
            >
              Ver Meu Perfil
            </Button>
          </Link>
        </div>

        <div className="settings-page-panel-15">
          {/* Perfil Público Geral */}
          <div className="settings-page-panel-16">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-7">
                <Globe className="settings-page-globe" />
                <span>Perfil Público Aberto</span>
              </p>
              <p className="settings-page-description-4">
                Se desativado, o seu perfil ficará privado e invisível para visitantes externos e
                outros alunos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Biografia */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Biografia e Apresentação</p>
              <p className="settings-page-description-4">
                Exibir o texto da sua apresentação pessoal no cabeçalho do perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showBio}
              onChange={(e) => setShowBio(e.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Localização */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Localização / Cidade</p>
              <p className="settings-page-description-4">
                Exibir a cidade ou país configurado no perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Redes Sociais */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">Mostrar Redes Sociais & Links Externos</p>
              <p className="settings-page-description-4">
                Exibir botões de ligação para GitHub, LinkedIn, Twitter/X e Website pessoal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showSocials}
              onChange={(e) => setShowSocials(e.target.checked)}
              className="settings-page-field-2"
            />
          </div>

          {/* Cursos Matriculados */}
          <div className="settings-page-panel-17">
            <div className="settings-page-panel-12">
              <p className="settings-page-description-8">
                Mostrar Cursos e Certificados Concluídos
              </p>
              <p className="settings-page-description-4">
                Permitir que outros membros vejam a lista de formações em que participou e
                certificados oficiais.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showCourses}
              onChange={(e) => setShowCourses(e.target.checked)}
              className="settings-page-field-2"
            />
          </div>
        </div>

        <Button
          onClick={handleSavePrivacy}
          isLoading={isSavingPrivacy}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Visibilidade do Perfil
        </Button>
      </Card>

      {/* 4. Notificações */}
      <Card className="settings-page-card-2">
        <div>
          <h3 className="settings-page-subheading-3">
            <Bell className="settings-page-bell" />
            <span>Notificações & Alertas</span>
          </h3>
          <p className="settings-page-description-9">
            Escolha quais os alertas que deseja receber na plataforma e por email.
          </p>
        </div>

        <div className="settings-page-panel-15">
          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Novidades & Aulas nos Meus Cursos</p>
              <p className="settings-page-description-4">
                Quando os formadores publicam novas aulas, materiais ou avisos importantes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={courseUpdates}
              onChange={(e) => setCourseUpdates(e.target.checked)}
              className="settings-page-field-3"
            />
          </div>

          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Menções na Comunidade & Chat</p>
              <p className="settings-page-description-4">
                Quando alguém o menciona diretamente (@) ou responde a uma mensagem sua.
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatMentions}
              onChange={(e) => setChatMentions(e.target.checked)}
              className="settings-page-field-3"
            />
          </div>

          <div className="settings-page-panel-17">
            <div>
              <p className="settings-page-description-8">Resumo Semanal de Progresso</p>
              <p className="settings-page-description-4">
                Resumo semanal das aulas concluídas e estado das sequências de estudo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="settings-page-field-3"
            />
          </div>
        </div>

        <Button
          onClick={handleSavePreferences}
          variant="primary"
          size="md"
          className="settings-page-button-4"
        >
          Guardar Notificações
        </Button>
      </Card>

      {/* 5. Candidatura a Formador */}
      {user?.role !== 'CREATOR' && user?.role !== 'ADMIN' && (
        <Card className="settings-page-card-2">
          <div>
            <h3 className="settings-page-subheading">Programa de Formadores</h3>
            <p className="settings-page-description-9">
              Partilhe o seu conhecimento prático com a comunidade e publique os seus próprios
              cursos.
            </p>
          </div>

          <div className="settings-page-panel-18">
            <div className="settings-page-panel-19">
              <div className="settings-page-panel-20">
                <Sparkles className="settings-page-sparkles" />
              </div>
              <div>
                <p className="settings-page-description-8">Candidatura a Formador</p>
                <p className="settings-page-description-10">
                  Crie e publique cursos na plataforma, com suporte para módulos em vídeo,
                  questionários práticos e salas de mentoria para as suas turmas.
                </p>
              </div>
            </div>
            <Link to="/creator/apply" className="settings-page-link-2">
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="settings-page-arrow-right" />}
                className="settings-page-button-6"
              >
                Candidatar
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 6. Gestão de Sessão */}
      <Card className="settings-page-card-3">
        <div>
          <h4 className="settings-page-caption">Gestão de Sessão</h4>
          <p className="settings-page-description-5">
            Sessão iniciada como {user?.email} (
            {user?.role === 'CREATOR'
              ? 'Formador'
              : user?.role === 'ADMIN'
                ? 'Administrador & Formador'
                : 'Aluno'}
            )
          </p>
        </div>
        <Button
          onClick={logout}
          variant="secondary"
          size="md"
          leftIcon={<LogOut className="settings-page-log-out" />}
          className="settings-page-button-7"
        >
          Terminar Sessão
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
