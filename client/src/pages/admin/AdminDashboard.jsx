import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subAdminApps, setSubAdminApps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Modais de ação
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedSubAdminApp, setSelectedSubAdminApp] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState(null); // 'app' | 'course' | 'subadmin'
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchAdminData = async () => {
    try {
      const [statsData, usersData, reportsData, appsData, coursesData, subAdminAppsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminReports(),
        api.getAdminCreatorApplications(),
        api.getAdminCourses('all'),
        api.getAdminSubAdminApplications(),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setReports(reportsData || []);
      setApplications(appsData || []);
      setCourses(coursesData || []);
      setSubAdminApps(subAdminAppsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      const res = await api.toggleSuspendUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: res.isSuspended } : u))
      );
      toast({
        title: res.isSuspended ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        type: res.isSuspended ? 'error' : 'success',
      });
    } catch (err) {
      toast({
        title: 'Ação Falhou',
        message: 'Não foi possível atualizar o estado do utilizador',
        type: 'error',
      });
    }
  };

  // Aprovar candidatura a criador
  const handleApproveApplication = async (appId) => {
    setActionLoading(true);
    try {
      await api.approveCreatorApplication(appId);
      toast({
        title: 'Candidatura Aprovada!',
        message: 'O utilizador foi promovido a Formador com acesso ao Estúdio de Criação.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err) {
      toast({
        title: 'Falha ao Aprovar',
        message: err.message || 'Erro ao processar aprovação.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Rejeitar candidatura a criador
  const handleConfirmRejectApplication = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await api.rejectCreatorApplication(selectedApp.id, rejectFeedback);
      toast({
        title: 'Candidatura Rejeitada',
        message: 'O candidato foi notificado com o feedback fornecido.',
        type: 'info',
      });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedApp(null);
      fetchAdminData();
    } catch (err) {
      toast({
        title: 'Falha ao Rejeitar',
        message: err.message || 'Erro ao processar rejeição.',
        type: 'error',
      });
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
        title: 'Curso Aprovado & Publicado! 🚀',
        message: 'O curso já se encontra disponível no catálogo público para todos os alunos.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (err) {
      toast({
        title: 'Falha ao Aprovar Curso',
        message: err.message || 'Erro ao aprovar curso.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Rejeitar curso
  const handleConfirmRejectCourse = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    try {
      await api.rejectCourse(selectedCourse.id, rejectFeedback);
      toast({
        title: 'Curso Rejeitado / Requer Revisão',
        message: 'O formador foi notificado com as instruções de ajuste.',
        type: 'info',
      });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedCourse(null);
      fetchAdminData();
    } catch (err) {
      toast({
        title: 'Falha ao Rejeitar Curso',
        message: err.message || 'Erro ao rejeitar curso.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Aprovar candidatura a Sub-Administrador
  const handleApproveSubAdminApplication = async (appId) => {
    setActionLoading(true);
    try {
      await api.approveSubAdminApplication(appId);
      toast({
        title: 'Candidatura a Sub-Admin Aprovada! 🛡️',
        message: 'O utilizador foi promovido para a equipa de Administração com sucesso.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedSubAdminApp?.id === appId) setSelectedSubAdminApp(null);
    } catch (err) {
      toast({
        title: 'Falha ao Aprovar Sub-Administrador',
        message: err.message || 'Erro ao processar aprovação.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Rejeitar candidatura a Sub-Administrador
  const handleConfirmRejectSubAdminApplication = async () => {
    if (!selectedSubAdminApp) return;
    setActionLoading(true);
    try {
      await api.rejectSubAdminApplication(selectedSubAdminApp.id, rejectFeedback);
      toast({
        title: 'Candidatura Rejeitada',
        message: 'O candidato a sub-administrador foi notificado com o feedback fornecido.',
        type: 'info',
      });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedSubAdminApp(null);
      fetchAdminData();
    } catch (err) {
      toast({
        title: 'Falha ao Rejeitar',
        message: err.message || 'Erro ao rejeitar candidatura.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const pendingSubAdminApps = subAdminApps.filter((a) => a.status === 'PENDING');
  const pendingCourses = courses.filter((c) => c.approvalStatus === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary" className="font-bold">
              Consola de Administração NEXO
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Gestão & Moderação Global
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 mt-1">
            Aprovação de candidaturas a formador, moderação de cursos, métricas globais e controlo de acessos.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] p-1.5 rounded-lg border border-slate-200 dark:border-white/10 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            <span>Candidaturas a Formador</span>
            {pendingApps.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950">
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('subadmin')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'subadmin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            <span>Sub-Administradores</span>
            {pendingSubAdminApps.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950">
                {pendingSubAdminApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            <span>Moderação de Cursos</span>
            {pendingCourses.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950">
                {pendingCourses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            Utilizadores ({users.length})
          </button>
        </div>
      </div>

      {/* 1. VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="p-6 border border-black/5 dark:border-white/10 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                Total de Utilizadores
              </span>
              <p className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {stats?.totalUsers || users.length}
              </p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                ~{stats?.activeUsers || Math.max(1, users.length - 1)} ativos hoje
              </span>
            </Card>

            <Card className="p-6 border border-black/5 dark:border-white/10 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                Cursos na Plataforma
              </span>
              <p className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {courses.length}
              </p>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 block">
                {pendingCourses.length} a aguardar moderação
              </span>
            </Card>

            <Card className="p-6 border border-black/5 dark:border-white/10 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                Candidaturas a Formador
              </span>
              <p className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {applications.length}
              </p>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1 block">
                {pendingApps.length} inquéritos pendentes
              </span>
            </Card>

            <Card className="p-6 border border-black/5 dark:border-white/10 shadow-xs">
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                Inscrições em Aulas
              </span>
              <p className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {stats?.totalEnrollments || 1}
              </p>
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 mt-1 block">
                Progresso ativo
              </span>
            </Card>
          </div>

          {/* Quick Action Alerts */}
          {(pendingApps.length > 0 || pendingCourses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApps.length > 0 && (
                <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {pendingApps.length} Inquérito(s) de Candidatura Pendente(s)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                        Alunos que pretendem tornar-se formadores no NEXO.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('applications')}
                    className="cursor-pointer"
                  >
                    Rever Agora
                  </Button>
                </div>
              )}

              {pendingCourses.length > 0 && (
                <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {pendingCourses.length} Curso(s) a Aguardar Aprovação
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                        Cursos submetidos por formadores antes de publicação pública.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('courses')}
                    className="cursor-pointer"
                  >
                    Moderar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. CANDIDATURAS A CRIADOR (INQUÉRITOS) */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                Inquéritos de Candidatura a Formador ({applications.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Avalie o perfil, motivação e proposta de cursos dos alunos antes de lhes conceder acesso ao estúdio de criação.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 dark:text-neutral-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Nenhuma candidatura registada até ao momento.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card
                  key={app.id}
                  className={`p-6 border transition-all ${
                    app.status === 'PENDING'
                      ? 'border-amber-500/40 bg-amber-500/[0.02]'
                      : 'border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {app.fullName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                          @{app.user?.username || app.userId}
                        </span>
                        <Badge
                          size="sm"
                          variant={
                            app.status === 'APPROVED'
                              ? 'success'
                              : app.status === 'REJECTED'
                              ? 'error'
                              : 'warning'
                          }
                          className="font-bold"
                        >
                          {app.status === 'APPROVED'
                            ? 'Aprovada'
                            : app.status === 'REJECTED'
                            ? 'Rejeitada'
                            : 'Pendente de Revisão'}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(app.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-neutral-400 font-bold block">
                            Área de Especialização:
                          </span>
                          <span className="text-slate-900 dark:text-white font-medium">{app.expertise}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-neutral-400 font-bold block">
                            Experiência Declarada:
                          </span>
                          <span className="text-slate-900 dark:text-white font-medium">
                            {app.experienceYears} anos
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-black/5 dark:border-white/5 space-y-2">
                        <div>
                          <strong className="text-slate-900 dark:text-white block mb-0.5">
                            Motivação:
                          </strong>
                          <p className="line-clamp-2">{app.motivation}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block mb-0.5">
                            Cursos Propostos:
                          </strong>
                          <p className="font-mono text-[11px] line-clamp-2">{app.proposedCourses}</p>
                        </div>
                        {app.portfolioUrl && (
                          <div className="pt-1">
                            <a
                              href={app.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
                            >
                              Ver Portfólio / LinkedIn <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {app.sampleVideoUrl && (
                          <div>
                            <a
                              href={app.sampleVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold"
                            >
                              Vídeo Demonstrativo <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      {app.status === 'PENDING' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="w-4 h-4" />}
                            disabled={actionLoading}
                            onClick={() => handleApproveApplication(app.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm cursor-pointer"
                          >
                            Aprovar Formador
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<X className="w-4 h-4" />}
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedApp(app);
                              setRejectType('app');
                              setShowRejectModal(true);
                            }}
                            className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 cursor-pointer"
                          >
                            Rejeitar
                          </Button>
                        </>
                      ) : (
                        <div className="text-xs font-mono text-slate-400 text-center">
                          {app.status === 'APPROVED' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Promovido a Formador
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">✗ Rejeitado</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2.5. CANDIDATURAS A SUB-ADMINISTRADOR */}
      {activeTab === 'subadmin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                Inquéritos de Candidatura à Administração ({subAdminApps.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Avalie a motivação, disponibilidade semanal, áreas de interesse e resolução de cenários práticos de moderação dos candidatos a sub-administrador.
              </p>
            </div>
          </div>

          {subAdminApps.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 dark:text-neutral-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
              <p className="text-sm font-semibold">Nenhuma candidatura a sub-administrador registada até ao momento.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {subAdminApps.map((app) => {
                let areas = [];
                try {
                  areas = typeof app.areasOfInterest === 'string' ? JSON.parse(app.areasOfInterest || '[]') : (app.areasOfInterest || []);
                } catch (e) {
                  areas = [];
                }

                return (
                  <Card
                    key={app.id}
                    className={`p-6 border transition-all ${
                      app.status === 'PENDING'
                        ? 'border-blue-500/40 bg-blue-500/[0.02]'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            {app.fullName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                            @{app.user?.username || app.userId}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">
                            {app.email}
                          </span>
                          <Badge
                            size="sm"
                            variant={
                              app.status === 'APPROVED'
                                ? 'success'
                                : app.status === 'REJECTED'
                                ? 'error'
                                : 'warning'
                            }
                            className="font-bold"
                          >
                            {app.status === 'APPROVED'
                              ? 'Aprovada (Membro Admin)'
                              : app.status === 'REJECTED'
                              ? 'Rejeitada'
                              : 'Pendente de Revisão'}
                          </Badge>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(app.createdAt).toLocaleDateString('pt-PT')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">
                              Disponibilidade Semanal:
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-semibold font-mono">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              {app.weeklyAvailabilityHours || 10} horas / semana
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-neutral-400 font-bold block mb-1">
                              Áreas de Foco Indicadas:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {areas.length > 0 ? (
                                areas.map((area, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                  >
                                    {area}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">Geral</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-neutral-400 font-bold block mb-0.5">
                              Motivação para Integrar a Gestão:
                            </span>
                            <p className="text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-3 rounded-lg border border-slate-200/60 dark:border-neutral-800 leading-relaxed">
                              {app.motivation}
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-500 dark:text-neutral-400 font-bold block mb-0.5">
                              Experiência Anterior em Moderação / Liderança Técnica:
                            </span>
                            <p className="text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-3 rounded-lg border border-slate-200/60 dark:border-neutral-800 leading-relaxed">
                              {app.experience}
                            </p>
                          </div>

                          {app.situationScenario && (
                            <div>
                              <span className="text-slate-500 dark:text-neutral-400 font-bold block mb-0.5">
                                Resolução do Cenário de Conflito em Sala WebRTC:
                              </span>
                              <div className="text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-900 p-3 rounded-lg border border-slate-200/60 dark:border-neutral-800 italic leading-relaxed text-xs">
                                "{app.situationScenario}"
                              </div>
                            </div>
                          )}

                          {app.adminFeedback && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
                              <span className="font-bold block">Feedback Enviado:</span>
                              {app.adminFeedback}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end w-full lg:w-44 pt-2 lg:pt-0">
                        {app.status === 'PENDING' ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Check className="w-4 h-4" />}
                              disabled={actionLoading}
                              onClick={() => handleApproveSubAdminApplication(app.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm cursor-pointer"
                            >
                              Aprovar Sub-Admin
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<X className="w-4 h-4" />}
                              disabled={actionLoading}
                              onClick={() => {
                                setSelectedSubAdminApp(app);
                                setRejectType('subadmin');
                                setShowRejectModal(true);
                              }}
                              className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 cursor-pointer"
                            >
                              Rejeitar
                            </Button>
                          </>
                        ) : (
                          <div className="text-xs font-mono text-slate-400 text-center">
                            {app.status === 'APPROVED' ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <ShieldCheck className="w-4 h-4" />
                                Sub-Admin Ativo
                              </span>
                            ) : (
                              <span className="text-red-500 font-bold">✗ Rejeitado</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MODERAÇÃO E APROVAÇÃO DE CURSOS */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                Cursos Submetidos para Moderação ({courses.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Apenas cursos validados e aprovados pelo Administrador ficam visíveis no catálogo público.
              </p>
            </div>
          </div>

          {courses.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 dark:text-neutral-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Nenhum curso registado.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className={`p-6 border transition-all ${
                    course.approvalStatus === 'PENDING'
                      ? 'border-amber-500/40 bg-amber-500/[0.02]'
                      : 'border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-black/10">
                        <img
                          src={
                            course.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {course.title}
                          </h3>
                          <Badge
                            size="sm"
                            variant={
                              course.approvalStatus === 'APPROVED'
                                ? 'success'
                                : course.approvalStatus === 'REJECTED'
                                ? 'error'
                                : 'warning'
                            }
                            className="font-bold"
                          >
                            {course.approvalStatus === 'APPROVED'
                              ? 'Aprovado & Público'
                              : course.approvalStatus === 'REJECTED'
                              ? 'Rejeitado'
                              : 'Pendente de Aprovação'}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-1">
                          {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-neutral-400 font-mono">
                          <span>Criador: {course.creator?.name || 'Formador'}</span>
                          <span>Categoria: {course.category}</span>
                          <span>Preço: {course.isFree ? 'Gratuito' : `€${course.price}`}</span>
                          <span>{course.modulesCount || 0} módulos</span>
                        </div>

                        {course.adminNotes && (
                          <div className="text-[11px] text-slate-600 dark:text-neutral-400 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg border border-black/5 dark:border-white/5">
                            <strong>Notas do Administrador:</strong> {course.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      {course.approvalStatus === 'PENDING' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="w-4 h-4" />}
                            disabled={actionLoading}
                            onClick={() => handleApproveCourse(course.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            Aprovar Curso
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<X className="w-4 h-4" />}
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedCourse(course);
                              setRejectType('course');
                              setShowRejectModal(true);
                            }}
                            className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 cursor-pointer"
                          >
                            Rejeitar
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <Link to={`/courses/${course.id}`}>
                            <Button variant="secondary" size="sm" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                              Ver Curso
                            </Button>
                          </Link>
                          {course.approvalStatus === 'REJECTED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveCourse(course.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Reaprovar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. UTILIZADORES */}
      {activeTab === 'users' && (
        <Card className="p-0 overflow-hidden border border-black/5 dark:border-white/10 shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
              Lista de Utilizadores ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
                <tr>
                  <th className="py-4 px-6">Utilizador</th>
                  <th className="py-4 px-6">Cargo</th>
                  <th className="py-4 px-6">Nível / XP</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <Avatar src={u.avatarUrl} alt={u.name} size="sm" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        size="sm"
                        variant={
                          u.role === 'ADMIN' ? 'error' : u.role === 'CREATOR' ? 'primary' : 'secondary'
                        }
                        className="font-bold"
                      >
                        {u.role === 'ADMIN'
                          ? 'Administrador'
                          : u.role === 'CREATOR'
                          ? 'Formador'
                          : 'Aluno'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      Nível {u.level || 1} • {u.xp || 0} XP
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        size="sm"
                        variant={u.isSuspended ? 'error' : 'success'}
                        className="font-bold"
                      >
                        {u.isSuspended ? 'Suspenso' : 'Ativo'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                          className={u.isSuspended ? 'text-emerald-600' : 'text-red-600'}
                        >
                          {u.isSuspended ? 'Reativar' : 'Suspender'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rejection Modal with Feedback Input */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {rejectType === 'app'
                  ? 'Rejeitar Candidatura a Formador'
                  : rejectType === 'subadmin'
                  ? 'Rejeitar Candidatura a Sub-Administrador'
                  : 'Rejeitar Curso'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Indique ao utilizador as razões da decisão para que possa ajustar o conteúdo e submeter novamente.
            </p>
            <textarea
              rows={3}
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="Ex.: É necessário detalhar os módulos ou apresentar maior experiência na área..."
              className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500 text-slate-900 dark:text-white"
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
                onClick={
                  rejectType === 'app'
                    ? handleConfirmRejectApplication
                    : rejectType === 'subadmin'
                    ? handleConfirmRejectSubAdminApplication
                    : handleConfirmRejectCourse
                }
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Confirmar Rejeição
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;