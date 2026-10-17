import './GlobalSearch.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuSearch as Search,
  LuBookOpen as BookOpen,
  LuUser as User,
  LuX as X,
  LuArrowRight as ArrowRight,
  LuLoaderCircle as Loader2,
  LuMessageSquare as MessageSquare,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { api } from '../../services/api';
import { formatCoursePrice } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
export const GlobalSearch = ({ onClose } = {}) => {
  const { user } = useAuth();
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
          api
            .get('/courses', {
              params: {
                search: query.trim(),
              },
            })
            .then(({ data }) => data),
          api
            .get(
              `/social/users/search?query=${encodeURIComponent(query.trim() === undefined ? '' : query.trim())}`,
            )
            .then(({ data }) => data),
        ]);
        const foundCourses =
          coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value)
            ? coursesRes.value.slice(0, 4)
            : [];
        const foundUsers =
          usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)
            ? usersRes.value.slice(0, 4)
            : [];
        setCourses(foundCourses);
        setUsers(foundUsers);
        setIsOpen(true);
      } catch {
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);
  if (!user) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  const handleSelectCourse = (course) => {
    setIsOpen(false);
    setQuery('');
    onClose?.();
    navigate(`/courses/${course.id || course.slug}`);
  };
  const handleSelectUser = (user) => {
    setIsOpen(false);
    setQuery('');
    onClose?.();
    navigate(`/profile/${user.username}`);
  };
  const hasResults = courses.length > 0 || users.length > 0;
  return (
    <div ref={containerRef} className="global-search-panel">
      <form onSubmit={handleSubmit} className="global-search-form">
        <Search className="global-search-search" />
        <input
          type="text"
          placeholder="Pesquisar cursos e pessoas..."
          value={query}
          onFocus={() => {
            if (query.trim() && hasResults) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          className="global-search-field"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="global-search-button"
          >
            {loading ? (
              <Loader2 className="global-search-loader2" />
            ) : (
              <X className="global-search-x" />
            )}
          </button>
        )}
      </form>

      {isOpen && (
        <div className="global-search-panel-2">
          {!hasResults && !loading && (
            <div className="global-search-panel-3">Nenhum resultado encontrado para "{query}"</div>
          )}

          {courses.length > 0 && (
            <div className="global-search-panel-4">
              <div className="global-search-panel-5">
                <BookOpen className="global-search-book-open" />
                <span>Cursos</span>
              </div>
              <div className="global-search-panel-6">
                {courses.map((course) => (
                  <button
                    key={course.id || course.slug}
                    type="button"
                    onClick={() => handleSelectCourse(course)}
                    className="global-search-button-2 ui-group"
                  >
                    <div className="global-search-panel-7">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="global-search-image"
                        />
                      ) : (
                        <div className="global-search-panel-8">
                          <BookOpen className="global-search-book-open-2" />
                        </div>
                      )}
                    </div>
                    <div className="global-search-panel-9">
                      <p className="global-search-description">{course.title}</p>
                      <p className="global-search-description-2">
                        {course.category} •{' '}
                        {course.difficulty === 'Beginner'
                          ? 'Iniciante'
                          : course.difficulty === 'Intermediate'
                            ? 'Intermédio'
                            : course.difficulty === 'Advanced'
                              ? 'Avançado'
                              : course.difficulty || 'Geral'}
                      </p>
                    </div>
                    <span className="global-search-label">{formatCoursePrice(course)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {users.length > 0 && (
            <div className="global-search-panel-10">
              <div className="global-search-panel-5">
                <User className="global-search-user" />
                <span>Pessoas</span>
              </div>
              <div className="global-search-panel-6">
                {users.map((u) => (
                  <div
                    key={u.id || u.username}
                    onClick={() => handleSelectUser(u)}
                    className="global-search-panel-11 ui-group"
                  >
                    <div className="global-search-panel-12">
                      <Avatar src={u.avatarUrl} name={u.name} role={u.role} size="sm" />
                      <div className="global-search-panel-9">
                        <p className="global-search-description-3">{u.name}</p>
                        <p className="global-search-description-2">
                          @{u.username} •{' '}
                          {u.role === 'CREATOR'
                            ? 'Formador'
                            : u.role === 'ADMIN'
                              ? 'Administrador'
                              : 'Estudante'}
                        </p>
                      </div>
                    </div>
                    <div className="global-search-panel-13">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          setQuery('');
                          onClose?.();
                          navigate(`/messages?userId=${u.id}`, {
                            state: {
                              peer: u,
                            },
                          });
                        }}
                        className="global-search-button-3"
                        title="Enviar mensagem direta"
                      >
                        <MessageSquare className="global-search-x" />
                      </button>
                      <ArrowRight className="global-search-arrow-right" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResults && (
            <div className="global-search-panel-14">
              <button type="button" onClick={handleSubmit} className="global-search-button-4">
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
