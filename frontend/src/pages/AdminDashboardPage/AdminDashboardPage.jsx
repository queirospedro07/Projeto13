import UserRoleEditor from '../../components/UserRoleEditor/UserRoleEditor';
import { PageState } from '../../components/PageState';
import CourseReview from '../../components/CourseReview/CourseReview';
import { ReportQueue } from '../../components/Moderation';
import CourseStatusChart from '../../components/CourseStatusChart';
import { safeExternalUrl } from '../../utils/safeUrl';
import './AdminDashboardPage.css';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Modal } from '../../components/Modal';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuSearch as Search,
  LuEye as Eye,
  LuExternalLink as ExternalLink,
  LuRefreshCw as RefreshCw,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';
export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);

  // Navegação
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    ['overview', 'courses', 'applications', 'users'].includes(searchParams.get('tab'))
      ? searchParams.get('tab')
      : 'overview',
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
  const [courseReviewError, setCourseReviewError] = useState(false);
  const courseReviewRequest = useRef(0);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState(null); // 'app' | 'course'
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const fetchAdminData = useCallback(
    async (manual = false) => {
      setLoadError(false);
      if (manual) setRefreshing(true);
      try {
        const [statsData, usersData, appsData, coursesData] = await Promise.all([
          api.get('/admin/stats').then(({ data }) => data),
          api.get('/admin/users').then(({ data }) => data),
          api.get('/admin/creator-applications').then(({ data }) => data),
          api.get('/admin/courses', { params: { status: 'all' } }).then(({ data }) => data),
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
        setLoadError(true);
        console.error(err);
        toast({
          title: 'Erro',
          message: 'Não foi possível carregar os dados.',
          type: 'error',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );
  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Suspender / Reativar
  const handleToggleSuspend = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`).then(({ data }) => data);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isSuspended: res.isSuspended,
              }
            : u,
        ),
      );
      toast({
        title: res.isSuspended ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        message: res.isSuspended
          ? 'A conta foi temporariamente bloqueada.'
          : 'A conta está agora ativa.',
        type: res.isSuspended ? 'error' : 'success',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao alterar estado.',
        type: 'error',
      });
    }
  };

  // Aprovar candidatura
  const handleApproveApplication = async (appId) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/creator-applications/${appId}/approve`).then(({ data }) => data);
      toast({
        title: 'Candidatura Aprovada',
        message: 'O utilizador agora é Formador e pode publicar cursos.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível aprovar.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar rejeição da candidatura
  const handleConfirmRejectApplication = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await api
        .put(`/admin/creator-applications/${selectedApp.id}/reject`, {
          feedback: rejectFeedback,
        })
        .then(({ data }) => data);
      toast({
        title: 'Candidatura Rejeitada',
        message: 'Feedback registado.',
        type: 'info',
      });
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedApp(null);
      fetchAdminData();
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao rejeitar.',
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
      await api
        .put(`/admin/courses/${courseId}/approve`, {
          expectedUpdatedAt: selectedCourseDetail?.updatedAt,
        })
        .then(({ data }) => data);
      toast({
        title: 'Curso Aprovado',
        message: 'O curso já está visível para todos os alunos.',
        type: 'success',
      });
      fetchAdminData();
      if (selectedCourseDetail?.id === courseId) setSelectedCourseDetail(null);
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao aprovar curso.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar rejeição do curso
  const handleConfirmRejectCourse = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    try {
      await api
        .put(`/admin/courses/${selectedCourse.id}/reject`, {
          notes: rejectFeedback,
          expectedUpdatedAt: selectedCourse?.updatedAt,
        })
        .then(({ data }) => data);
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
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao rejeitar curso.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Ver currículo do curso
  const handleOpenCourseReview = async (course) => {
    const requestId = ++courseReviewRequest.current;
    setSelectedCourseDetail(course);
    setCourseDetailLoading(true);
    setCourseReviewError(false);
    try {
      const details = await api.get(`/creator/courses/${course.id}`).then(({ data }) => data);
      if (requestId !== courseReviewRequest.current) return;
      setSelectedCourseDetail({ ...course, ...details });
    } catch {
      if (requestId !== courseReviewRequest.current) return;
      setCourseReviewError(true);
      toast({
        title: 'Erro',
        message: 'Não foi possível carregar o currículo.',
        type: 'error',
      });
    } finally {
      if (requestId === courseReviewRequest.current) setCourseDetailLoading(false);
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
      const matchRole =
        userRoleFilter === 'ALL' ||
        (userRoleFilter === 'CREATOR'
          ? u.role === 'CREATOR' || u.isTeacher
          : u.role === userRoleFilter);
      const matchStatus =
        userStatusFilter === 'ALL'
          ? true
          : userStatusFilter === 'SUSPENDED'
            ? u.isSuspended
            : !u.isSuspended;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);
  if (loading) return <PageState loading title="A carregar a administração…" />;
  if (loadError)
    return (
      <PageState
        title="Não foi possível carregar a administração"
        message="Os dados continuam guardados. Tente novamente."
        onRetry={() => fetchAdminData()}
      />
    );
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
          {
            id: 'overview',
            label: 'Visão Geral',
            count: null,
          },
          {
            id: 'applications',
            label: 'Candidaturas a Formador',
            count: pendingApps.length,
          },
          {
            id: 'courses',
            label: 'Moderação de Cursos',
            count: pendingCourses.length,
          },
          {
            id: 'users',
            label: 'Utilizadores',
            count: users.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`admin-dashboard-button-2 ${activeTab === tab.id ? 'admin-dashboard-button-3' : 'admin-dashboard-button-4'}`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`admin-dashboard-label ${tab.id === 'applications' || tab.id === 'courses' ? 'admin-dashboard-label-2' : 'admin-dashboard-label-3'}`}
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
              <div className="admin-dashboard-panel-9">{stats?.totalEnrollments ?? 0}</div>
              <div className="admin-dashboard-panel-10">Matrículas de alunos</div>
            </div>
          </div>

          <CourseStatusChart courses={courses} />

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
                      {u.role === 'ADMIN'
                        ? u.isTeacher
                          ? 'Admin & Formador'
                          : 'Administrador'
                        : u.role === 'CREATOR'
                          ? 'Formador'
                          : 'Aluno'}
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
                  className={`admin-dashboard-button-7 ${appFilter === status ? 'admin-dashboard-button-8' : 'admin-dashboard-button-9'}`}
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
                  className={`admin-dashboard-button-7 ${courseFilter === status ? 'admin-dashboard-button-8' : 'admin-dashboard-button-9'}`}
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
                      Rever curso
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
                  className={`admin-dashboard-button-12 ${userRoleFilter === role ? 'admin-dashboard-button-8' : 'admin-dashboard-button-13'}`}
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
                  className={`admin-dashboard-button-12 ${userStatusFilter === status ? 'admin-dashboard-button-8' : 'admin-dashboard-button-13'}`}
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
                      <UserRoleEditor
                        key={`${u.id}:${u.role}:${u.isTeacher}`}
                        user={u}
                        onChanged={() => fetchAdminData()}
                      />
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(u.id)}
                          className={`admin-dashboard-button-14 ${u.isSuspended ? 'admin-dashboard-button-15' : 'admin-dashboard-button-16'}`}
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

      {selectedCourseDetail && (
        <CourseReview
          key={`${selectedCourseDetail.id}:${selectedCourseDetail.updatedAt}`}
          course={selectedCourseDetail}
          loading={courseDetailLoading}
          error={courseReviewError}
          busy={actionLoading}
          onClose={() => {
            courseReviewRequest.current += 1;
            setSelectedCourseDetail(null);
          }}
          onRetry={() => handleOpenCourseReview(selectedCourseDetail)}
          onApprove={() => handleApproveCourse(selectedCourseDetail.id)}
          onRequestChanges={() => {
            setSelectedCourse(selectedCourseDetail);
            setRejectFeedback('');
            setRejectType('course');
            setSelectedCourseDetail(null);
            setShowRejectModal(true);
          }}
        />
      )}

      <Modal
        isOpen={showRejectModal}
        maxWidth="md"
        title={rejectType === 'app' ? 'Rejeitar candidatura' : 'Pedir alterações ao curso'}
        onClose={() => {
          if (!actionLoading) {
            setShowRejectModal(false);
            setRejectFeedback('');
          }
        }}
      >
        <p>O feedback fica guardado e será enviado ao utilizador nas notificações.</p>
        <label htmlFor="review-feedback">Alterações necessárias</label>
        <textarea
          id="review-feedback"
          rows={5}
          maxLength={2000}
          required
          value={rejectFeedback}
          onChange={(event) => setRejectFeedback(event.target.value)}
          placeholder="Explique o que deve ser corrigido antes da aprovação…"
          className="admin-dashboard-textarea"
        />
        <div className="admin-dashboard-panel-64">
          <Button
            variant="secondary"
            disabled={actionLoading}
            onClick={() => setShowRejectModal(false)}
          >
            Cancelar
          </Button>
          <Button
            disabled={actionLoading || !rejectFeedback.trim()}
            isLoading={actionLoading}
            onClick={
              rejectType === 'course' ? handleConfirmRejectCourse : handleConfirmRejectApplication
            }
          >
            Enviar feedback
          </Button>
        </div>
      </Modal>
      {activeTab === 'overview' && <ReportQueue />}
    </div>
  );
};
export default AdminDashboardPage;
