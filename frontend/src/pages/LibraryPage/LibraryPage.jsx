import './LibraryPage.css';
import { PageState } from '../../components/PageState';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuBookOpen as BookOpen,
  LuPlay as Play,
  LuCircleCheck as CheckCircle2,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuPin as Pin,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatCategory } from '../../utils/formatters';

export const LibraryPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const { toast } = useToast();
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
  const togglePinCourse = (courseId, title = 'Curso', e) => {
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

      toast({
        title: isPinned ? 'Curso Desafixado' : 'Curso Afixado',
        message: isPinned
          ? `"${title}" foi removido dos seus cursos afixados.`
          : `"${title}" foi afixado no topo da sua biblioteca.`,
        type: 'info',
      });

      return next;
    });
  };

  useEffect(() => {
    const qFilter = searchParams.get('filter');
    if (qFilter && ['all', 'in-progress', 'completed', 'created', 'hidden'].includes(qFilter)) {
      setFilter(qFilter);
    }
  }, [searchParams]);

  const toggleHideCourse = (courseId, title = 'Curso') => {
    setHiddenCourseIds((prev) => {
      let next;
      if (prev.includes(courseId)) {
        next = prev.filter((id) => id !== courseId);
        toast({
          title: 'Curso Reexibido',
          message: `"${title}" está novamente visível na biblioteca e na barra lateral.`,
          type: 'success',
        });
      } else {
        next = [...prev, courseId];
        toast({
          title: 'Curso Ocultado',
          message: `"${title}" foi ocultado da lista principal e da barra lateral.`,
          type: 'info',
        });
      }

      localStorage.setItem('nexo_hidden_courses', JSON.stringify(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));

      return next;
    });
  };

  const toggleHideAllCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev;

      localStorage.setItem('nexo_hide_completed', String(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      toast({
        title: next ? 'Cursos Concluídos Ocultados' : 'Cursos Concluídos Visíveis',
        message: next
          ? 'Os cursos finalizados foram ocultados da lista principal e barra lateral.'
          : 'Todos os cursos concluídos estão agora visíveis.',
        type: 'info',
      });

      return next;
    });
  };

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    api
      .get('/courses/my-learning')
      .then(({ data }) => {
        if (active) setEnrollments(data || []);
      })
      .catch((error) => {
        if (active) setError(error.message || 'Não foi possível carregar os seus cursos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id, revision]);

  const isCourseHidden = (e) => {
    const isFinished = e.isCompleted || (e.progressPercent || 0) >= 100;
    const isManuallyHidden = hiddenCourseIds.includes(e.course?.id);

    return isManuallyHidden || (hideCompleted && isFinished);
  };

  const hiddenEnrollments = enrollments.filter(isCourseHidden);
  const visibleEnrollments = enrollments.filter((e) => !isCourseHidden(e));
  const createdCount = enrollments.filter((e) => e.isCreator).length;
  const handleSelectFilter = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      searchParams.delete('filter');
      setSearchParams(searchParams);
    } else {
      setSearchParams({
        filter: newFilter,
      });
    }
  };

  const baseFiltered =
    filter === 'hidden'
      ? hiddenEnrollments
      : visibleEnrollments.filter((e) => {
          if (filter === 'in-progress')
            return !e.isCompleted && !e.isCreator && (e.progressPercent || 0) < 100;
          if (filter === 'completed')
            return (e.isCompleted || (e.progressPercent || 0) >= 100) && !e.isCreator;
          if (filter === 'created') return e.isCreator;

          return true;
        });
  const filtered = [...baseFiltered].sort((a, b) => {
    const aId = a.course?.id || a.courseId;
    const bId = b.course?.id || b.courseId;
    const aPinned = pinnedCourseIds.includes(aId);
    const bPinned = pinnedCourseIds.includes(bId);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    return 0;
  });
  if (error)
    return (
      <PageState
        title="Não foi possível carregar a biblioteca"
        message={error}
        onRetry={() => setRevision((value) => value + 1)}
      />
    );

  return (
    <div className="library-page-panel">
      <div className="library-page-panel-2">
        <div>
          <div className="library-page-panel-3">
            <BookOpen className="library-page-book-open" />
            Biblioteca Pessoal
          </div>
          <h1 className="library-page-title">Os Meus Cursos</h1>
          <p className="library-page-description">
            Aceda aos seus cursos ativos, continue de onde parou e interaja com os colegas de turma.
          </p>
        </div>

        <div className="library-page-panel-4 no-scrollbar">
          <button
            onClick={() => handleSelectFilter('all')}
            className={`library-page-button ${filter === 'all' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Todos ({visibleEnrollments.length})
          </button>
          <button
            onClick={() => handleSelectFilter('in-progress')}
            className={`library-page-button ${filter === 'in-progress' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Em Progresso
          </button>
          <button
            onClick={() => handleSelectFilter('completed')}
            className={`library-page-button ${filter === 'completed' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Concluídos
          </button>
          {createdCount > 0 && (
            <button
              onClick={() => handleSelectFilter('created')}
              className={`library-page-button-4 ${filter === 'created' ? 'library-page-button-2' : 'library-page-button-3'}`}
            >
              Criados ({createdCount})
            </button>
          )}
          <button
            onClick={() => handleSelectFilter('hidden')}
            className={`library-page-button-5 ${filter === 'hidden' ? 'library-page-button-7' : 'library-page-button-8'}`}
            title="Ver cursos ocultados"
          >
            <EyeOff className="library-page-book-open" />
            <span>Ver Ocultos ({hiddenEnrollments.length})</span>
          </button>
          <button
            onClick={toggleHideAllCompleted}
            className={`library-page-button-9 ${hideCompleted ? 'library-page-button-10' : 'library-page-button-11'}`}
            title="Ocultar ou mostrar cursos já finalizados"
          >
            {hideCompleted ? (
              <EyeOff className="library-page-book-open" />
            ) : (
              <Eye className="library-page-book-open" />
            )}
            <span className="library-page-label">
              {hideCompleted ? 'Concluídos Ocultos' : 'Ocultar Concluídos'}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="library-page-panel-5">
          <div className="library-page-panel-6" />
          <p className="library-page-description-2">A carregar os seus cursos...</p>
        </div>
      ) : filtered.length === 0 ? (
        filter === 'hidden' ? (
          <div className="library-page-panel-7">
            <div className="library-page-panel-8">
              <Eye className="library-page-eye" />
            </div>
            <h3 className="library-page-subheading">Nenhum curso oculto</h3>
            <p className="library-page-description-3">
              Todos os seus cursos estão visíveis na biblioteca principal. Para ocultar um curso,
              clique no ícone de ocultar no cartão respetivo.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFilter('all')}
              className="library-page-button-12"
            >
              Ver Todos os Cursos
            </Button>
          </div>
        ) : (
          <div className="library-page-panel-9">
            <div className="library-page-panel-10">
              <BookOpen className="library-page-eye" />
            </div>
            <h3 className="library-page-subheading">Ainda não está inscrito em nenhum curso</h3>
            <p className="library-page-description-3">
              Explore o nosso catálogo e inscreva-se em cursos com aulas práticas, comunidade e
              salas de dúvidas.
            </p>
            <Link to="/explore">
              <Button
                as="span"
                variant="primary"
                size="lg"
                className="library-page-button-12"
              >
                Explorar Catálogo de Cursos
              </Button>
            </Link>
          </div>
        )
      ) : (
        <div className="library-page-panel-11">
          {filtered.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;
            const progress = enrollment.progressPercent || enrollment.progressPercentage || 0;
            const isFinished = enrollment.isCompleted || progress >= 100;

            return (
              <div
                key={enrollment.id}
                className="library-page-panel-12 ui-group"
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="library-page-link group/thumb"
                >
                  <img
                    src={
                      course.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className="library-page-image"
                  />
                  <div className="library-page-panel-13" />

                  <div className="library-page-panel-14">
                    <span className="library-page-label-2">{formatCategory(course.category)}</span>
                    {enrollment.isCreator && <span className="library-page-label-3">Criador</span>}
                    {pinnedCourseIds.includes(course.id) && (
                      <span className="library-page-label-4">
                        <Pin className="library-page-pin" />
                        <span>Afixado</span>
                      </span>
                    )}
                  </div>

                  <div className="library-page-panel-15">
                    <button
                      onClick={(e) => togglePinCourse(course.id, course.title, e)}
                      className={`library-page-button-13 ${pinnedCourseIds.includes(course.id) ? 'library-page-button-14' : 'library-page-button-15'}`}
                      title={
                        pinnedCourseIds.includes(course.id) ? 'Desafixar curso' : 'Afixar curso'
                      }
                    >
                      <Pin
                        className={`library-page-book-open ${pinnedCourseIds.includes(course.id) ? 'library-page-pin-2' : ''}`}
                      />
                    </button>
                    {filter === 'hidden' ? (
                      <>
                        <span className="library-page-label-5">
                          <EyeOff className="library-page-book-open" />
                          <span>Oculto</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleHideCourse(course.id, course.title);
                          }}
                          className="library-page-button-16"
                          title="Voltar a mostrar curso na biblioteca"
                        >
                          <Eye className="library-page-eye-2" />
                          <span>Mostrar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {isFinished ? (
                          <span className="library-page-label-6">
                            <CheckCircle2 className="library-page-book-open" />
                            <span>Concluído</span>
                          </span>
                        ) : (
                          <span className="library-page-label-7">{progress}%</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleHideCourse(course.id, course.title);
                          }}
                          className="library-page-button-17"
                          title="Ocultar curso"
                        >
                          <EyeOff className="library-page-eye-off" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="library-page-panel-16">
                    <span className="library-page-label-8">
                      {course.creator?.name
                        ? `Prof. ${course.creator.name}`
                        : 'Formador Especialista'}
                    </span>
                    <span className="library-page-label-9">
                      {course.durationHours || 12}h conteúdo
                    </span>
                  </div>
                </Link>

                <div className="library-page-panel-17">
                  <div>
                    <Link
                      to={`/courses/${course.id}`}
                      className="library-page-link-2"
                    >
                      <h3 className="library-page-subheading-2">{course.title}</h3>
                    </Link>

                    <div className="library-page-panel-18">
                      <div className="library-page-panel-19">
                        <span className="library-page-label-10">Progresso do Curso</span>
                        <span
                          className={isFinished ? 'library-page-label-11' : 'library-page-label-12'}
                        >
                          {progress}% Concluído
                        </span>
                      </div>
                      <div className="library-page-panel-20">
                        <div
                          className={[
                            `library-page-panel-21 ${isFinished ? 'library-page-panel-22' : 'library-page-panel-23'}`,
                            'library-page-dynamic-1',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{
                            '--library-page-width': `${Math.max(5, progress)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="library-page-panel-24">
                    <div className="library-page-panel-25">
                      <Link
                        to={`/courses/${course.id}`}
                        className="library-page-link-3"
                      >
                        <button
                          className="library-page-button-18"
                          title="Ver detalhes do curso, currículo e formador"
                        >
                          <BookOpen className="library-page-book-open-2" />
                          <span>Ver Detalhes</span>
                        </button>
                      </Link>
                      <Link
                        to={`/learn/${course.id}`}
                        className="library-page-link-3"
                      >
                        <button
                          className="library-page-button-19"
                          title="Aceder à sala de aulas"
                        >
                          <Play className="library-page-play" />
                          <span>{isFinished ? 'Rever' : 'Aulas'}</span>
                        </button>
                      </Link>
                    </div>

                    {filter === 'hidden' && (
                      <button
                        onClick={() => toggleHideCourse(course.id, course.title)}
                        className="library-page-button-20"
                      >
                        <Eye className="library-page-book-open-2" />
                        <span>Reexibir na Biblioteca</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
