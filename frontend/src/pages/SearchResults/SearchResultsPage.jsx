import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, User, ArrowRight, Star, Clock, GraduationCap } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../services/api';
import { formatCoursePrice } from '../../utils/formatters';

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = (searchParams.get('q') || '').trim();
  const [query, setQuery] = useState(rawQuery);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(rawQuery);
  }, [rawQuery]);

  useEffect(() => {
    if (!rawQuery) {
      setCourses([]);
      setUsers([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      api.getCourses({ search: rawQuery }),
      api.searchSocialUsers(rawQuery),
    ])
      .then(([coursesResult, usersResult]) => {
        if (!isMounted) return;

        const nextCourses = coursesResult.status === 'fulfilled' && Array.isArray(coursesResult.value) ? coursesResult.value : [];
        const nextUsers = usersResult.status === 'fulfilled' && Array.isArray(usersResult.value) ? usersResult.value : [];

        setCourses(nextCourses);
        setUsers(nextUsers);
      })
      .catch(() => {
        if (isMounted) {
          setCourses([]);
          setUsers([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 animate-fade-in">
      <div className="mb-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar cursos e utilizadores..."
              className="w-full bg-slate-50 dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pesquisar
          </button>
        </form>
      </div>

      {!rawQuery ? (
        <div className="text-center py-20 border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-white/70 dark:bg-[#0d0f14]/60">
          <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Procure cursos ou pessoas</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">Introduz um termo na pesquisa para ver todos os resultados.</p>
        </div>
      ) : loading ? (
        <div className="space-y-8">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-neutral-800" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-40 rounded-2xl bg-slate-200 dark:bg-neutral-800" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">Resultados da pesquisa</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Procuraste por <span className="font-semibold text-slate-800 dark:text-slate-200">"{rawQuery}"</span>
              </p>
            </div>
            <span className="rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              {courses.length + users.length} resultados
            </span>
          </div>

          <div className="space-y-10">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cursos</h2>
                <span className="text-xs text-slate-500 dark:text-zinc-400">({courses.length})</span>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] p-8 text-sm text-slate-500 dark:text-zinc-400">
                  Nenhum curso encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <div key={course.id || course.slug} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] shadow-sm hover:shadow-md transition-shadow">
                      <Link to={`/courses/${course.id || course.slug}`} className="block relative h-40 overflow-hidden">
                        <img
                          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                            {course.category}
                          </span>
                          <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-900">
                            {formatCoursePrice(course)}
                          </span>
                        </div>
                      </Link>

                      <div className="p-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{course.difficulty || 'Geral'}</span>
                        </div>

                        <Link to={`/courses/${course.id || course.slug}`} className="block">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {course.title}
                          </h3>
                        </Link>

                        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400 line-clamp-3">{course.description}</p>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{course.averageRating || '5.0'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{course.durationHours || '0'}h</span>
                          </div>
                        </div>

                        <Link
                          to={`/courses/${course.id || course.slug}`}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-3 py-2 text-xs font-semibold"
                        >
                          Ver curso
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Utilizadores</h2>
                <span className="text-xs text-slate-500 dark:text-zinc-400">({users.length})</span>
              </div>

              {users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] p-8 text-sm text-slate-500 dark:text-zinc-400">
                  Nenhum utilizador encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <div key={user.id || user.username} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0d0f14] p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={user.avatarUrl} alt={user.name} size="md" fallbackText={user.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-zinc-400">@{user.username}</p>
                          <span className="mt-1 inline-flex rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                            {user.role === 'CREATOR' ? 'Formador' : user.role === 'ADMIN' ? 'Administrador' : 'Estudante'}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/profile/${user.username}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                      >
                        Ver perfil
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResultsPage;
