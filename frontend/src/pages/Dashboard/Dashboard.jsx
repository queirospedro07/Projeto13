import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
  PlayCircle,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  Pin,
  PinOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { api } from '../../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(() => {
    return (localStorage.getItem('nexo_hide_completed') ?? localStorage.getItem('learnspace_hide_completed')) === 'true';
  });
  const [hiddenCourseIds, setHiddenCourseIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_hidden_courses') || localStorage.getItem('learnspace_hidden_courses') || '[]');
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
    setHiddenCourseIds(prev => {
      const next = prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId];
      localStorage.setItem('nexo_hidden_courses', JSON.stringify(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      return next;
    });
  };

  const toggleHideAllCompleted = () => {
    setHideCompleted(prev => {
      const next = !prev;
      localStorage.setItem('nexo_hide_completed', String(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      return next;
    });
  };

  useEffect(() => {
    Promise.all([
      api.getMyCourses().catch(() => []),
      api.getCourses({ sort: 'popular' }).catch(() => [])
    ]).then(([myCoursesData, allCourses]) => {
      setMyCourses(myCoursesData || []);
      const enrolledIds = new Set((myCoursesData || []).map((e) => e.courseId));
      setRecommendedCourses(
        (allCourses || []).filter((c) => !enrolledIds.has(c.id)).slice(0, 3)
      );
      setLoading(false);
    });
  }, [user?.id]);

  // Fetch creator application status for the account status indicator
  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN' || user.role === 'CREATOR') return;
    api.getCreatorApplicationStatus().catch(() => null).then(res => {
      if (res?.application?.status === 'PENDING' || res?.application?.status === 'APPROVED') {
        setApplyStatus('creator-applied');
      }
    });
  }, [user?.id]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const completedCoursesCount = myCourses.filter(
    (e) => (e.progressPercent || 0) >= 100 || e.isCompleted
  ).length;

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

  const isStudent = user?.role === 'STUDENT' || (!['ADMIN', 'CREATOR'].includes(user?.role));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 animate-fade-in pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/40">
              Painel do Aluno
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
              NEXO Plataforma
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Aluno'}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-1">
            Aceda aos seus cursos em andamento e continue as suas aulas de onde parou.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/explore" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
              <Compass className="w-4 h-4" />
              <span>Explorar Cursos</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── Primary course + summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <div className="lg:col-span-2 p-5 sm:p-7 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          {primaryEnrollment ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    Curso Ativo
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 font-mono">
                    {Math.round(primaryEnrollment.progressPercent || 0)}% concluído
                  </span>
                </div>

                <Link to={`/courses/${primaryEnrollment.course?.id || primaryEnrollment.courseId}`} className="block">
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-2 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    {primaryEnrollment.course?.title || 'Curso em Andamento'}
                  </h3>
                </Link>
                <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mb-6">
                  {primaryEnrollment.course?.description ||
                    'Continue a sua aprendizagem de onde parou.'}
                </p>

                <ProgressBar
                  value={primaryEnrollment.progressPercent || 0}
                  size="lg"
                  className="mb-6"
                />
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-zinc-800 gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {primaryEnrollment.course?.durationHours
                      ? `${primaryEnrollment.course.durationHours}h de carga horária`
                      : 'Pronto para aprender'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/courses/${primaryEnrollment.course?.id || primaryEnrollment.courseId}`}>
                    <button className="px-4 py-2.5 rounded-lg font-bold text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5" title="Ver detalhes do curso e currículo">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ver Detalhes</span>
                    </button>
                  </Link>

                  <Link to={`/learn/${primaryEnrollment.courseId}`}>
                    <button className="px-5 py-2.5 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer">
                      <PlayCircle className="w-4 h-4" />
                      <span>Continuar Aula</span>
                    </button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center text-center py-8">
              <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mb-1">
                Ainda não está matriculado em nenhum curso
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
                Explore o catálogo para encontrar cursos práticos e começar a aprender.
              </p>
              <Link to="/explore">
                <button className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs">
                  Ver Cursos Disponíveis
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            O Seu Resumo
          </h4>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Cursos Inscritos</p>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{myCourses.length}</p>
                </div>
              </div>
              <Link to="/library" className="text-xs text-blue-600 font-bold hover:underline">
                Ver Todos
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Cursos Concluídos</p>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{completedCoursesCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
            Dica: Conclua 100% das aulas de um curso para desbloquear o seu certificado oficial.
          </div>
        </div>
      </div>

      {/* ── In-progress courses grid ── */}
      {myCourses.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Os Meus Cursos em Andamento
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/library" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Ver Biblioteca Completa
              </Link>
            </div>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800">
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Nenhum curso ativo no momento.
              </p>
              <Link
                to="/library"
                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-block"
              >
                Gerir os meus cursos na biblioteca
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleCourses.map((e) => {
                const course = e.course;
                if (!course) return null;
                const progress = Math.round(e.progressPercent || 0);
                const isFinished = progress >= 100 || e.isCompleted;

                return (
                  <div
                    key={course.id}
                    className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                  >
                    <div>
                      <Link to={`/courses/${course.id}`} className="block relative h-36 rounded-lg overflow-hidden bg-slate-900 mb-4 group/thumb cursor-pointer">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {course.title?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-white pointer-events-none">
                            {course.category || 'Geral'}
                          </span>
                          {pinnedCourseIds.includes(course.id) && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                              <Pin className="w-2.5 h-2.5 fill-white" />
                              <span>Afixado</span>
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                          <button
                            onClick={(ev) => togglePinCourse(course.id, ev)}
                            className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 backdrop-blur-md cursor-pointer transition-colors ${
                              pinnedCourseIds.includes(course.id)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-black/60 hover:bg-black/85 text-white/80 hover:text-white'
                            }`}
                            title={pinnedCourseIds.includes(course.id) ? 'Desafixar curso' : 'Afixar curso'}
                          >
                            <Pin className={`w-3 h-3 ${pinnedCourseIds.includes(course.id) ? 'fill-white' : ''}`} />
                          </button>
                          {isFinished && (
                            <button
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                toggleHideCourse(course.id);
                              }}
                              className="px-2 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-md cursor-pointer transition-colors"
                              title="Ocultar curso concluído"
                            >
                              <EyeOff className="w-3 h-3 text-amber-400" />
                              <span>Ocultar</span>
                            </button>
                          )}
                        </div>
                      </Link>

                      <Link to={`/courses/${course.id}`} className="block">
                        <h3 className="font-extrabold text-base text-slate-950 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                          {course.title}
                        </h3>
                      </Link>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-slate-600 dark:text-zinc-400">
                        <span>Progresso</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} size="md" className="mb-4" />

                      <div className="grid grid-cols-2 gap-2">
                        <Link to={`/courses/${course.id}`} className="block">
                          <button className="w-full py-2 rounded-lg font-bold text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5" title="Ver detalhes e programa do curso">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span>Detalhes</span>
                          </button>
                        </Link>
                        <Link to={`/learn/${course.id}`} className="block">
                          <button className="w-full py-2 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs" title="Aceder às aulas do curso">
                            <PlayCircle className="w-3.5 h-3.5" />
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

      {/* ── Recommended courses ── */}
      {recommendedCourses.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Cursos Recomendados para Si
            </h2>
            <Link to="/explore" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Explorar Catálogo
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <Link to={`/courses/${c.id}`} className="block relative h-36 rounded-lg overflow-hidden bg-slate-900 mb-4 group/thumb cursor-pointer">
                    <img
                      src={
                        c.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={c.title}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-white pointer-events-none">
                      {c.category || 'Geral'}
                    </span>
                  </Link>

                  <Link to={`/courses/${c.id}`} className="block">
                    <h3 className="font-extrabold text-base text-slate-950 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                      {c.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1.5">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-base font-black text-slate-950 dark:text-white">
                    {formatCoursePrice(c)}
                  </span>
                  <Link to={`/courses/${c.id}`}>
                    <button className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                      Ver Detalhes
                    </button>
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

export default Dashboard;
