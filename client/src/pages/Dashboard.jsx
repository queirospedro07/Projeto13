import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  ArrowRight,
  Compass,
  CheckCircle2,
  PlayCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProgressBar } from '../components/ui/ProgressBar';
import { api } from '../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const primaryEnrollment = myCourses[0] || null;
  const completedCoursesCount = myCourses.filter(
    (e) => (e.progressPercent || 0) >= 100
  ).length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
            Painel do Aluno
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight mt-1.5">
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Aluno'}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-1">
            Aceda aos seus cursos em andamento e continue as suas lições de onde parou.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/explore">
            <button className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer">
              <Compass className="w-4 h-4" />
              <span>Explorar Cursos</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          {primaryEnrollment ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                    Curso Ativo
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 font-mono">
                    {Math.round(primaryEnrollment.progressPercent || 0)}% concluído
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-2 leading-snug">
                  {primaryEnrollment.course?.title || 'Curso em Andamento'}
                </h3>
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

              <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {primaryEnrollment.course?.durationHours
                      ? `${primaryEnrollment.course.durationHours}h de carga horária`
                      : 'Pronto para aprender'}
                  </span>
                </div>

                <Link to={`/learn/${primaryEnrollment.courseId}`}>
                  <button className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer">
                    <PlayCircle className="w-4 h-4" />
                    <span>Continuar Aula</span>
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mb-1">
                Ainda não está matriculado em nenhum curso
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
                Explore o catálogo para encontrar cursos práticos e começar a aprender.
              </p>
              <Link to="/explore">
                <button className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
                  Ver Cursos Disponíveis
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            O Seu Resumo
          </h4>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
            Dica: Conclua 100% das lições de um curso para desbloquear o seu certificado oficial.
          </div>
        </div>
      </div>

      {myCourses.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Os Meus Cursos em Andamento
            </h2>
            <Link to="/library" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Ver Biblioteca Completa
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((e) => {
              const course = e.course;
              if (!course) return null;
              const progress = Math.round(e.progressPercent || 0);

              return (
                <div
                  key={course.id}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                >
                  <div>
                    <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                          {course.title?.charAt(0) || 'C'}
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white">
                        {course.category || 'Geral'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-950 dark:text-white line-clamp-2">
                      {course.title}
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-slate-600 dark:text-zinc-400">
                      <span>Progresso</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} size="md" className="mb-4" />

                    <Link to={`/learn/${course.id}`} className="block">
                      <button className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-600 text-slate-800 dark:text-zinc-200 hover:text-white dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <PlayCircle className="w-4 h-4" />
                        <span>Aceder às Aulas</span>
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                    <img
                      src={
                        c.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white">
                      {c.category || 'Geral'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1.5">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-base font-black text-slate-950 dark:text-white">
                    {c.isFree || c.price === 0 ? 'Gratuito' : `€${c.price}`}
                  </span>
                  <Link to={`/courses/${c.id}`}>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
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