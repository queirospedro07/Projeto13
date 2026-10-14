import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Play, CheckCircle2, ArrowRight, Eye, EyeOff, RotateCcw, Pin, PinOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
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
  const { toast } = useToast();
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
        type: 'info'
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
    setHiddenCourseIds(prev => {
      let next;
      if (prev.includes(courseId)) {
        next = prev.filter(id => id !== courseId);
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
    setHideCompleted(prev => {
      const next = !prev;
      localStorage.setItem('nexo_hide_completed', String(next));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      toast({
        title: next ? 'Cursos Concluídos Ocultados' : 'Cursos Concluídos Visíveis',
        message: next ? 'Os cursos finalizados foram ocultados da lista principal e barra lateral.' : 'Todos os cursos concluídos estão agora visíveis.',
        type: 'info',
      });
      return next;
    });
  };

  useEffect(() => {
    api.getMyCourses().then(data => setEnrollments(data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const isCourseHidden = (e) => {
    const isFinished = e.isCompleted || (e.progressPercent || 0) >= 100;
    const isManuallyHidden = hiddenCourseIds.includes(e.course?.id);
    return isManuallyHidden || (hideCompleted && isFinished);
  };

  const hiddenEnrollments = enrollments.filter(isCourseHidden);
  const visibleEnrollments = enrollments.filter(e => !isCourseHidden(e));
  const createdCount = enrollments.filter(e => e.isCreator).length;

  const handleSelectFilter = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      searchParams.delete('filter');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ filter: newFilter });
    }
  };

  const baseFiltered = filter === 'hidden'
    ? hiddenEnrollments
    : visibleEnrollments.filter(e => {
        if (filter === 'in-progress') return !e.isCompleted && !e.isCreator && (e.progressPercent || 0) < 100;
        if (filter === 'completed') return (e.isCompleted || (e.progressPercent || 0) >= 100) && !e.isCreator;
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#222]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Biblioteca Pessoal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Os Meus Cursos
          </h1>
          <p className="text-base text-slate-600 dark:text-zinc-400 mt-1">
            Aceda aos seus cursos ativos, continue de onde parou e interaja com os colegas de turma.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#121212] p-1.5 rounded-2xl border border-slate-200 dark:border-[#222] shadow-xs shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <button onClick={() => handleSelectFilter('all')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filter === 'all' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Todos ({visibleEnrollments.length})
          </button>
          <button onClick={() => handleSelectFilter('in-progress')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filter === 'in-progress' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Em Progresso
          </button>
          <button onClick={() => handleSelectFilter('completed')} className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filter === 'completed' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Concluídos
          </button>
          {createdCount > 0 && (
            <button onClick={() => handleSelectFilter('created')} className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${filter === 'created' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
              Criados ({createdCount})
            </button>
          )}
          <button
            onClick={() => handleSelectFilter('hidden')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'hidden'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40'
            }`}
            title="Ver cursos ocultados"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Ver Ocultos ({hiddenEnrollments.length})</span>
          </button>
          <button
            onClick={toggleHideAllCompleted}
            className={`px-2.5 sm:px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              hideCompleted
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-white dark:bg-[#181818] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#333] hover:border-slate-300'
            }`}
            title="Ocultar ou mostrar cursos já finalizados"
          >
            {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{hideCompleted ? 'Concluídos Ocultos' : 'Ocultar Concluídos'}</span>
          </button>
        </div>
      </div>

      
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-bold">A carregar os seus cursos...</p>
        </div>
      ) : filtered.length === 0 ? (
        filter === 'hidden' ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black max-w-xl mx-auto p-6 sm:p-10 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/50 dark:border-amber-800/40">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Nenhum curso oculto
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6">
              Todos os seus cursos estão visíveis na biblioteca principal. Para ocultar um curso, clique no ícone de ocultar no cartão respetivo.
            </p>
            <Button variant="secondary" size="md" onClick={() => setFilter('all')} className="font-bold">
              Ver Todos os Cursos
            </Button>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-[#222] rounded-xl bg-white dark:bg-[#0a0a0a] max-w-xl mx-auto p-6 sm:p-10 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 dark:bg-[#181818] text-slate-900 dark:text-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Ainda não está inscrito em nenhum curso
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6">
              Explore o nosso catálogo e inscreva-se em cursos com aulas práticas, comunidade e salas de dúvidas.
            </p>
            <Link to="/explore">
              <Button variant="primary" size="lg" className="font-bold">
                Explorar Catálogo de Cursos
              </Button>
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map(enrollment => {
            const course = enrollment.course;
            if (!course) return null;
            const progress = enrollment.progressPercent || enrollment.progressPercentage || 0;
            const isFinished = enrollment.isCompleted || progress >= 100;
            return (
              <div key={enrollment.id} className="group rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 overflow-hidden shadow-xs hover:shadow-sm transition-colors duration-150 flex flex-col justify-between">
                
                <Link to={`/courses/${course.id}`} className="relative aspect-video w-full bg-slate-900 overflow-hidden block group/thumb cursor-pointer">
                  <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover/thumb:scale-105 transition-all duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md bg-black/75 text-white backdrop-blur-md text-[11px] font-bold border border-white/10 shadow-xs">
                      {formatCategory(course.category)}
                    </span>
                    {enrollment.isCreator && (
                      <span className="px-2.5 py-1 rounded-md bg-blue-600/90 text-white backdrop-blur-md text-[11px] font-black border border-blue-400/30 shadow-xs uppercase tracking-wider">
                        Criador
                      </span>
                    )}
                    {pinnedCourseIds.includes(course.id) && (
                      <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white backdrop-blur-md text-[11px] font-extrabold flex items-center gap-1 shadow-xs border border-blue-400/30">
                        <Pin className="w-3 h-3 fill-white" />
                        <span>Afixado</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
                    <button
                      onClick={(e) => togglePinCourse(course.id, course.title, e)}
                      className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 backdrop-blur-md cursor-pointer transition-colors ${
                        pinnedCourseIds.includes(course.id)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-black/75 hover:bg-black text-white/80 hover:text-white'
                      }`}
                      title={pinnedCourseIds.includes(course.id) ? 'Desafixar curso' : 'Afixar curso'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${pinnedCourseIds.includes(course.id) ? 'fill-white' : ''}`} />
                    </button>
                    {filter === 'hidden' ? (
                      <>
                        <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black font-black text-xs shadow-xs backdrop-blur-md flex items-center gap-1 pointer-events-none">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Oculto</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleHideCourse(course.id, course.title);
                          }}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                          title="Voltar a mostrar curso na biblioteca"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Mostrar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {isFinished ? (
                          <span className="px-3 py-1 rounded-md bg-emerald-500/90 text-white font-extrabold text-xs shadow-xs backdrop-blur-md flex items-center gap-1.5 pointer-events-none">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluído</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-blue-600/90 text-white font-extrabold text-xs shadow-xs backdrop-blur-md pointer-events-none">
                            {progress}%
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleHideCourse(course.id, course.title);
                          }}
                          className="p-1.5 rounded-md bg-black/75 hover:bg-black text-white/80 hover:text-white text-xs font-bold shadow-xs backdrop-blur-md flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ocultar curso"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs pointer-events-none">
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {course.creator?.name ? `Prof. ${course.creator.name}` : 'Formador Especialista'}
                    </span>
                    <span className="text-[11px] text-zinc-300 font-mono">
                      {course.durationHours || 12}h conteúdo
                    </span>
                  </div>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <Link to={`/courses/${course.id}`} className="block">
                      <h3 className="font-extrabold text-slate-950 dark:text-white text-lg leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        {course.title}
                      </h3>
                    </Link>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a1a1a]">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-500 dark:text-zinc-400">
                          Progresso do Curso
                        </span>
                        <span className={isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
                          {progress}% Concluído
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{
                          width: `${Math.max(5, progress)}%`
                        }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link to={`/courses/${course.id}`} className="w-full">
                        <button className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer" title="Ver detalhes do curso, currículo e formador">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>Ver Detalhes</span>
                        </button>
                      </Link>
                      <Link to={`/learn/${course.id}`} className="w-full">
                        <button className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer" title="Aceder à sala de aulas">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isFinished ? 'Rever' : 'Aulas'}</span>
                        </button>
                      </Link>
                    </div>

                    {filter === 'hidden' && (
                      <button
                        onClick={() => toggleHideCourse(course.id, course.title)}
                        className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
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