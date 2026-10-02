import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  BookOpen,
  PlusCircle,
  Eye,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../../services/api';

export const CreatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCreatorStats().catch(() => null),
      api.getCreatorCourses().catch(() => [])
    ]).then(([statsData, coursesData]) => {
      setStats(statsData);
      setCourses(coursesData || []);
      setLoading(false);
    });
  }, []);

  const totalStudents =
    stats?.totalStudents ||
    courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40">
            Estúdio do Criador
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight mt-1.5">
            Painel do Formador
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-1">
            Gira os seus cursos, publique novas aulas e acompanhe os seus alunos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/creator/members">
            <button className="px-4 py-2.5 text-sm font-bold bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Ver Alunos</span>
            </button>
          </Link>
          <Link to="/creator/courses/new">
            <button className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              <span>Criar Novo Curso</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Receita Total
            </p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5 font-mono">
              €{stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Alunos Inscritos
            </p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">
              {totalStudents}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Cursos Criados
            </p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">
              {courses.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              Os Meus Cursos ({courses.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Clique em "Editar" para adicionar aulas, vídeos ou questionários.
            </p>
          </div>

          <Link to="/creator/courses/new">
            <button className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              <span>Novo Curso</span>
            </button>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                Ainda não tem cursos criados
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
                Comece agora mesmo a montar o seu primeiro curso com módulos práticos e vídeos.
              </p>
              <Link to="/creator/courses/new">
                <button className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer">
                  Criar Primeiro Curso
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={
                        course.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-base truncate">
                        {course.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          {course.category || 'Geral'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            course.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : course.approvalStatus === 'REJECTED'
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {course.approvalStatus === 'APPROVED'
                            ? 'Aprovado pelo Administrador'
                            : course.approvalStatus === 'REJECTED'
                            ? 'Requer Revisão'
                            : 'Pendente de Aprovação'}
                        </span>
                        <span>•</span>
                        <span>{course._count?.enrollments || 0} alunos inscritos</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCoursePrice(course)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {course.approvalStatus !== 'APPROVED' && (
                      <button
                        onClick={async () => {
                          try {
                            await api.submitCourseForReview(course.id);
                            alert('Curso submetido para aprovação do Administrador!');
                            window.location.reload();
                          } catch (e) {
                            alert('Erro ao submeter: ' + e.message);
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
                      >
                        Submeter p/ Moderação
                      </button>
                    )}
                    <Link to={`/learn/${course.id}`}>
                      <button className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </Link>
                    <Link to={`/creator/courses/${course.id}/edit?step=3`}>
                      <button className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Editar Aulas</span>
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;