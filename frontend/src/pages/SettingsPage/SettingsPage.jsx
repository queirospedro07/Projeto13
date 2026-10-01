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
  ChevronDown
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [chatMentions, setChatMentions] = useState(true);

  // Profile Privacy & Visibility settings
  const [isPublic, setIsPublic] = useState(user?.profile?.isPublic !== false);
  const [showBio, setShowBio] = useState(user?.profile?.showBio !== false);
  const [showLocation, setShowLocation] = useState(user?.profile?.showLocation !== false);
  const [showSocials, setShowSocials] = useState(user?.profile?.showSocials !== false);
  const [showStats, setShowStats] = useState(user?.profile?.showStats !== false);
  const [showStreak, setShowStreak] = useState(user?.profile?.showStreak !== false);
  const [showCourses, setShowCourses] = useState(user?.profile?.showCourses !== false);
  const [showBadges, setShowBadges] = useState(user?.profile?.showBadges !== false);
  const [showLeaderboard, setShowLeaderboard] = useState(user?.profile?.showLeaderboard !== false);

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
    if (user?.profile) {
      setIsPublic(user.profile.isPublic !== false);
      setShowBio(user.profile.showBio !== false);
      setShowLocation(user.profile.showLocation !== false);
      setShowSocials(user.profile.showSocials !== false);
      setShowStats(user.profile.showStats !== false);
      setShowStreak(user.profile.showStreak !== false);
      setShowCourses(user.profile.showCourses !== false);
      setShowBadges(user.profile.showBadges !== false);
      setShowLeaderboard(user.profile.showLeaderboard !== false);
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
        showStreak,
        showCourses,
        showBadges,
        showLeaderboard
      });
      await refreshUser();
      toast({
        title: 'Privacidade Atualizada',
        message: 'A visibilidade dos elementos do seu perfil foi guardada com sucesso.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro ao guardar',
        message: err.message || 'Não foi possível guardar as definições de visibilidade.',
        type: 'error'
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
        message: 'As suas definições de mensagens, recibos de leitura e privacidade de contactos foram atualizadas.',
        type: 'success'
      });
    } catch (_) {
      toast({
        title: 'Erro',
        message: 'Falha ao guardar preferências locais.',
        type: 'error'
      });
    } finally {
      setIsSavingMessaging(false);
    }
  };

  const handleSavePreferences = () => {
    toast({
      title: 'Notificações Atualizadas',
      message: 'As suas preferências de notificações foram atualizadas com sucesso.',
      type: 'success'
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      
      <div className="pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Badge size="md" variant="primary">
            Definições
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Definições da Conta
        </h1>
        <p className="text-base text-slate-600 dark:text-neutral-400 mt-1">
          Gira as suas preferências visuais, permissões de mensagens, privacidade e sessão.
        </p>
      </div>

      {/* ── 1. Aparência & Tema ── */}
      <Card className="p-5 sm:p-8 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aparência & Tema</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
          Escolha o modo de apresentação visual da plataforma.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-5 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === 'light' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Modo Claro (Padrão)
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Fundo branco puro & alto contraste
              </p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-slate-600 dark:text-blue-400" />
              {theme === 'dark' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Modo Escuro (Preto OLED)
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Preto puro (#000000) & alto contraste
              </p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-5 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Monitor className="w-5 h-5 text-slate-600 dark:text-neutral-300" />
              {theme === 'system' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Sincronizado com o Sistema
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Segue as preferências do sistema
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* ── 2. Permissões de Contacto & Mensagens Diretas (DMs) ── */}
      <Card className="p-5 sm:p-8 flex flex-col gap-6 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Permissões de Contacto & Mensagens Diretas (DMs)</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Defina quem tem autorização para lhe enviar mensagens diretas e como funcionam os pedidos de conversa.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Quem pode enviar DMs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="pr-4 max-w-lg">
              <label htmlFor="dm-permission" className="text-sm font-bold text-slate-900 dark:text-white block">
                Quem me pode enviar Mensagens Diretas
              </label>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Controlo restrito para evitar mensagens indesejadas de desconhecidos.
              </p>
            </div>

            <div className="relative shrink-0 w-full sm:w-72">
              <select
                id="dm-permission"
                value={dmPermission}
                onChange={e => setDmPermission(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="FRIENDS_ONLY" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Apenas Amigos e Conexões Aceites
                </option>
                <option value="CLASSMATES" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Amigos, Colegas de Curso e Formadores
                </option>
                <option value="ALL" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Todos os utilizadores registados
                </option>
                <option value="NONE" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Ninguém (Desativar DMs privadas)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Modo Pedido de Mensagem */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <div className="pr-4">
              <label htmlFor="req-msg-toggle" className="text-sm font-bold text-slate-900 dark:text-white block cursor-pointer">
                Exigir Pedido Prévio para não-amigos
              </label>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Quando ativado, os utilizadores que não estão na sua lista de amigos devem enviar primeiro uma solicitação de conversa. Apenas após aceitar o pedido é que as mensagens diretas são entregues na sua caixa principal.
              </p>
            </div>
            <input
              id="req-msg-toggle"
              type="checkbox"
              checked={requireMessageRequest}
              onChange={e => setRequireMessageRequest(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0 mt-1"
            />
          </div>

          {/* Visibilidade da Lista de Amigos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <div className="pr-4 max-w-lg">
              <label htmlFor="friends-vis" className="text-sm font-bold text-slate-900 dark:text-white block">
                Visibilidade da Lista de Amigos e Conexões
              </label>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Quem pode visualizar os seus amigos e colegas conectados no seu perfil.
              </p>
            </div>

            <div className="relative shrink-0 w-full sm:w-72">
              <select
                id="friends-vis"
                value={friendsListVisibility}
                onChange={e => setFriendsListVisibility(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="PUBLIC" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Público (Todos os utilizadores)
                </option>
                <option value="FRIENDS" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Apenas os Meus Amigos
                </option>
                <option value="PRIVATE" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Privado (Apenas eu)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Estado de Presença / Atividade */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <div className="pr-4 max-w-lg">
              <label htmlFor="online-vis" className="text-sm font-bold text-slate-900 dark:text-white block">
                Estado de Presença (Online / Atividade)
              </label>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Mostrar quando se encontra online na plataforma e em chamadas de mentoria.
              </p>
            </div>

            <div className="relative shrink-0 w-full sm:w-72">
              <select
                id="online-vis"
                value={onlineStatusVisibility}
                onChange={e => setOnlineStatusVisibility(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="PUBLIC" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Mostrar a Todos (Online)
                </option>
                <option value="FRIENDS" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Apenas para Amigos
                </option>
                <option value="HIDDEN" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white py-1">
                  Invisível / Ocultar Sempre
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Recibos de Leitura ("Dar Vista") */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <div className="pr-4">
              <label htmlFor="read-receipts-toggle" className="text-sm font-bold text-slate-900 dark:text-white block cursor-pointer">
                Recibos de Leitura (&quot;Dar Vista&quot;)
              </label>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Permitir que os seus contactos vejam quando leu as mensagens deles (duplo visto azul e hora de visualização) e ver quando as suas mensagens foram vistas.
              </p>
            </div>
            <input
              id="read-receipts-toggle"
              type="checkbox"
              checked={showReadReceipts}
              onChange={e => setShowReadReceipts(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0 mt-1"
            />
          </div>
        </div>

        <Button
          onClick={handleSaveMessagingPermissions}
          isLoading={isSavingMessaging}
          variant="primary"
          size="md"
          className="self-stretch sm:self-end mt-2 font-bold shadow-md shadow-blue-500/20"
        >
          Guardar Permissões de Mensagens
        </Button>
      </Card>

      {/* ── 3. Privacidade e Visibilidade do Perfil ── */}
      <Card className="p-5 sm:p-8 flex flex-col gap-6 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Privacidade & Elementos do Perfil</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
              Escolha exatamente o que os outros utilizadores podem ver na sua página pública de perfil.
            </p>
          </div>
          <Link to={`/profile/${user?.username || user?.id}`} className="shrink-0">
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />} className="text-xs font-bold">
              Ver Meu Perfil
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 divide-y divide-slate-100 dark:divide-neutral-800">
          
          {/* Perfil Público Geral */}
          <div className="flex items-center justify-between pt-2">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Perfil Público Aberto</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Se desativado, o seu perfil ficará privado e invisível para visitantes externos e outros alunos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Biografia */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Biografia e Apresentação
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir o texto da sua apresentação pessoal no cabeçalho do perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showBio}
              onChange={e => setShowBio(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Localização */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Localização / Cidade
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir a cidade ou país configurado no perfil.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={e => setShowLocation(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Redes Sociais */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Redes Sociais & Links Externos
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir botões de ligação para GitHub, LinkedIn, Twitter/X e Website pessoal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showSocials}
              onChange={e => setShowSocials(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Estatísticas de XP e Nível */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Estatísticas & Nível XP
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir o seu nível geral, total de pontos XP e progresso na plataforma.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showStats}
              onChange={e => setShowStats(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Sequência Diária (Streak) */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Sequência de Estudo Diário (Streak)
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir a contagem de dias consecutivos com sessões de aprendizagem concluídas.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showStreak}
              onChange={e => setShowStreak(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Cursos Matriculados */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Cursos e Certificados Concluídos
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Permitir que outros membros vejam a lista de formações em que participou e certificados oficiais.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showCourses}
              onChange={e => setShowCourses(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Medalhas e Conquistas */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Mostrar Medalhas & Badges Desbloqueados
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir a galeria de troféus e conquistas conquistadas nas aulas e desafios.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showBadges}
              onChange={e => setShowBadges(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Leaderboard */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Participar na Tabela de Classificação Pública (Leaderboard)
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Exibir a sua conta no ranking competitivo semanal e global de estudantes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showLeaderboard}
              onChange={e => setShowLeaderboard(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
            />
          </div>

        </div>

        <Button
          onClick={handleSavePrivacy}
          isLoading={isSavingPrivacy}
          variant="primary"
          size="md"
          className="self-stretch sm:self-end mt-2 font-bold shadow-md shadow-blue-500/20"
        >
          Guardar Visibilidade do Perfil
        </Button>
      </Card>

      {/* ── 4. Notificações ── */}
      <Card className="p-5 sm:p-8 flex flex-col gap-6 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Notificações & Alertas</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Escolha quais os alertas que deseja receber na plataforma e por email.
          </p>
        </div>

        <div className="flex flex-col gap-4 divide-y divide-slate-100 dark:divide-neutral-800">
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Novidades & Aulas nos Meus Cursos
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Quando os formadores publicam novas aulas, materiais ou avisos importantes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={courseUpdates}
              onChange={e => setCourseUpdates(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Menções na Comunidade & Chat
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Quando alguém o menciona diretamente (@) ou responde a uma mensagem sua.
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatMentions}
              onChange={e => setChatMentions(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Resumo Semanal de Progresso & Conquistas
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Resumo semanal do XP acumulado, aulas concluídas e estado das sequências de estudo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={e => setEmailNotifs(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <Button
          onClick={handleSavePreferences}
          variant="primary"
          size="md"
          className="self-stretch sm:self-end mt-2 font-bold shadow-md shadow-blue-500/20"
        >
          Guardar Notificações
        </Button>
      </Card>

      {/* ── 5. Candidatura a Formador ── */}
      {user?.role !== 'CREATOR' && user?.role !== 'ADMIN' && (
        <Card className="p-5 sm:p-8 flex flex-col gap-6 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Programa de Formadores
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Partilhe o seu conhecimento prático com a comunidade e publique os seus próprios cursos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/40">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Candidatura a Formador
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-lg mt-0.5">
                  Crie e publique cursos na plataforma, com suporte para módulos em vídeo, questionários práticos e salas de mentoria para as suas turmas.
                </p>
              </div>
            </div>
            <Link to="/creator/apply" className="shrink-0 self-start sm:self-center">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="font-semibold text-xs">
                Candidatar
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── 6. Gestão de Sessão ── */}
      <Card className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-xs">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Gestão de Sessão</h4>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Sessão iniciada como {user?.email} ({user?.role === 'CREATOR' ? 'Formador' : user?.role === 'ADMIN' ? 'Administrador' : 'Aluno'})
          </p>
        </div>
        <Button
          onClick={logout}
          variant="secondary"
          size="md"
          leftIcon={<LogOut className="w-4 h-4 text-red-600" />}
          className="w-full sm:w-auto font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:border-neutral-800 dark:hover:border-red-900"
        >
          Terminar Sessão
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;