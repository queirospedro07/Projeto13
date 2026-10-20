import './DiscoverSpacesPage.css';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LuUsers as Users,
  LuBookOpen as BookOpen,
  LuMessageSquare as MessageSquare,
  LuPlus as Plus,
  LuSearch as Search,
  LuArrowRight as ArrowRight,
  LuCheck as Check,
  LuStar as Star,
  LuGraduationCap as GraduationCap,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { CourseEnrollModal } from '../../components/CourseEnrollModal';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';

export const DiscoverSpacesPage = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const categories = [
    {
      id: 'all',
      label: 'Todas as Categorias',
    },
    {
      id: 'programming',
      label: 'Programação',
    },
    {
      id: 'design',
      label: 'Design & Criatividade',
    },
    {
      id: 'ai',
      label: 'IA & Dados',
    },
    {
      id: 'cloud',
      label: 'Cloud & DevOps',
    },
    {
      id: 'cybersecurity',
      label: 'Cibersegurança',
    },
  ];
  const fetchSpaces = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = {};
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (search) params.search = search;
        const data = await api
          .get('/courses', {
            params: params,
          })
          .then(({ data }) => data);

        setSpaces(data || []);
      } catch (err) {
        console.error('Erro ao carregar catálogo de cursos:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedCategory, search],
  );

  useEffect(() => {
    fetchSpaces();
  }, [selectedCategory, user?.id]);
  useEffect(() => {
    const handleVisibilityOrEnrollmentChange = () => {
      fetchSpaces(true);
    };

    window.addEventListener('nexo_courses_visibility_changed', handleVisibilityOrEnrollmentChange);

    return () => {
      window.removeEventListener(
        'nexo_courses_visibility_changed',
        handleVisibilityOrEnrollmentChange,
      );
    };
  }, [fetchSpaces]);

  const filteredSpaces = spaces.filter((space) => {
    const isFree =
      space.isFree || space.price === 0 || space.price === null || space.price === undefined;
    if (priceFilter === 'free' && !isFree) return false;
    if (priceFilter === 'paid' && isFree) return false;
    const hasCommunity = Boolean(space.spaceId || (space.channelsCount && space.channelsCount > 0));
    if (formatFilter === 'community' && !hasCommunity) return false;
    if (formatFilter === 'self-paced' && hasCommunity) return false;

    return true;
  });

  return (
    <div className="discover-spaces-panel">
      <div className="discover-spaces-panel-2">
        <div>
          <div className="discover-spaces-panel-3">
            <Badge
              size="md"
              variant="primary"
            >
              Catálogo
            </Badge>
          </div>
          <h1 className="discover-spaces-title">Explorar Cursos</h1>
          <p className="discover-spaces-description">
            Cursos estruturados com opção de comunidade interativa ou auto-estudo individual.
          </p>
        </div>

        {user?.role === 'CREATOR' || user?.role === 'ADMIN' ? (
          <Link to="/creator/courses/new">
            <Button
              as="span"
              variant="primary"
              size="md"
              leftIcon={<Plus className="discover-spaces-plus" />}
              className="discover-spaces-button"
            >
              Criar um Curso
            </Button>
          </Link>
        ) : (
          <Link to="/creator/apply">
            <Button
              as="span"
              variant="secondary"
              size="md"
              leftIcon={<GraduationCap className="discover-spaces-plus" />}
              className="discover-spaces-button"
            >
              Tornar-se Formador
            </Button>
          </Link>
        )}
      </div>

      <div className="discover-spaces-panel-4">
        <div className="discover-spaces-panel-5">
          <div className="discover-spaces-panel-6">
            <Search className="discover-spaces-search" />
            <input
              type="text"
              placeholder="Pesquisar cursos por nome, tópico ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSpaces()}
              className="discover-spaces-field"
            />
          </div>

          <div className="discover-spaces-panel-7">
            <div className="discover-spaces-panel-8">
              <button
                onClick={() => setFormatFilter('all')}
                className={`discover-spaces-button-2 ${formatFilter === 'all' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                Todos os Formatos
              </button>
              <button
                onClick={() => setFormatFilter('community')}
                className={`discover-spaces-button-5 ${formatFilter === 'community' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                <Users className="discover-spaces-users" />
                Com Comunidade
              </button>
              <button
                onClick={() => setFormatFilter('self-paced')}
                className={`discover-spaces-button-5 ${formatFilter === 'self-paced' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                <BookOpen className="discover-spaces-users" />
                Auto-estudo
              </button>
            </div>

            <div className="discover-spaces-panel-8">
              <button
                onClick={() => setPriceFilter('all')}
                className={`discover-spaces-button-2 ${priceFilter === 'all' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                Todos os Preços
              </button>
              <button
                onClick={() => setPriceFilter('free')}
                className={`discover-spaces-button-2 ${priceFilter === 'free' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                Gratuitos
              </button>
              <button
                onClick={() => setPriceFilter('paid')}
                className={`discover-spaces-button-2 ${priceFilter === 'paid' ? 'discover-spaces-button-3' : 'discover-spaces-button-4'}`}
              >
                Pagos
              </button>
            </div>
          </div>
        </div>

        <div className="discover-spaces-panel-9 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`discover-spaces-button-6 ${selectedCategory === cat.id ? 'discover-spaces-button-3' : 'discover-spaces-button-7'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="discover-spaces-panel-10">
          <div className="discover-spaces-panel-11" />
          <p className="discover-spaces-description-2">A carregar catálogo de cursos...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="discover-spaces-panel-12">
          <div className="discover-spaces-panel-13">
            <BookOpen className="discover-spaces-book-open" />
          </div>
          <h3 className="discover-spaces-subheading">Nenhum curso encontrado</h3>
          <p className="discover-spaces-description-3">
            Tente pesquisar por outros termos ou ajustar os filtros.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedCategory('all');
              setPriceFilter('all');
              setFormatFilter('all');
              setSearch('');
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="discover-spaces-panel-14">
          {filteredSpaces.map((space) => {
            const isFree =
              space.isFree ||
              space.price === 0 ||
              space.price === null ||
              space.price === undefined;
            const priceFormatted = formatCoursePrice({
              ...space,
              isFree,
              price: space.price ?? 0,
            });
            const hasCommunity =
              (space.channelsCount && space.channelsCount > 0) || space.hasCommunity !== false;
            const isEnrolledInCourse = Boolean(space.isMember || space.isEnrolled);

            return (
              <div
                key={space.id}
                className="discover-spaces-panel-15 ui-group"
              >
                <Link
                  to={`/courses/${space.slug || space.id}`}
                  className="discover-spaces-link group/thumb"
                >
                  <img
                    src={
                      space.bannerUrl ||
                      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={space.name}
                    className="discover-spaces-image discover-spaces-dynamic-1"
                    style={{
                      '--discover-spaces-object-position':
                        space.bannerPosition || space.thumbnailPosition || 'center',
                    }}
                  />

                  <div className="discover-spaces-panel-16" />

                  <div className="discover-spaces-panel-17">
                    <div className="discover-spaces-panel-18">
                      <span className="discover-spaces-label">
                        <GraduationCap className="discover-spaces-graduation-cap" />
                        {formatCategory(space.category)}
                      </span>
                      <span className="discover-spaces-label-2">
                        {hasCommunity ? (
                          <Users className="discover-spaces-users-2" />
                        ) : (
                          <BookOpen className="discover-spaces-book-open-2" />
                        )}
                        {hasCommunity ? 'Comunidade' : 'Auto-estudo'}
                      </span>
                    </div>

                    <div>
                      {isEnrolledInCourse ? (
                        <span className="discover-spaces-label-3">
                          <Check className="discover-spaces-check" />
                          Já estou no curso
                        </span>
                      ) : isFree ? (
                        <span className="discover-spaces-label-4">Gratuito</span>
                      ) : (
                        <span className="discover-spaces-label-5">{priceFormatted}</span>
                      )}
                    </div>
                  </div>

                  <div className="discover-spaces-panel-19">
                    <div className="discover-spaces-panel-20">
                      {space.averageRating || space.rating ? (
                        <>
                          <Star className="discover-spaces-star" />
                          <span>{space.averageRating || space.rating}</span>
                        </>
                      ) : (
                        <>
                          <Star className="discover-spaces-star-2" />
                          <span>Sem avaliações</span>
                        </>
                      )}
                      <span className="discover-spaces-label-6">
                        ({space.membersCount || 0} alunos)
                      </span>
                    </div>

                    <div className="discover-spaces-panel-21">
                      <MessageSquare className="discover-spaces-graduation-cap" />
                      <span>{hasCommunity ? `${space.channelsCount || 4} canais` : 'Aulas'}</span>
                    </div>
                  </div>
                </Link>

                <div className="discover-spaces-panel-22">
                  <div>
                    <Link
                      to={`/courses/${space.slug || space.id}`}
                      className="discover-spaces-link-2"
                    >
                      <h3 className="discover-spaces-subheading-2">{space.name}</h3>
                    </Link>
                    <p className="discover-spaces-description-4">{space.description}</p>
                  </div>

                  <div className="discover-spaces-panel-23">
                    <div className="discover-spaces-panel-24">
                      <Link
                        to={`/profile/${space.owner?.username || space.owner?.id || ''}`}
                        className="discover-spaces-link-3"
                        title={
                          space.owner?.name
                            ? `Ver perfil de ${space.owner.name}`
                            : 'Ver perfil do formador'
                        }
                      >
                        <Avatar
                          src={space.owner?.avatarUrl || space.logoUrl}
                          name={space.owner?.name || space.name}
                          size="sm"
                        />
                        <span className="discover-spaces-label-7">
                          {space.owner?.name ? `${space.owner.name}` : space.name}
                        </span>
                      </Link>

                      <span className="discover-spaces-label-8">{priceFormatted}</span>
                    </div>

                    <div className="discover-spaces-panel-25">
                      <Link
                        to={`/courses/${space.slug || space.id}`}
                        className="discover-spaces-link-4"
                      >
                        <button
                          className="discover-spaces-button-8"
                          title="Ver detalhes completos do curso"
                        >
                          <BookOpen className="discover-spaces-book-open-3" />
                          <span>Ver Detalhes</span>
                        </button>
                      </Link>

                      {isEnrolledInCourse ? (
                        <Link
                          to={`/learn/${space.slug || space.id}`}
                          className="discover-spaces-link-4"
                        >
                          <button
                            className="discover-spaces-button-9"
                            title="Já está inscrito neste curso — clique para aceder às aulas"
                          >
                            <Check className="discover-spaces-check-2" />
                            <span className="discover-spaces-label-9">Já estou no curso</span>
                          </button>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEnrollingCourse(space)}
                          className="discover-spaces-button-10"
                        >
                          <span>{isFree ? 'Inscrever-me gratuitamente' : 'Comprar curso'}</span>
                          <ArrowRight className="discover-spaces-arrow-right" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de matrícula / compra */}
      <CourseEnrollModal
        isOpen={Boolean(enrollingCourse)}
        course={enrollingCourse}
        isSpace={false}
        onClose={() => setEnrollingCourse(null)}
        onEnrollSuccess={(enrolledCourseId) => {
          if (enrolledCourseId) {
            setSpaces((prev) =>
              prev.map((s) =>
                s.id === enrolledCourseId || s.slug === enrolledCourseId
                  ? {
                      ...s,
                      isMember: true,
                      isEnrolled: true,
                      membersCount: (s.membersCount || 0) + 1,
                    }
                  : s,
              ),
            );
          }

          fetchSpaces(true);
        }}
      />
    </div>
  );
};

export default DiscoverSpacesPage;
