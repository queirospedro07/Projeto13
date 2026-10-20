import { PageState } from '../../components/PageState';
import './DashboardPage.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuClock as Clock,
  LuBookOpen as BookOpen,
  LuCompass as Compass,
  LuCircleCheck as CheckCircle2,
  LuCirclePlay as PlayCircle,
  LuGraduationCap as GraduationCap,
  LuEyeOff as EyeOff,
  LuPin as Pin,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ProgressBar';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [hideCompleted, setHideCompleted] = useState(() => {
    return (
      (localStorage.getItem('nexo_hide_completed') ??
        localStorage.getItem('learnspace_hide_completed')) === 'true'
    );
  });
  const [hiddenCourseIds, setHiddenCourseIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('nexo_hidden_courses') ||
          localStorage.getItem('learnspace_hidden_courses') ||
          '[]',
      );
    } catch {
      return [];
    }
  });
  const [pinnedCourseIds, setPinnedCourseIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`nexo_pinned_courses_${user?.id}`) || '[]');
    } catch {
      return [];
    }
  });
  const [applyStatus, setApplyStatus] = useState(null);
  const togglePinCourse = (courseId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setPinnedCourseIds((prev) => {
      const isPinned = prev.includes(courseId);
      const next = isPinned ? prev.filter((id) => id !== courseId) : [courseId, ...prev];
      if (user?.id) {
        localStorage.setItem(`nexo_pinned_courses_${user.id}`, JSON.stringify(next));
        window.dispatchEvent(new Event('nexo_pins_changed'));
      }

      return next;
    });
  };

  const toggleHideCourse = (courseId) => {
    setHiddenCourseIds((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];

      localStorage.setItem('nexo_hidden_courses', JSON.stringify(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));

      return next;
    });
  };

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);
    Promise.all([
      api.get('/courses/my-learning').then(({ data }) => data),
      api
        .get('/courses', {
          params: {
            sort: 'popular',
          },
        })
        .then(({ data }) => data),
    ])
      .then(([enrollments, courses]) => {
        if (!active) return;
        setMyCourses(enrollments || []);

        const enrolledIds = new Set((enrollments || []).map((item) => item.courseId));

        setRecommendedCourses(
          (courses || []).filter((course) => !enrolledIds.has(course.id)).slice(0, 3),
        );
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id, revision]);

  const completedCoursesCount = myCourses.filter(
    (e) => (e.progressPercent || 0) >= 100 || e.isCompleted,
  ).length;
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';

    return 'Boa noite';
  };

  const visibleCourses = myCourses
    .filter((e) => {
      const courseId = e.course?.id || e.courseId;
      const isFinished = (e.progressPercent || 0) >= 100 || e.isCompleted;
      if (courseId && hiddenCourseIds.includes(courseId)) return false;
      if (hideCompleted && isFinished) return false;

      return true;
    })
    .sort((a, b) => {
      const aId = a.course?.id || a.courseId;
      const bId = b.course?.id || b.courseId;
      const aPinned = pinnedCourseIds.includes(aId);
      const bPinned = pinnedCourseIds.includes(bId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      return 0;
    });
  const primaryEnrollment = visibleCourses[0] || null;
  const isStudent = user?.role === 'STUDENT' || !['ADMIN', 'CREATOR'].includes(user?.role);
  if (loading)
    return (
      <PageState
        loading
        title="A preparar os seus cursos…"
      />
    );
  if (error)
    return (
      <PageState
        title="Não foi possível carregar o painel"
        message="Verifique a ligação e tente novamente. O seu progresso continua guardado."
        onRetry={() => setRevision((value) => value + 1)}
      />
    );

  return (
    <div className="dashboard-panel">
      {/* Cabeçalho */}
      <div className="dashboard-panel-2">
        <div>
          <div className="dashboard-panel-3">
            <span className="dashboard-label">Painel do Aluno</span>
            <span className="dashboard-label-2">NEXO Plataforma</span>
          </div>
          <h1 className="dashboard-title">
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Aluno'}!
          </h1>
          <p className="dashboard-description">
            Aceda aos seus cursos em andamento e continue as suas aulas de onde parou.
          </p>
        </div>

        <div className="dashboard-panel-4">
          <Link
            to="/explore"
            className="dashboard-link"
          >
            <button className="dashboard-button">
              <Compass className="dashboard-compass" />
              <span>Explorar Cursos</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Curso principal e resumo */}
      <div className="dashboard-panel-5">
        <div className="dashboard-panel-6">
          {primaryEnrollment ? (
            <>
              <div>
                <div className="dashboard-panel-7">
                  <span className="dashboard-label-3">Curso Ativo</span>
                  <span className="dashboard-label-4">
                    {Math.round(primaryEnrollment.progressPercent || 0)}% concluído
                  </span>
                </div>

                <Link
                  to={`/courses/${primaryEnrollment.course?.id || primaryEnrollment.courseId}`}
                  className="dashboard-link-2"
                >
                  <h3 className="dashboard-subheading">
                    {primaryEnrollment.course?.title || 'Curso em Andamento'}
                  </h3>
                </Link>
                <p className="dashboard-description-2">
                  {primaryEnrollment.course?.description ||
                    'Continue a sua aprendizagem de onde parou.'}
                </p>

                <ProgressBar
                  value={primaryEnrollment.progressPercent || 0}
                  size="lg"
                  className="dashboard-progress-bar"
                />
              </div>

              <div className="dashboard-panel-8">
                <div className="dashboard-panel-9">
                  <Clock className="dashboard-clock" />
                  <span>
                    {primaryEnrollment.course?.durationHours
                      ? `${primaryEnrollment.course.durationHours}h de carga horária`
                      : 'Pronto para aprender'}
                  </span>
                </div>

                <div className="dashboard-panel-10">
                  <Link
                    to={`/courses/${primaryEnrollment.course?.id || primaryEnrollment.courseId}`}
                  >
                    <button
                      className="dashboard-button-2"
                      title="Ver detalhes do curso e currículo"
                    >
                      <BookOpen className="dashboard-book-open" />
                      <span>Ver Detalhes</span>
                    </button>
                  </Link>

                  <Link to={`/learn/${primaryEnrollment.courseId}`}>
                    <button className="dashboard-button-3">
                      <PlayCircle className="dashboard-compass" />
                      <span>Continuar Aula</span>
                    </button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-panel-11">
              <div className="dashboard-panel-12">
                <GraduationCap className="dashboard-graduation-cap" />
              </div>
              <h3 className="dashboard-subheading-2">Ainda não está matriculado em nenhum curso</h3>
              <p className="dashboard-description-3">
                Explore o catálogo para encontrar cursos práticos e começar a aprender.
              </p>
              <Link to="/explore">
                <button className="dashboard-button-4">Ver Cursos Disponíveis</button>
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-panel-13">
          <h4 className="dashboard-caption">O Seu Resumo</h4>

          <div className="dashboard-panel-14">
            <div className="dashboard-panel-15">
              <div className="dashboard-panel-4">
                <div className="dashboard-panel-16">
                  <BookOpen className="dashboard-book-open-2" />
                </div>
                <div>
                  <p className="dashboard-description-4">Cursos Inscritos</p>
                  <p className="dashboard-description-5">{myCourses.length}</p>
                </div>
              </div>
              <Link
                to="/library"
                className="dashboard-link-3"
              >
                Ver Todos
              </Link>
            </div>

            <div className="dashboard-panel-15">
              <div className="dashboard-panel-4">
                <div className="dashboard-panel-17">
                  <CheckCircle2 className="dashboard-book-open-2" />
                </div>
                <div>
                  <p className="dashboard-description-4">Cursos Concluídos</p>
                  <p className="dashboard-description-5">{completedCoursesCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-panel-18">
            Dica: Conclua 100% das aulas de um curso para desbloquear o seu certificado oficial.
          </div>
        </div>
      </div>

      {/* Cursos em andamento */}
      {myCourses.length > 0 && (
        <div className="dashboard-panel-19">
          <div className="dashboard-panel-20">
            <div>
              <h2 className="dashboard-heading">Os Meus Cursos em Andamento</h2>
            </div>
            <div className="dashboard-panel-4">
              <Link
                to="/library"
                className="dashboard-link-4"
              >
                Ver Biblioteca Completa
              </Link>
            </div>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="dashboard-panel-21">
              <p className="dashboard-description-6">Nenhum curso ativo no momento.</p>
              <Link
                to="/library"
                className="dashboard-link-5"
              >
                Gerir os meus cursos na biblioteca
              </Link>
            </div>
          ) : (
            <div className="dashboard-panel-22">
              {visibleCourses.map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || 0);
                const isFinished = progress >= 100 || e.isCompleted;

                return (
                  <div
                    key={course.id}
                    className="dashboard-panel-23"
                  >
                    <div>
                      <Link
                        to={`/courses/${course.id}`}
                        className="dashboard-link-6 group/thumb"
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="dashboard-image"
                          />
                        ) : (
                          <div className="dashboard-panel-24">{course.title?.charAt(0) || 'C'}</div>
                        )}
                        <div className="dashboard-panel-25">
                          <span className="dashboard-label-5">
                            {formatCategory(course.category)}
                          </span>
                          {pinnedCourseIds.includes(course.id) && (
                            <span className="dashboard-label-6">
                              <Pin className="dashboard-pin" />
                              <span>Afixado</span>
                            </span>
                          )}
                        </div>

                        <div className="dashboard-panel-26">
                          <button
                            onClick={(ev) => togglePinCourse(course.id, ev)}
                            className={`dashboard-button-5 ${pinnedCourseIds.includes(course.id) ? 'dashboard-button-6' : 'dashboard-button-7'}`}
                            title={
                              pinnedCourseIds.includes(course.id)
                                ? 'Desafixar curso'
                                : 'Afixar curso'
                            }
                          >
                            <Pin
                              className={`dashboard-pin-2 ${pinnedCourseIds.includes(course.id) ? 'dashboard-pin-3' : ''}`}
                            />
                          </button>
                          {isFinished && (
                            <button
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                toggleHideCourse(course.id);
                              }}
                              className="dashboard-button-8"
                              title="Ocultar curso concluído"
                            >
                              <EyeOff className="dashboard-eye-off" />
                              <span>Ocultar</span>
                            </button>
                          )}
                        </div>
                      </Link>

                      <Link
                        to={`/courses/${course.id}`}
                        className="dashboard-link-2"
                      >
                        <h3 className="dashboard-subheading-3">{course.title}</h3>
                      </Link>
                    </div>

                    <div>
                      <div className="dashboard-panel-27">
                        <span>Progresso</span>
                        <span className="dashboard-label-7">{progress}%</span>
                      </div>
                      <ProgressBar
                        value={progress}
                        size="md"
                        className="dashboard-progress-bar-2"
                      />

                      <div className="dashboard-panel-28">
                        <Link
                          to={`/courses/${course.id}`}
                          className="dashboard-link-2"
                        >
                          <button
                            className="dashboard-button-9"
                            title="Ver detalhes e programa do curso"
                          >
                            <BookOpen className="dashboard-book-open" />
                            <span>Detalhes</span>
                          </button>
                        </Link>
                        <Link
                          to={`/learn/${course.id}`}
                          className="dashboard-link-2"
                        >
                          <button
                            className="dashboard-button-10"
                            title="Aceder às aulas do curso"
                          >
                            <PlayCircle className="dashboard-play-circle" />
                            <span>Aulas</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cursos recomendados */}
      {recommendedCourses.length > 0 && (
        <div className="dashboard-panel-29">
          <div className="dashboard-panel-30">
            <h2 className="dashboard-heading">Cursos Recomendados para Si</h2>
            <Link
              to="/explore"
              className="dashboard-link-4"
            >
              Explorar Catálogo
            </Link>
          </div>

          <div className="dashboard-panel-22">
            {recommendedCourses.map((c) => (
              <div
                key={c.id}
                className="dashboard-panel-31"
              >
                <div>
                  <Link
                    to={`/courses/${c.id}`}
                    className="dashboard-link-6 group/thumb"
                  >
                    <img
                      src={
                        c.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={c.title}
                      className="dashboard-image"
                    />
                    <span className="dashboard-label-8">{formatCategory(c.category)}</span>
                  </Link>

                  <Link
                    to={`/courses/${c.id}`}
                    className="dashboard-link-2"
                  >
                    <h3 className="dashboard-subheading-3">{c.title}</h3>
                  </Link>
                  <p className="dashboard-description-7">{c.description}</p>
                </div>

                <div className="dashboard-panel-32">
                  <span className="dashboard-label-9">{formatCoursePrice(c)}</span>
                  <Link to={`/courses/${c.id}`}>
                    <button className="dashboard-button-11">Ver Detalhes</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
