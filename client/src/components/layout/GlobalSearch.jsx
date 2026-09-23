import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, X, ArrowRight, Loader2, MessageSquare } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { api } from '../../services/api';

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setCourses([]);
      setUsers([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [coursesRes, usersRes] = await Promise.allSettled([
          api.getCourses({ search: query.trim() }),
          api.searchSocialUsers(query.trim())
        ]);

        const foundCourses = coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) ? coursesRes.value.slice(0, 4) : [];
        const foundUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value.slice(0, 4) : [];

        setCourses(foundCourses);
        setUsers(foundUsers);
        setIsOpen(true);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectCourse = (course) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/courses/${course.id || course.slug}`);
  };

  const handleSelectUser = (user) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/profile/${user.username}`);
  };

  const hasResults = courses.length > 0 || users.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Pesquisar cursos e pessoas..."
          value={query}
          onFocus={() => {
            if (query.trim() && hasResults) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-100/90 dark:bg-[#121214] border border-slate-200/90 dark:border-neutral-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          </button>
        )}
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#11131a] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in max-h-[420px] overflow-y-auto">
          {!hasResults && !loading && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-400">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {courses.length > 0 && (
            <div className="p-2 border-b border-slate-100 dark:border-neutral-800/80">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>Cursos</span>
              </div>
              <div className="space-y-1">
                {courses.map((course) => (
                  <button
                    key={course.id || course.slug}
                    type="button"
                    onClick={() => handleSelectCourse(course)}
                    className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-neutral-800 shrink-0 border border-slate-200/60 dark:border-neutral-700">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {course.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {course.category} • {course.difficulty}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                      {course.isFree ? 'Grátis' : `${course.price}€`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {users.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pessoas</span>
              </div>
              <div className="space-y-1">
                {users.map((u) => (
                  <div
                    key={u.id || u.username}
                    onClick={() => handleSelectUser(u)}
                    className="w-full p-2 rounded-xl flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar src={u.avatarUrl} alt={u.name} size="sm" fallbackText={u.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          @{u.username} • {u.role === 'CREATOR' ? 'Instrutor' : u.role === 'ADMIN' ? 'Administrador' : 'Estudante'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          setQuery('');
                          navigate(`/messages?userId=${u.id}`, { state: { peer: u } });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Enviar mensagem direta"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResults && (
            <div className="p-2 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 text-center">
              <button
                type="button"
                onClick={handleSubmit}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Ver todos os resultados para "{query}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
