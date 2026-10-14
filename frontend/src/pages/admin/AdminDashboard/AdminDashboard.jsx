import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Search,
  Check,
  X,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';
import { formatCoursePrice, formatCategory, formatLessonType } from '../../../utils/formatters';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);

  // Navegação
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros - Candidaturas
  const [appFilter, setAppFilter] = useState('PENDING');
  const [appSearch, setAppSearch] = useState('');

  // Filtros - Cursos
  const [courseFilter, setCourseFilter] = useState('PENDING');
  const [courseSearch, setCourseSearch] = useState('');

  // Filtros - Utilizadores
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Modais
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState(null); // 'app' | 'course'
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchAdminData = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [statsData, usersData, appsData, coursesData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminCreatorApplications(),
        api.getAdminCourses('all'),
      ]);
      setStats(statsData || null);
      setUsers(usersData || []);
      setApplications(appsData || []);
      setCourses(coursesData || []);
      if (manual) {
        toast({ title: 'Atualizado', message: 'Dados sincronizados com sucesso.', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', message: 'Não foi possível carregar os dados.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Suspender / Reativar
  const handleToggleSuspend = async (userId) => {
    try {
      const res = await api.toggleSuspendUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: res.isSuspended } : u))
      );
      toast({
        title: res.isSuspended ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        message: res.isSuspended ? 'A conta foi temporariamente bloqueada.' : 'A conta está agora ativa.',
        type: res.isSuspended ? 'error' : 'success',
      });
    } catch (err) {
      toast({ title: 'Erro', message: err.message || 'Falha ao alterar estado.', type: 'error' });
    }
  };

  // Aprovar candidatura
  const handleApproveApplication = async (appId) => {
    setActionLoading(true);
    try {
      await api.approveCreatorApplication(appId);
      toast({
        title: 'Candidatura Aprovada',
        message: 'O utilizador agora é Formador e pode publicar cursos.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err) {
      toast({ title: 'Erro', message: err.message || 'Não foi possível aprovar.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar rejeição da candidatura
  const handleConfirmRejectApplication = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await api.rejectCreatorApplication(selectedApp.id, rejectFeedback);
      toast({ title: 'Candidatura Rejeitada', message: 'Feedback registado.', type: 'info' });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedApp(null);
      fetchAdminData();
    } catch (err) {
      toast({ title: 'Erro', message: err.message || 'Falha ao rejeitar.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Aprovar curso
  const handleApproveCourse = async (courseId) => {
    setActionLoading(true);
    try {
      await api.approveCourse(courseId);
      toast({
        title: 'Curso Aprovado',
        message: 'O curso já está visível para todos os alunos.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedCourseDetail?.id === courseId) setSelectedCourseDetail(null);
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (err) {
      toast({ title: 'Erro', message: err.message || 'Falha ao aprovar curso.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar rejeição do curso
  const handleConfirmRejectCourse = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    try {
      await api.rejectCourse(selectedCourse.id, rejectFeedback);
      toast({ title: 'Alterações Solicitadas', message: 'Feedback enviado ao formador.', type: 'info' });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedCourseDetail(null);
      setSelectedCourse(null);
      fetchAdminData();
    } catch (err) {
      toast({ title: 'Erro', message: err.message || 'Falha ao rejeitar curso.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Ver currículo do curso
  const handleOpenCourseReview = async (course) => {
    setSelectedCourseDetail(course);
    setCourseDetailLoading(true);
    try {
      const details = await api.getCourse(course.id);
      setSelectedCourseDetail(details);
    } catch (err) {
      toast({ title: 'Erro', message: 'Não foi possível carregar o currículo.', type: 'error' });
    } finally {
      setCourseDetailLoading(false);
    }
  };

  // Contagens
  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const pendingCourses = courses.filter((c) => c.approvalStatus === 'PENDING');

  // Filtros em memória
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus = appFilter === 'ALL' || app.status === appFilter;
      const q = appSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (app.fullName && app.fullName.toLowerCase().includes(q)) ||
        (app.expertise && app.expertise.toLowerCase().includes(q)) ||
        (app.user?.username && app.user.username.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [applications, appFilter, appSearch]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchStatus = courseFilter === 'ALL' || course.approvalStatus === courseFilter;
      const q = courseSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (course.title && course.title.toLowerCase().includes(q)) ||
        (course.creator?.name && course.creator.name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [courses, courseFilter, courseSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q));
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === 'ALL'
          ? true
          : userStatusFilter === 'SUSPENDED'
          ? u.isSuspended
          : !u.isSuspended;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16 px-4 sm:px-6">
      {/* ── HEADER SÓBRIO & PROFISSIONAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel de Administração
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Gestão de utilizadores, moderação de cursos e análise de candidaturas a formador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchAdminData(true)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            className="cursor-pointer text-xs font-semibold"
          >
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* ── NAVEGAÇÃO ENTRE ABAS (ESTILO SEGMENTADO CLEAN) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Visão Geral', count: null },
          { id: 'applications', label: 'Candidaturas a Formador', count: pendingApps.length },
          { id: 'courses', label: 'Moderação de Cursos', count: pendingCourses.length },
          { id: 'users', label: 'Utilizadores', count: users.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  tab.id === 'applications' || tab.id === 'courses'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 1. VISÃO GERAL ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('users')}
              className="p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Utilizadores</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{users.length}</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {users.filter((u) => u.role === 'CREATOR').length} formadores • {users.filter((u) => u.role === 'STUDENT').length} alunos
              </div>
            </div>

            <div
              onClick={() => setActiveTab('courses')}
              className="p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Cursos Registados</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{courses.length}</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {pendingCourses.length > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {pendingCourses.length} a aguardar aprovação
                  </span>
                ) : (
                  'Todos aprovados'
                )}
              </div>
            </div>

            <div
              onClick={() => setActiveTab('applications')}
              className="p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Candidaturas a Formador</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{applications.length}</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                {pendingApps.length > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {pendingApps.length} pendente(s)
                  </span>
                ) : (
                  'Nenhuma pendente'
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60">
              <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Inscrições Ativas</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                {stats?.totalEnrollments || 1}
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Matrículas de alunos</div>
            </div>
          </div>

          {/* Tarefas Pendentes de Atenção */}
          {(pendingApps.length > 0 || pendingCourses.length > 0) && (
            <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Itens a aguardar a sua revisão</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {pendingApps.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {pendingApps.length} Candidatura(s) a Formador
                      </div>
                      <div className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        Alunos a aguardar autorização de estúdio.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('applications')}
                      className="cursor-pointer text-xs"
                    >
                      Rever
                    </Button>
                  </div>
                )}

                {pendingCourses.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {pendingCourses.length} Curso(s) Submetido(s)
                      </div>
                      <div className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        Aulas prontas para validação curricular.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('courses')}
                      className="cursor-pointer text-xs"
                    >
                      Moderar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duas colunas com resumos rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilizadores Recentes */}
            <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimos Utilizadores Registados</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatarUrl} name={u.name} role={u.role} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</div>
                        <div className="text-slate-500 dark:text-neutral-400 text-[11px] font-mono truncate">{u.email}</div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={u.role === 'ADMIN' ? 'error' : u.role === 'CREATOR' ? 'primary' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {u.role === 'ADMIN' ? 'Admin' : u.role === 'CREATOR' ? 'Formador' : 'Aluno'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursos Recentes */}
            <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cursos na Plataforma</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                {courses.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-800 shrink-0">
                        <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{c.title}</div>
                        <div className="text-slate-500 dark:text-neutral-400 text-[11px]">
                          {c.creator?.name || 'Formador'} • {formatCoursePrice(c)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={c.approvalStatus === 'APPROVED' ? 'success' : c.approvalStatus === 'REJECTED' ? 'error' : 'warning'}
                      className="text-[10px] shrink-0"
                    >
                      {c.approvalStatus === 'APPROVED' ? 'Aprovado' : c.approvalStatus === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. CANDIDATURAS A FORMADOR ── */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ['PENDING', `Pendentes (${pendingApps.length})`],
                ['APPROVED', 'Aprovadas'],
                ['REJECTED', 'Rejeitadas'],
                ['ALL', 'Todas'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAppFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    appFilter === status
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Pesquisar candidato..."
                className="w-full bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 text-sm">
              Nenhuma candidatura encontrada neste filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <Avatar src={app.user?.avatarUrl} name={app.fullName} role="STUDENT" size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.fullName}</h3>
                          <Badge
                            size="sm"
                            variant={app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'error' : 'warning'}
                            className="text-[10px]"
                          >
                            {app.status === 'APPROVED' ? 'Aprovada' : app.status === 'REJECTED' ? 'Rejeitada' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                          @{app.user?.username || app.userId} • Submetido em {new Date(app.createdAt).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>

                    {app.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectType('app');
                            setShowRejectModal(true);
                          }}
                          className="cursor-pointer text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200"
                        >
                          Recusar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleApproveApplication(app.id)}
                          className="cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Aprovar Formador
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Informações detalhadas da candidatura */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-neutral-800/40 p-3.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400 font-medium">Área: </span>
                      <strong className="text-slate-900 dark:text-white">{app.expertise || 'Geral'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-neutral-400 font-medium">Experiência: </span>
                      <strong className="text-slate-900 dark:text-white">{app.experienceYears} ano(s)</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 dark:text-neutral-400 font-medium">Motivação: </span>
                      <span className="text-slate-700 dark:text-neutral-300">{app.motivation}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 dark:text-neutral-400 font-medium">Cursos Propostos: </span>
                      <span className="text-slate-700 dark:text-neutral-300 font-mono text-[11px]">{app.proposedCourses}</span>
                    </div>

                    {(app.portfolioUrl || app.sampleVideoUrl) && (
                      <div className="sm:col-span-2 flex items-center gap-4 pt-1 text-xs">
                        {app.portfolioUrl && /^https?:\/\//i.test(app.portfolioUrl) && (
                          <a
                            href={app.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Portfólio / LinkedIn <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {app.sampleVideoUrl && /^https?:\/\//i.test(app.sampleVideoUrl) && (
                          <a
                            href={app.sampleVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Vídeo Exemplo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. MODERAÇÃO DE CURSOS ── */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ['PENDING', `Pendentes (${pendingCourses.length})`],
                ['APPROVED', 'Aprovados'],
                ['REJECTED', 'Rejeitados'],
                ['ALL', 'Todos'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setCourseFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    courseFilter === status
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Pesquisar por título ou formador..."
                className="w-full bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 text-sm">
              Nenhum curso encontrado neste filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-800 shrink-0 border border-slate-200 dark:border-neutral-800">
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{course.title}</h3>
                        <Badge
                          size="sm"
                          variant={course.approvalStatus === 'APPROVED' ? 'success' : course.approvalStatus === 'REJECTED' ? 'error' : 'warning'}
                          className="text-[10px]"
                        >
                          {course.approvalStatus === 'APPROVED' ? 'Aprovado' : course.approvalStatus === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 line-clamp-1">
                        {course.description}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-mono">
                        {course.creator?.name || 'Formador'} • {formatCategory(course.category)} • {formatCoursePrice(course)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenCourseReview(course)}
                      className="cursor-pointer text-xs font-semibold"
                    >
                      Rever Aulas
                    </Button>
                    {course.approvalStatus === 'APPROVED' && (
                      <Link to={`/courses/${course.id}`}>
                        <Button variant="secondary" size="sm" className="cursor-pointer text-xs">
                          Ver Público
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. GESTÃO DE UTILIZADORES ── */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden">
          {/* Barra de Filtros e Pesquisa */}
          <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mr-1">Cargo:</span>
              {[
                ['ALL', 'Todos'],
                ['ADMIN', 'Admins'],
                ['CREATOR', 'Formadores'],
                ['STUDENT', 'Alunos'],
              ].map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    userRoleFilter === role
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}

              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 ml-2 mr-1">Estado:</span>
              {[
                ['ALL', 'Todos'],
                ['ACTIVE', 'Ativos'],
                ['SUSPENDED', 'Suspensos'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setUserStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    userStatusFilter === status
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="w-full bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tabela de Utilizadores */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-800/40 text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Utilizador</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Cargo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <Avatar src={u.avatarUrl} name={u.name} role={u.role} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-neutral-300 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge
                        size="sm"
                        variant={u.role === 'ADMIN' ? 'error' : u.role === 'CREATOR' ? 'primary' : 'secondary'}
                        className="text-[10px]"
                      >
                        {u.role === 'ADMIN' ? 'Admin' : u.role === 'CREATOR' ? 'Formador' : 'Aluno'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        size="sm"
                        variant={u.isSuspended ? 'error' : 'success'}
                        className="text-[10px]"
                      >
                        {u.isSuspended ? 'Suspenso' : 'Ativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u.id)}
                          className={`font-semibold cursor-pointer transition-colors ${
                            u.isSuspended
                              ? 'text-emerald-600 hover:underline'
                              : 'text-red-600 hover:underline'
                          }`}
                        >
                          {u.isSuspended ? 'Reativar' : 'Suspender'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL DE REVISÃO DO CURSO ── */}
      <Modal
        isOpen={Boolean(selectedCourseDetail)}
        onClose={() => setSelectedCourseDetail(null)}
        title="Currículo do Curso"
        maxWidth="3xl"
        bodyClassName="p-4 sm:p-6 overflow-y-auto custom-scrollbar text-slate-900 dark:text-neutral-100 flex-1 min-h-0"
      >
        {courseDetailLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">A carregar conteúdo...</div>
        ) : selectedCourseDetail && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <img
                src={selectedCourseDetail.thumbnailUrl}
                alt={selectedCourseDetail.title}
                className="w-24 h-16 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-neutral-800"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{selectedCourseDetail.title}</h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">{selectedCourseDetail.description}</p>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  Formador: {selectedCourseDetail.creator?.name || 'N/A'} • {formatCoursePrice(selectedCourseDetail)}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Módulos e Aulas ({selectedCourseDetail.modules?.length || 0})
              </h4>
              {selectedCourseDetail.modules?.map((mod, idx) => (
                <div
                  key={mod.id || idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs"
                >
                  <div className="font-bold text-slate-900 dark:text-white mb-2">
                    Módulo {idx + 1}: {mod.title}
                  </div>
                  <div className="space-y-1 pl-2">
                    {mod.lessons?.map((les, lIdx) => (
                      <div key={les.id || lIdx} className="flex items-center justify-between text-slate-600 dark:text-neutral-400 py-0.5">
                        <span>{lIdx + 1}. {les.title}</span>
                        <span className="font-mono text-[11px] text-slate-400">{formatLessonType(les.type)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-neutral-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCourseDetail(null)}>
                Fechar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={actionLoading}
                onClick={() => {
                  setSelectedCourse(selectedCourseDetail);
                  setRejectType('course');
                  setSelectedCourseDetail(null);
                  setShowRejectModal(true);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Pedir Alterações
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={() => handleApproveCourse(selectedCourseDetail.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Aprovar Curso
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL DE REJEIÇÃO COM FEEDBACK ── */}
      {showRejectModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => {
                setShowRejectModal(false);
                setRejectFeedback('');
              }}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-2xl z-10 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {rejectType === 'app' ? 'Rejeitar Candidatura' : 'Pedir Alterações ao Curso'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Escreva o motivo para que o utilizador possa compreender e efetuar as correções necessárias.
              </p>
              <textarea
                rows={3}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Indique o motivo..."
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectFeedback('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={rejectType === 'course' ? handleConfirmRejectCourse : handleConfirmRejectApplication}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminDashboard;