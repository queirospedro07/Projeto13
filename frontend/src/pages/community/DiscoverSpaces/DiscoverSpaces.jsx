import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, MessageSquare, Plus, Search, ArrowRight, Check, Star, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { CourseEnrollModal } from '../../../components/course/CourseEnrollModal';
import { api } from '../../../services/api';
import { formatCoursePrice, formatCategory } from '../../../utils/formatters';

export const DiscoverSpaces = () => {
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
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'programming', label: 'Programação' },
    { id: 'design', label: 'Design & Criatividade' },
    { id: 'ai', label: 'IA & Dados' },
    { id: 'cloud', label: 'Cloud & DevOps' },
    { id: 'cybersecurity', label: 'Cibersegurança' },
  ];

  const fetchSpaces = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search) params.search = search;
      const data = await api.getCourses(params);
      setSpaces(data || []);
    } catch (err) {
      console.error('Erro ao carregar catálogo de cursos:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchSpaces();
  }, [selectedCategory, user?.id]);

  useEffect(() => {
    const handleVisibilityOrEnrollmentChange = () => {
      fetchSpaces(true);
    };
    window.addEventListener('nexo_courses_visibility_changed', handleVisibilityOrEnrollmentChange);
    return () => {
      window.removeEventListener('nexo_courses_visibility_changed', handleVisibilityOrEnrollmentChange);
    };
  }, [fetchSpaces]);

  const handleJoin = async (courseId, courseTitle) => {
    try {
      await api.enrollCourse(courseId);
      setSpaces(prev =>
        prev.map(s =>
          s.id === courseId || s.slug === courseId
            ? { ...s, isMember: true, isEnrolled: true, membersCount: (s.membersCount || 0) + 1 }
            : s
        )
      );
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      toast({
        title: 'Inscrição Confirmada',
        message: `Já está inscrito no curso ${courseTitle}.`,
        type: 'success'
      });
      fetchSpaces(true);
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Não foi possível concluir a inscrição',
        type: 'error'
      });
    }
  };

  const filteredSpaces = spaces.filter(space => {
    const isFree = space.isFree || space.price === 0 || space.price === null || space.price === undefined;
    if (priceFilter === 'free' && !isFree) return false;
    if (priceFilter === 'paid' && isFree) return false;
    const hasCommunity = Boolean(space.spaceId || (space.channelsCount && space.channelsCount > 0));
    if (formatFilter === 'community' && !hasCommunity) return false;
    if (formatFilter === 'self-paced' && hasCommunity) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">
              Catálogo
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explorar Cursos
          </h1>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-1">
            Cursos estruturados com opção de comunidade interativa ou auto-estudo individual.
          </p>
        </div>

        {user?.role === 'CREATOR' || user?.role === 'ADMIN' ? (
          <Link to="/creator/courses/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} className="font-semibold">
              Criar um Curso
            </Button>
          </Link>
        ) : (
          <Link to="/creator/apply">
            <Button variant="secondary" size="md" leftIcon={<GraduationCap className="w-4 h-4" />} className="font-semibold">
              Tornar-se Formador
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar cursos por nome, tópico ou tecnologia..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchSpaces()}
              className="w-full bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 focus:border-slate-950 dark:focus:border-white rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-xs transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-2xl border border-slate-200 dark:border-neutral-800 shrink-0">
              <button onClick={() => setFormatFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${formatFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Todos os Formatos
              </button>
              <button onClick={() => setFormatFilter('community')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${formatFilter === 'community' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <Users className="w-3 h-3" />
                Com Comunidade
              </button>
              <button onClick={() => setFormatFilter('self-paced')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${formatFilter === 'self-paced' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                <BookOpen className="w-3 h-3" />
                Auto-estudo
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-2xl border border-slate-200 dark:border-neutral-800 shrink-0">
              <button onClick={() => setPriceFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${priceFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Todos os Preços
              </button>
              <button onClick={() => setPriceFilter('free')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${priceFilter === 'free' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Gratuitos
              </button>
              <button onClick={() => setPriceFilter('paid')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${priceFilter === 'paid' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Pagos
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-slate-500 font-medium">A carregar catálogo de cursos...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#0c0d12] max-w-xl mx-auto p-10">
          <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-900 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhum curso encontrado</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map(space => {
            const isFree = space.isFree || space.price === 0 || space.price === null || space.price === undefined;
            const priceFormatted = formatCoursePrice({ ...space, isFree, price: space.price ?? 0 });
            const hasCommunity = (space.channelsCount && space.channelsCount > 0) || space.hasCommunity !== false;
            const isEnrolledInCourse = Boolean(space.isMember || space.isEnrolled);

            return (
              <div
                key={space.id}
                className="group rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm transition-colors duration-150 overflow-hidden flex flex-col justify-between"
              >
                <Link
                  to={`/courses/${space.slug || space.id}`}
                  className="relative aspect-video w-full bg-slate-900 overflow-hidden block group/thumb cursor-pointer"
                >
                  <img
                    src={
                      space.bannerUrl ||
                      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={space.name}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover/thumb:scale-105 transition-all duration-300"
                    style={{ objectPosition: space.bannerPosition || space.thumbnailPosition || 'center' }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        {formatCategory(space.category)}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-zinc-200 shadow-lg flex items-center gap-1">
                        {hasCommunity ? (
                          <Users className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <BookOpen className="w-3 h-3 text-blue-400" />
                        )}
                        {hasCommunity ? 'Comunidade' : 'Auto-estudo'}
                      </span>
                    </div>

                    <div>
                      {isEnrolledInCourse ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-600/95 text-white font-extrabold text-xs shadow-lg backdrop-blur-md flex items-center gap-1 border border-emerald-400/30">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Já estou no curso
                        </span>
                      ) : isFree ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30 text-xs font-extrabold shadow-lg uppercase tracking-wider">
                          Gratuito
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-white/20 text-xs font-extrabold shadow-lg">
                          {priceFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-md">
                      {space.averageRating || space.rating ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{space.averageRating || space.rating}</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Sem avaliações</span>
                        </>
                      )}
                      <span className="text-zinc-400 text-[11px]">
                        ({space.membersCount || 0} alunos)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 shadow-md">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{hasCommunity ? `${space.channelsCount || 4} canais` : 'Aulas'}</span>
                    </div>
                  </div>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/courses/${space.slug || space.id}`} className="block">
                      <h3 className="font-extrabold text-slate-950 dark:text-white text-lg leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        {space.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                      {space.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-100 dark:border-neutral-800/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to={`/profile/${space.owner?.username || space.owner?.id || ''}`}
                        className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
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
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate hover:underline">
                          {space.owner?.name ? `${space.owner.name}` : space.name}
                        </span>
                      </Link>

                      <span className="text-xs font-black text-slate-950 dark:text-white shrink-0">
                        {priceFormatted}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link to={`/courses/${space.slug || space.id}`} className="w-full">
                        <button
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-800 dark:text-zinc-200"
                          title="Ver detalhes completos do curso"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>Ver Detalhes</span>
                        </button>
                      </Link>

                      {isEnrolledInCourse ? (
                        <Link to={`/learn/${space.slug || space.id}`} className="w-full">
                          <button
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Já está inscrito neste curso — clique para aceder às aulas"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                            <span className="truncate">Já estou no curso</span>
                          </button>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEnrollingCourse(space)}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100"
                        >
                          <span>{isFree ? 'Entrar no Curso' : 'Inscrever'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
        onEnrollSuccess={enrolledCourseId => {
          if (enrolledCourseId) {
            setSpaces(prev =>
              prev.map(s =>
                s.id === enrolledCourseId || s.slug === enrolledCourseId
                  ? { ...s, isMember: true, isEnrolled: true, membersCount: (s.membersCount || 0) + 1 }
                  : s
              )
            );
          }
          fetchSpaces(true);
        }}
      />
    </div>
  );
};
export default DiscoverSpaces;