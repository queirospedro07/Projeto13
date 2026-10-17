import './SearchResultsPage.css';
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  LuSearch as Search,
  LuBookOpen as BookOpen,
  LuUser as User,
  LuArrowRight as ArrowRight,
  LuStar as Star,
  LuClock as Clock,
  LuGraduationCap as GraduationCap,
  LuCircleCheck as CheckCircle2,
} from 'react-icons/lu';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory, formatRole } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
export const SearchResultsPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
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
      api
        .get('/courses', {
          params: {
            search: rawQuery,
          },
        })
        .then(({ data }) => data),
      api
        .get(
          `/social/users/search?query=${encodeURIComponent(rawQuery === undefined ? '' : rawQuery)}`,
        )
        .then(({ data }) => data),
    ])
      .then(([coursesResult, usersResult]) => {
        if (!isMounted) return;
        const nextCourses =
          coursesResult.status === 'fulfilled' && Array.isArray(coursesResult.value)
            ? coursesResult.value
            : [];
        const nextUsers =
          usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)
            ? usersResult.value
            : [];
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
    setSearchParams({
      q: trimmed,
    });
  };
  if (isLoading) {
    return (
      <div className="search-results-page-panel">
        <div className="search-results-page-panel-2" />
        <p className="search-results-page-description">A verificar sessão...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }
  return (
    <div className="search-results-page-panel-3">
      <div className="search-results-page-panel-4">
        <form onSubmit={handleSubmit} className="search-results-page-form">
          <div className="search-results-page-panel-5">
            <Search className="search-results-page-search" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar cursos e utilizadores..."
              className="search-results-page-field"
            />
          </div>
          <button type="submit" disabled={!query.trim()} className="search-results-page-button">
            Pesquisar
          </button>
        </form>
      </div>

      {!rawQuery ? (
        <div className="search-results-page-panel-6">
          <Search className="search-results-page-search-2" />
          <h2 className="search-results-page-heading">Procure cursos ou pessoas</h2>
          <p className="search-results-page-description-2">
            Introduza um termo na pesquisa para ver todos os resultados.
          </p>
        </div>
      ) : loading ? (
        <div className="search-results-page-panel-7">
          <div className="search-results-page-panel-8">
            <div className="search-results-page-panel-9" />
            <div className="search-results-page-panel-10">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div key={index} className="search-results-page-panel-11" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="search-results-page-panel-12">
            <div>
              <h1 className="search-results-page-title">Resultados da pesquisa</h1>
              <p className="search-results-page-description-3">
                Procurou por <span className="search-results-page-label">"{rawQuery}"</span>
              </p>
            </div>
            <span className="search-results-page-label-2">
              {courses.length + users.length} resultados
            </span>
          </div>

          <div className="search-results-page-panel-13">
            <section>
              <div className="search-results-page-panel-14">
                <BookOpen className="search-results-page-book-open" />
                <h2 className="search-results-page-heading-2">Cursos</h2>
                <span className="search-results-page-label-3">({courses.length})</span>
              </div>

              {courses.length === 0 ? (
                <div className="search-results-page-panel-15">
                  Nenhum curso encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="search-results-page-panel-16">
                  {courses.map((course) => (
                    <div key={course.id || course.slug} className="search-results-page-panel-17">
                      <Link
                        to={`/courses/${course.id || course.slug}`}
                        className="search-results-page-link"
                      >
                        <img
                          src={
                            course.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={course.title}
                          className="search-results-page-image"
                        />
                        <div className="search-results-page-panel-18">
                          <span className="search-results-page-label-4">
                            {formatCategory(course.category)}
                          </span>
                          <span className="search-results-page-label-5">
                            {formatCoursePrice(course)}
                          </span>
                        </div>
                      </Link>

                      <div className="search-results-page-panel-19">
                        <div className="search-results-page-panel-20">
                          <GraduationCap className="search-results-page-graduation-cap" />
                          <span>{course.difficulty || 'Geral'}</span>
                        </div>

                        <Link
                          to={`/courses/${course.id || course.slug}`}
                          className="search-results-page-link-2"
                        >
                          <h3 className="search-results-page-subheading">{course.title}</h3>
                        </Link>

                        <p className="search-results-page-description-4">{course.description}</p>

                        <div className="search-results-page-panel-21">
                          <div className="search-results-page-panel-22">
                            <Star className="search-results-page-star" />
                            <span>{course.averageRating || 'Sem avaliações'}</span>
                          </div>
                          <div className="search-results-page-panel-22">
                            <Clock className="search-results-page-graduation-cap" />
                            <span>{course.durationHours || '0'}h</span>
                          </div>
                        </div>

                        <Link
                          to={
                            course.isEnrolled || course.isMember
                              ? `/learn/${course.id || course.slug}`
                              : `/courses/${course.id || course.slug}`
                          }
                          className={`search-results-page-link-3 ${course.isEnrolled || course.isMember ? 'search-results-page-link-4' : 'search-results-page-link-5'}`}
                        >
                          {course.isEnrolled || course.isMember ? (
                            <>
                              <CheckCircle2 className="search-results-page-graduation-cap" />
                              Já estou no curso
                            </>
                          ) : (
                            <>
                              Ver curso
                              <ArrowRight className="search-results-page-graduation-cap" />
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="search-results-page-panel-14">
                <User className="search-results-page-user" />
                <h2 className="search-results-page-heading-2">Utilizadores</h2>
                <span className="search-results-page-label-3">({users.length})</span>
              </div>

              {users.length === 0 ? (
                <div className="search-results-page-panel-15">
                  Nenhum utilizador encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="search-results-page-panel-23">
                  {users.map((user) => (
                    <div key={user.id || user.username} className="search-results-page-panel-24">
                      <div className="search-results-page-panel-25">
                        <Avatar src={user.avatarUrl} name={user.name} role={user.role} size="md" />
                        <div className="search-results-page-panel-26">
                          <p className="search-results-page-description-5">{user.name}</p>
                          <p className="search-results-page-description-6">@{user.username}</p>
                          <span className="search-results-page-label-6">
                            {formatRole(user.role)}
                          </span>
                        </div>
                      </div>

                      <Link to={`/profile/${user.username}`} className="search-results-page-link-6">
                        Ver perfil
                        <ArrowRight className="search-results-page-graduation-cap" />
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
