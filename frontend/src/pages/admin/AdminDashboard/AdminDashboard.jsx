import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  LifeBuoy,
  Send,
  RefreshCw,
  Tag
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Modais de ação
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState(null); // 'app' | 'course'
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchAdminData = async () => {
    try {
      const [statsData, usersData, reportsData, appsData, coursesData, ticketsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminReports(),
        api.getAdminCreatorApplications(),
        api.getAdminCourses('all'),
        api.getAdminSupportTickets().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setReports(reportsData || []);
      setApplications(appsData || []);
      setCourses(coursesData || []);
      setSupportTickets(ticketsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket) => {
    try {
      const fullTicket = await api.getSupportTicket(ticket.id);
      setSelectedTicket(fullTicket);
    } catch {
      setSelectedTicket(ticket);
    }
  };

  const handleSendTicketReply = async () => {
    if (!selectedTicket || !ticketReply.trim()) return;
    setReplyLoading(true);
    try {
      const updatedTicket = await api.sendTicketMessage(selectedTicket.id, ticketReply.trim());
      setSelectedTicket(updatedTicket);
      setTicketReply('');
      setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      toast({
        title: 'Resposta Enviada',
        message: 'A mensagem foi enviada ao utilizador com sucesso.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro ao Enviar',
        message: err.message || 'Não foi possível enviar a resposta.',
        type: 'error'
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const updated = await api.updateTicketStatus(ticketId, newStatus);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      toast({
        title: 'Estado Atualizado',
        message: `O ticket foi marcado como ${newStatus}.`,
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível alterar o estado.',
        type: 'error'
      });
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
        title: 'Curso Aprovado e Publicado!',
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

  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const pendingCourses = courses.filter((c) => c.approvalStatus === 'PENDING');
  const pendingTickets = supportTickets.filter((t) => t.status === 'ABERTO' || t.status === 'EM_ANALISE');

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

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
            }`}
          >
            <span>Tickets de Suporte</span>
            {pendingTickets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-500 text-white">
                {pendingTickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
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
                Tickets de Suporte
              </span>
              <p className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                {supportTickets.length}
              </p>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1 block">
                {pendingTickets.length} pendentes de resposta
              </span>
            </Card>

            <Card className="p-6 border border-black/5 dark:border-white/10 shadow-xs col-span-2 md:col-span-1">
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
                              Promovido a Formador
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">Rejeitado</span>
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
                          <span>Preço: {formatCoursePrice(course)}</span>
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

      {/* 5. GESTÃO DE TICKETS DE SUPORTE */}
      {activeTab === 'tickets' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0b0c0e] border border-slate-200 dark:border-neutral-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 mr-2">Filtrar por Estado:</span>
              {[
                { id: 'ALL', label: 'Todos', count: supportTickets.length },
                { id: 'ABERTO', label: 'Abertos', count: supportTickets.filter(t => t.status === 'ABERTO').length },
                { id: 'EM_ANALISE', label: 'Em Análise', count: supportTickets.filter(t => t.status === 'EM_ANALISE').length },
                { id: 'RESPONDIDO', label: 'Respondidos', count: supportTickets.filter(t => t.status === 'RESPONDIDO').length },
                { id: 'RESOLVIDO', label: 'Resolvidos', count: supportTickets.filter(t => t.status === 'RESOLVIDO').length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTicketStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ticketStatusFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${ticketStatusFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAdminData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Atualizar
            </Button>
          </div>

          {/* Tickets Grid / Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tickets List */}
            <div className="flex flex-col gap-3 lg:col-span-12">
              {supportTickets
                .filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter)
                .length === 0 ? (
                <Card className="p-12 text-center border border-slate-200 dark:border-neutral-800">
                  <LifeBuoy className="w-12 h-12 text-slate-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-neutral-300">Nenhum ticket encontrado</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                    Não existem tickets no filtro selecionado.
                  </p>
                </Card>
              ) : (
                supportTickets
                  .filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter)
                  .map(ticket => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const statusColors = {
                      ABERTO: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
                      EM_ANALISE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
                      RESPONDIDO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
                      RESOLVIDO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
                      FECHADO: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                    };

                    const statusLabels = {
                      ABERTO: 'Aberto',
                      EM_ANALISE: 'Em Análise',
                      RESPONDIDO: 'Respondido',
                      RESOLVIDO: 'Resolvido',
                      FECHADO: 'Fechado'
                    };

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left bg-white dark:bg-[#0b0c0e] ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                            : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={ticket.user?.avatarUrl} name={ticket.user?.name || 'Utilizador'} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {ticket.user?.name || 'Utilizador'}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono truncate">
                                {ticket.user?.email || 'N/D'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${statusColors[ticket.status] || statusColors.ABERTO}`}>
                            {statusLabels[ticket.status] || ticket.status}
                          </span>
                        </div>

                        <div className="mt-3">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {ticket.subject}
                          </h4>
                          {ticket.lastMessage && (
                            <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mt-1">
                              {ticket.lastMessage.content}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                          <span className="font-medium bg-slate-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md">
                            {ticket.category}
                          </span>
                          <span>
                            {new Date(ticket.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Selected Ticket Conversation & Actions */}
            <Modal
              isOpen={Boolean(selectedTicket)}
              onClose={() => setSelectedTicket(null)}
              maxWidth="4xl"
              title="Conversa de Suporte"
              bodyClassName="p-0 overflow-hidden flex-1 min-h-0"
            >
              {selectedTicket && (
              <div className="flex h-[min(70vh,680px)] min-h-0 flex-col bg-white dark:bg-[#0b0c0e]">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {selectedTicket.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: #{selectedTicket.id?.slice(0, 8)}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {selectedTicket.subject}
                      </h3>
                    </div>

                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                      <span>Alterar Estado:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'EM_ANALISE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedTicket.status === 'EM_ANALISE'
                              ? 'bg-amber-500 text-black'
                              : 'bg-slate-200/80 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          Em Análise
                        </button>
                        <button
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'RESOLVIDO')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedTicket.status === 'RESOLVIDO'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200/80 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          Resolvido
                        </button>
                        <button
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'FECHADO')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedTicket.status === 'FECHADO'
                              ? 'bg-slate-800 text-white dark:bg-neutral-700'
                              : 'bg-slate-200/80 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          Fechar
                        </button>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                      Criado em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="p-5 flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-white dark:bg-[#07080a]">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, index) => {
                      const isAdminMsg = msg.isAdminReply || msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUBADMIN';
                      return (
                        <div
                          key={msg.id || index}
                          className={`flex gap-3 max-w-[85%] ${isAdminMsg ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                        >
                          <Avatar
                            src={msg.sender?.avatarUrl}
                            name={msg.sender?.name || (isAdminMsg ? 'Suporte' : 'Utilizador')}
                            size="sm"
                            className="shrink-0 mt-1"
                          />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {msg.sender?.name || (isAdminMsg ? 'Equipa de Suporte NEXO' : 'Utilizador')}
                              </span>
                              {isAdminMsg && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                  Admin
                                </span>
                              )}
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div
                              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAdminMsg
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white rounded-tl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-8">Sem mensagens adicionais.</p>
                  )}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-white/[0.01]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendTicketReply();
                    }}
                    className="flex flex-col gap-3"
                  >
                    <textarea
                      rows={3}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Escreva a resposta da equipa de suporte/administração..."
                      className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                        O utilizador receberá uma notificação na plataforma.
                      </span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!ticketReply.trim() || replyLoading}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        {replyLoading ? 'A enviar...' : 'Responder ao Ticket'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
              )}
            </Modal>
          </div>
        </div>
      )}

      {/* Rejection Modal with Feedback Input */}
      {showRejectModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
          <div 
            className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity" 
            onClick={() => {
              setShowRejectModal(false);
              setRejectFeedback('');
            }}
            aria-hidden="true"
          />
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <Card className="relative w-full max-w-md p-6 space-y-4 shadow-2xl z-10 animate-fade-in text-left">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {rejectType === 'app'
                    ? 'Rejeitar Candidatura a Formador'
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
                      : handleConfirmRejectCourse
                  }
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar Rejeição
                </Button>
              </div>
            </Card>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;