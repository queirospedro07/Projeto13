import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
export const LibraryPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getMyCourses().then(data => setEnrollments(data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const createdCount = enrollments.filter(e => e.isCreator).length;
  const filtered = enrollments.filter(e => {
    if (filter === 'in-progress') return !e.isCompleted && !e.isCreator;
    if (filter === 'completed') return e.isCompleted && !e.isCreator || e.progressPercent >= 100;
    if (filter === 'created') return e.isCreator;
    return true;
  });
  return <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
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

        
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#121212] p-1.5 rounded-2xl border border-slate-200 dark:border-[#222] shadow-xs shrink-0 flex-wrap">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Todos ({enrollments.length})
          </button>
          <button onClick={() => setFilter('in-progress')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'in-progress' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Em Progresso
          </button>
          <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'completed' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
            Concluídos
          </button>
          {createdCount > 0 && <button onClick={() => setFilter('created')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === 'created' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-xs' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
              Criados por Mim ({createdCount})
            </button>}
        </div>
      </div>

      
      {loading ? <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-bold">A carregar os seus cursos...</p>
        </div> : filtered.length === 0 ? <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-[#222] rounded-3xl bg-white dark:bg-[#0a0a0a] max-w-xl mx-auto p-10 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 dark:bg-[#181818] text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Ainda não está inscrito em nenhum curso
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 mb-6">
            Explore o nosso catálogo e inscreva-se em cursos com aulas práticas, comunidade e salas
            de dúvidas.
          </p>
          <Link to="/community">
            <Button variant="primary" size="lg" className="font-bold">
              Explorar Catálogo de Cursos
            </Button>
          </Link>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map(enrollment => {
        const course = enrollment.course;
        if (!course) return null;
        const progress = enrollment.progressPercent || enrollment.progressPercentage || 0;
        const isFinished = enrollment.isCompleted || progress >= 100;
        return <div key={enrollment.id} className="group rounded-3xl bg-white dark:bg-[#0e0e0e] border border-slate-200/90 dark:border-[#222] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-black/75 text-white backdrop-blur-md text-[11px] font-bold border border-white/10 shadow-sm">
                      {course.category || 'Tecnologia'}
                    </span>
                    {enrollment.isCreator && <span className="px-2.5 py-1 rounded-xl bg-blue-600/90 text-white backdrop-blur-md text-[11px] font-black border border-blue-400/30 shadow-sm uppercase tracking-wider">
                        Criador
                      </span>}
                  </div>

                  <div className="absolute top-3.5 right-3.5">
                    {isFinished ? <span className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white font-extrabold text-xs shadow-md backdrop-blur-md flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluído</span>
                      </span> : <span className="px-2.5 py-1 rounded-xl bg-blue-600/90 text-white font-extrabold text-xs shadow-md backdrop-blur-md">
                        {progress}%
                      </span>}
                  </div>

                  
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs pointer-events-none">
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {course.creator?.name ? `Prof. ${course.creator.name}` : 'Instrutor Especialista'}
                    </span>
                    <span className="text-[11px] text-zinc-300 font-mono">
                      {course.durationHours || 12}h conteúdo
                    </span>
                  </div>
                </div>

                
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <h3 className="font-extrabold text-slate-950 dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>

                    
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
                    <Link to={`/learn/${course.id}`} className="w-full">
                      <button className="w-full py-3 px-4 rounded-2xl bg-slate-950 dark:bg-white hover:bg-blue-600 dark:hover:bg-blue-600 text-white dark:text-black hover:text-white dark:hover:text-white font-extrabold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer group/btn">
                        <Play className="w-4 h-4 fill-current transition-transform group-hover/btn:scale-110" />
                        <span>{isFinished ? 'Rever Aulas do Curso' : 'Continuar a Estudar'}</span>
                        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>;
      })}
        </div>}
    </div>;
};