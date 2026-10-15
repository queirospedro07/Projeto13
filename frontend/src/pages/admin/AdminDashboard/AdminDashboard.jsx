import { ReportQueue } from '../../../features/moderation/Moderation';
import { safeExternalUrl } from '../../../utils/safeUrl';
import './AdminDashboard.css';
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
  ArrowRight,
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
        toast({
          title: 'Atualizado',
          message: 'Dados sincronizados com sucesso.',
          type: 'success',
        });
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
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: res.isSuspended } : u)),
      );
      toast({
        title: res.isSuspended ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        message: res.isSuspended
          ? 'A conta foi temporariamente bloqueada.'
          : 'A conta está agora ativa.',
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
      toast({
        title: 'Alterações Solicitadas',
        message: 'Feedback enviado ao formador.',
        type: 'info',
      });
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
    <div className="admin-dashboard-panel">
      {/* ── HEADER SÓBRIO & PROFISSIONAL ── */}
      <div className="admin-dashboard-panel-2">
        <div>
          <h1 className="admin-dashboard-title">Painel de Administração</h1>
          <p className="admin-dashboard-description">
            Gestão de utilizadores, moderação de cursos e análise de candidaturas a formador.
          </p>
        </div>

        <div className="admin-dashboard-panel-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchAdminData(true)}
            disabled={refreshing}
            leftIcon={
              <RefreshCw
                className={`admin-dashboard-refresh-cw ${refreshing ? 'admin-dashboard-refresh-cw-2' : ''}`}
              />
            }
            className="admin-dashboard-button"
          >
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* ── NAVEGAÇÃO ENTRE ABAS (ESTILO SEGMENTADO CLEAN) ── */}
      <div className="admin-dashboard-panel-4">
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
            className={`admin-dashboard-button-2 ${
              activeTab === tab.id ? 'admin-dashboard-button-3' : 'admin-dashboard-button-4'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`admin-dashboard-label ${
                  tab.id === 'applications' || tab.id === 'courses'
                    ? 'admin-dashboard-label-2'
                    : 'admin-dashboard-label-3'
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
        <div className="admin-dashboard-panel-5">
          {/* Métricas Principais */}
          <div className="admin-dashboard-panel-6">
            <div onClick={() => setActiveTab('users')} className="admin-dashboard-panel-7">
              <div className="admin-dashboard-panel-8">Utilizadores</div>
              <div className="admin-dashboard-panel-9">{users.length}</div>
              <div className="admin-dashboard-panel-10">
                {users.filter((u) => u.role === 'CREATOR').length} formadores •{' '}
                {users.filter((u) => u.role === 'STUDENT').length} alunos
              </div>
            </div>

            <div onClick={() => setActiveTab('courses')} className="admin-dashboard-panel-7">
              <div className="admin-dashboard-panel-8">Cursos Registados</div>
              <div className="admin-dashboard-panel-9">{courses.length}</div>
              <div className="admin-dashboard-panel-10">
                {pendingCourses.length > 0 ? (
                  <span className="admin-dashboard-label-4">
                    {pendingCourses.length} a aguardar aprovação
                  </span>
                ) : (
                  'Todos aprovados'
                )}
              </div>
            </div>

            <div onClick={() => setActiveTab('applications')} className="admin-dashboard-panel-7">
              <div className="admin-dashboard-panel-8">Candidaturas a Formador</div>
              <div className="admin-dashboard-panel-9">{applications.length}</div>
              <div className="admin-dashboard-panel-10">
                {pendingApps.length > 0 ? (
                  <span className="admin-dashboard-label-4">{pendingApps.length} pendente(s)</span>
                ) : (
                  'Nenhuma pendente'
                )}
              </div>
            </div>

            <div className="admin-dashboard-panel-11">
              <div className="admin-dashboard-panel-8">Inscrições Ativas</div>
              <div className="admin-dashboard-panel-9">{stats?.totalEnrollments || 1}</div>
              <div className="admin-dashboard-panel-10">Matrículas de alunos</div>
            </div>
          </div>

          {/* Tarefas Pendentes de Atenção */}
          {(pendingApps.length > 0 || pendingCourses.length > 0) && (
            <div className="admin-dashboard-panel-12">
              <h3 className="admin-dashboard-subheading">
                <AlertCircle className="admin-dashboard-alert-circle" />
                <span>Itens a aguardar a sua revisão</span>
              </h3>

              <div className="admin-dashboard-panel-13">
                {pendingApps.length > 0 && (
                  <div className="admin-dashboard-panel-14">
                    <div>
                      <div className="admin-dashboard-panel-15">
                        {pendingApps.length} Candidatura(s) a Formador
                      </div>
                      <div className="admin-dashboard-panel-16">
                        Alunos a aguardar autorização de estúdio.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('applications')}
                      className="admin-dashboard-button-5"
                    >
                      Rever
                    </Button>
                  </div>
                )}

                {pendingCourses.length > 0 && (
                  <div className="admin-dashboard-panel-14">
                    <div>
                      <div className="admin-dashboard-panel-15">
                        {pendingCourses.length} Curso(s) Submetido(s)
                      </div>
                      <div className="admin-dashboard-panel-16">
                        Aulas prontas para validação curricular.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('courses')}
                      className="admin-dashboard-button-5"
                    >
                      Moderar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duas colunas com resumos rápidos */}
          <div className="admin-dashboard-panel-17">
            {/* Utilizadores Recentes */}
            <div className="admin-dashboard-panel-18">
              <div className="admin-dashboard-panel-19">
                <h3 className="admin-dashboard-subheading-2">Últimos Utilizadores Registados</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="admin-dashboard-button-6"
                >
                  Ver todos
                </button>
              </div>
              <div className="admin-dashboard-panel-20">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="admin-dashboard-panel-21">
                    <div className="admin-dashboard-panel-22">
                      <Avatar src={u.avatarUrl} name={u.name} role={u.role} size="sm" />
                      <div className="admin-dashboard-panel-23">
                        <div className="admin-dashboard-panel-24">{u.name}</div>
                        <div className="admin-dashboard-panel-25">{u.email}</div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={
                        u.role === 'ADMIN'
                          ? 'error'
                          : u.role === 'CREATOR'
                            ? 'primary'
                            : 'secondary'
                      }
                      className="admin-dashboard-badge"
                    >
                      {u.role === 'ADMIN' ? 'Admin' : u.role === 'CREATOR' ? 'Formador' : 'Aluno'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursos Recentes */}
            <div className="admin-dashboard-panel-18">
              <div className="admin-dashboard-panel-19">
                <h3 className="admin-dashboard-subheading-2">Cursos na Plataforma</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="admin-dashboard-button-6"
                >
                  Ver todos
                </button>
              </div>
              <div className="admin-dashboard-panel-20">
                {courses.slice(0, 5).map((c) => (
                  <div key={c.id} className="admin-dashboard-panel-21">
                    <div className="admin-dashboard-panel-22">
                      <div className="admin-dashboard-panel-26">
                        <img src={c.thumbnailUrl} alt={c.title} className="admin-dashboard-image" />
                      </div>
                      <div className="admin-dashboard-panel-23">
                        <div className="admin-dashboard-panel-24">{c.title}</div>
                        <div className="admin-dashboard-panel-16">
                          {c.creator?.name || 'Formador'} • {formatCoursePrice(c)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={
                        c.approvalStatus === 'APPROVED'
                          ? 'success'
                          : c.approvalStatus === 'REJECTED'
                            ? 'error'
                            : 'warning'
                      }
                      className="admin-dashboard-badge"
                    >
                      {c.approvalStatus === 'APPROVED'
                        ? 'Aprovado'
                        : c.approvalStatus === 'REJECTED'
                          ? 'Rejeitado'
                          : 'Pendente'}
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
        <div className="admin-dashboard-panel-27">
          {/* Barra de Filtros */}
          <div className="admin-dashboard-panel-28">
            <div className="admin-dashboard-panel-29">
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
                  className={`admin-dashboard-button-7 ${
                    appFilter === status ? 'admin-dashboard-button-8' : 'admin-dashboard-button-9'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Pesquisar candidato..."
                className="admin-dashboard-field admin-user-search"
              />
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="admin-dashboard-panel-31">
              Nenhuma candidatura encontrada neste filtro.
            </div>
          ) : (
            <div className="admin-dashboard-panel-32">
              {filteredApplications.map((app) => (
                <div key={app.id} className="admin-dashboard-panel-33">
                  <div className="admin-dashboard-panel-34">
                    <div className="admin-dashboard-panel-35">
                      <Avatar
                        src={app.user?.avatarUrl}
                        name={app.fullName}
                        role="STUDENT"
                        size="md"
                      />
                      <div>
                        <div className="admin-dashboard-panel-3">
                          <h3 className="admin-dashboard-subheading-3">{app.fullName}</h3>
                          <Badge
                            size="sm"
                            variant={
                              app.status === 'APPROVED'
                                ? 'success'
                                : app.status === 'REJECTED'
                                  ? 'error'
                                  : 'warning'
                            }
                            className="admin-dashboard-badge-2"
                          >
                            {app.status === 'APPROVED'
                              ? 'Aprovada'
                              : app.status === 'REJECTED'
                                ? 'Rejeitada'
                                : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="admin-dashboard-panel-36">
                          @{app.user?.username || app.userId} • Submetido em{' '}
                          {new Date(app.createdAt).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>

                    {app.status === 'PENDING' && (
                      <div className="admin-dashboard-panel-37">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectType('app');
                            setShowRejectModal(true);
                          }}
                          className="admin-dashboard-button-10"
                        >
                          Recusar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleApproveApplication(app.id)}
                          className="admin-dashboard-button-11"
                        >
                          Aprovar Formador
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Informações detalhadas da candidatura */}
                  <div className="admin-dashboard-panel-38">
                    <div>
                      <span className="admin-dashboard-label-5">Área: </span>
                      <strong className="admin-dashboard-strong">{app.expertise || 'Geral'}</strong>
                    </div>
                    <div>
                      <span className="admin-dashboard-label-5">Experiência: </span>
                      <strong className="admin-dashboard-strong">
                        {app.experienceYears} ano(s)
                      </strong>
                    </div>
                    <div className="admin-dashboard-panel-39">
                      <span className="admin-dashboard-label-5">Motivação: </span>
                      <span className="admin-dashboard-label-6">{app.motivation}</span>
                    </div>
                    <div className="admin-dashboard-panel-39">
                      <span className="admin-dashboard-label-5">Cursos Propostos: </span>
                      <span className="admin-dashboard-label-7">{app.proposedCourses}</span>
                    </div>

                    {(app.portfolioUrl || app.sampleVideoUrl) && (
                      <div className="admin-dashboard-panel-40">
                        {app.portfolioUrl && /^https?:\/\//i.test(app.portfolioUrl) && (
                          <a
                            href={safeExternalUrl(app.portfolioUrl) || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-dashboard-link"
                          >
                            Portfólio / LinkedIn{' '}
                            <ExternalLink className="admin-dashboard-external-link" />
                          </a>
                        )}
                        {app.sampleVideoUrl && /^https?:\/\//i.test(app.sampleVideoUrl) && (
                          <a
                            href={safeExternalUrl(app.sampleVideoUrl) || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-dashboard-link"
                          >
                            Vídeo Exemplo <ExternalLink className="admin-dashboard-external-link" />
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
        <div className="admin-dashboard-panel-27">
          <div className="admin-dashboard-panel-28">
            <div className="admin-dashboard-panel-29">
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
                  className={`admin-dashboard-button-7 ${
                    courseFilter === status
                      ? 'admin-dashboard-button-8'
                      : 'admin-dashboard-button-9'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Pesquisar por título ou formador..."
                className="admin-dashboard-field pl-8.5"
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="admin-dashboard-panel-31">Nenhum curso encontrado neste filtro.</div>
          ) : (
            <div className="admin-dashboard-panel-32">
              {filteredCourses.map((course) => (
                <div key={course.id} className="admin-dashboard-panel-41">
                  <div className="admin-dashboard-panel-42">
                    <div className="admin-dashboard-panel-43">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="admin-dashboard-image"
                      />
                    </div>
                    <div className="admin-dashboard-panel-23">
                      <div className="admin-dashboard-panel-3">
                        <h3 className="admin-dashboard-subheading-4">{course.title}</h3>
                        <Badge
                          size="sm"
                          variant={
                            course.approvalStatus === 'APPROVED'
                              ? 'success'
                              : course.approvalStatus === 'REJECTED'
                                ? 'error'
                                : 'warning'
                          }
                          className="admin-dashboard-badge-2"
                        >
                          {course.approvalStatus === 'APPROVED'
                            ? 'Aprovado'
                            : course.approvalStatus === 'REJECTED'
                              ? 'Rejeitado'
                              : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="admin-dashboard-panel-44">{course.description}</div>
                      <div className="admin-dashboard-panel-45">
                        {course.creator?.name || 'Formador'} • {formatCategory(course.category)} •{' '}
                        {formatCoursePrice(course)}
                      </div>
                    </div>
                  </div>

                  <div className="admin-dashboard-panel-46">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Eye className="admin-dashboard-refresh-cw" />}
                      onClick={() => handleOpenCourseReview(course)}
                      className="admin-dashboard-button"
                    >
                      Rever Aulas
                    </Button>
                    {course.approvalStatus === 'APPROVED' && (
                      <Link to={`/courses/${course.id}`}>
                        <Button variant="secondary" size="sm" className="admin-dashboard-button-5">
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
        <div className="admin-dashboard-panel-18">
          {/* Barra de Filtros e Pesquisa */}
          <div className="admin-dashboard-panel-47">
            <div className="admin-dashboard-panel-48">
              <span className="admin-dashboard-label-8">Cargo:</span>
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
                  className={`admin-dashboard-button-12 ${
                    userRoleFilter === role
                      ? 'admin-dashboard-button-8'
                      : 'admin-dashboard-button-13'
                  }`}
                >
                  {label}
                </button>
              ))}

              <span className="admin-dashboard-label-9">Estado:</span>
              {[
                ['ALL', 'Todos'],
                ['ACTIVE', 'Ativos'],
                ['SUSPENDED', 'Suspensos'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setUserStatusFilter(status)}
                  className={`admin-dashboard-button-12 ${
                    userStatusFilter === status
                      ? 'admin-dashboard-button-8'
                      : 'admin-dashboard-button-13'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="admin-dashboard-field pl-8.5"
              />
            </div>
          </div>

          {/* Tabela de Utilizadores */}
          <div className="admin-dashboard-panel-49">
            <table className="admin-dashboard-table">
              <thead className="admin-dashboard-table-head">
                <tr>
                  <th className="admin-dashboard-table-heading">Utilizador</th>
                  <th className="admin-dashboard-table-heading">Email</th>
                  <th className="admin-dashboard-table-heading">Cargo</th>
                  <th className="admin-dashboard-table-heading">Estado</th>
                  <th className="admin-dashboard-table-heading-2">Ação</th>
                </tr>
              </thead>
              <tbody className="admin-dashboard-panel-20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="admin-dashboard-table-row">
                    <td className="admin-dashboard-table-cell">
                      <Avatar src={u.avatarUrl} name={u.name} role={u.role} size="sm" />
                      <div>
                        <div className="admin-dashboard-panel-15">{u.name}</div>
                        <div className="admin-dashboard-panel-50">@{u.username}</div>
                      </div>
                    </td>
                    <td className="admin-dashboard-table-cell-2">{u.email}</td>
                    <td className="admin-dashboard-table-heading">
                      <Badge
                        size="sm"
                        variant={
                          u.role === 'ADMIN'
                            ? 'error'
                            : u.role === 'CREATOR'
                              ? 'primary'
                              : 'secondary'
                        }
                        className="admin-dashboard-badge-2"
                      >
                        {u.role === 'ADMIN' ? 'Admin' : u.role === 'CREATOR' ? 'Formador' : 'Aluno'}
                      </Badge>
                    </td>
                    <td className="admin-dashboard-table-heading">
                      <Badge
                        size="sm"
                        variant={u.isSuspended ? 'error' : 'success'}
                        className="admin-dashboard-badge-2"
                      >
                        {u.isSuspended ? 'Suspenso' : 'Ativo'}
                      </Badge>
                    </td>
                    <td className="admin-dashboard-table-heading-2">
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u.id)}
                          className={`admin-dashboard-button-14 ${
                            u.isSuspended
                              ? 'admin-dashboard-button-15'
                              : 'admin-dashboard-button-16'
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
        bodyClassName="admin-dashboard-modal custom-scrollbar"
      >
        {courseDetailLoading ? (
          <div className="admin-dashboard-panel-51">A carregar conteúdo...</div>
        ) : (
          selectedCourseDetail && (
            <div className="admin-dashboard-panel-52">
              <div className="admin-dashboard-panel-53">
                <img
                  src={selectedCourseDetail.thumbnailUrl}
                  alt={selectedCourseDetail.title}
                  className="admin-dashboard-image-2"
                />
                <div>
                  <h3 className="admin-dashboard-subheading-5">{selectedCourseDetail.title}</h3>
                  <p className="admin-dashboard-description-2">
                    {selectedCourseDetail.description}
                  </p>
                  <div className="admin-dashboard-panel-54">
                    Formador: {selectedCourseDetail.creator?.name || 'N/A'} •{' '}
                    {formatCoursePrice(selectedCourseDetail)}
                  </div>
                </div>
              </div>

              <div className="admin-dashboard-panel-55">
                <h4 className="admin-dashboard-caption">
                  Módulos e Aulas ({selectedCourseDetail.modules?.length || 0})
                </h4>
                {selectedCourseDetail.modules?.map((mod, idx) => (
                  <div key={mod.id || idx} className="admin-dashboard-panel-56">
                    <div className="admin-dashboard-panel-57">
                      Módulo {idx + 1}: {mod.title}
                    </div>
                    <div className="admin-dashboard-panel-58">
                      {mod.lessons?.map((les, lIdx) => (
                        <div key={les.id || lIdx} className="admin-dashboard-panel-59">
                          <span>
                            {lIdx + 1}. {les.title}
                          </span>
                          <span className="admin-dashboard-label-10">
                            {formatLessonType(les.type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-dashboard-panel-60">
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
                  className="admin-dashboard-button-17"
                >
                  Pedir Alterações
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleApproveCourse(selectedCourseDetail.id)}
                  className="admin-dashboard-button-18"
                >
                  Aprovar Curso
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* ── MODAL DE REJEIÇÃO COM FEEDBACK ── */}
      {showRejectModal &&
        createPortal(
          <div className="admin-dashboard-panel-61">
            <div
              className="admin-dashboard-panel-62 backdrop-blur-xs"
              onClick={() => {
                setShowRejectModal(false);
                setRejectFeedback('');
              }}
            />
            <div className="admin-dashboard-panel-63">
              <h3 className="admin-dashboard-subheading-5">
                {rejectType === 'app' ? 'Rejeitar Candidatura' : 'Pedir Alterações ao Curso'}
              </h3>
              <p className="admin-dashboard-description-3">
                Escreva o motivo para que o utilizador possa compreender e efetuar as correções
                necessárias.
              </p>
              <textarea
                rows={3}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Indique o motivo..."
                className="admin-dashboard-textarea"
              />
              <div className="admin-dashboard-panel-64">
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
                    rejectType === 'course'
                      ? handleConfirmRejectCourse
                      : handleConfirmRejectApplication
                  }
                  className="admin-dashboard-button-19"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {activeTab === 'overview' && <ReportQueue />}
    </div>
  );
};

export default AdminDashboard;
