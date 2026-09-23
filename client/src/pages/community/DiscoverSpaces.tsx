import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, MessageSquare, Plus, Search, Sparkles, ArrowRight, Check, Star, Clock, GraduationCap } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const DiscoverSpaces: React.FC = () => {
 const [spaces, setSpaces] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'community' | 'self-paced'>('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'Programming', label: 'Programação' },
    { id: 'Design', label: 'Design' },
    { id: 'AI & Data', label: 'IA & Dados' },
    { id: 'Cybersecurity', label: 'Cibersegurança' },
    { id: 'Cloud & DevOps', label: 'Cloud & DevOps' },
  ];

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search) params.search = search;
      const data = await api.getSpaces(params);
      setSpaces(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [selectedCategory]);

  const handleJoin = async (spaceId: string, spaceName: string) => {
    try {
      await api.joinSpace(spaceId);
      toast({
        title: 'Inscrição Confirmada',
        message: `Agora tem acesso ao curso ${spaceName}.`,
        type: 'success',
      });
      fetchSpaces();
    } catch (err) {
      toast({ title: 'Erro', message: 'Não foi possível concluir a inscrição', type: 'error' });
    }
  };

  const filteredSpaces = spaces.filter(space => {
    // Price filter
    if (priceFilter === 'free' && !(space.price === 0 || space.isFree)) return false;
    if (priceFilter === 'paid' && (space.price === 0 || space.isFree)) return false;

    // Community format filter (distinction between with community and self-paced)
    const hasCommunity = (space.channelsCount && space.channelsCount > 0) || space.hasCommunity !== false;
    if (formatFilter === 'community' && !hasCommunity) return false;
    if (formatFilter === 'self-paced' && hasCommunity && space.channelsCount > 2) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge size="md" variant="primary">Catálogo</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Explorar Cursos</h1>
          <p className="text-base text-slate-600 mt-1">
            Cursos estruturados com opção de comunidade interativa ou auto-estudo individual.
          </p>
        </div>

        <Link to="/creator/courses/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} className="font-semibold">
            Criar um Curso
          </Button>
        </Link>
      </div>

      {/* Filter & Search & Pricing & Format Tiers */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar cursos por nome, tópico ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSpaces()}
              className="w-full bg-white border border-slate-200 focus:border-slate-950 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Format Filter (Com vs Sem Comunidade) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setFormatFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  formatFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Formatos
              </button>
              <button
                onClick={() => setFormatFilter('community')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  formatFilter === 'community'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3" />
                Com Comunidade
              </button>
              <button
                onClick={() => setFormatFilter('self-paced')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  formatFilter === 'self-paced'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Auto-estudo
              </button>
            </div>

            {/* Price Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setPriceFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  priceFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Preços
              </button>
              <button
                onClick={() => setPriceFilter('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  priceFilter === 'free'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gratuitos
              </button>
              <button
                onClick={() => setPriceFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  priceFilter === 'paid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Premium
              </button>
            </div>
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-slate-500 font-medium">A carregar catálogo de cursos...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-white max-w-xl mx-auto p-10">
          <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Nenhum curso encontrado</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">Tente pesquisar por outros termos ou ajustar os filtros.</p>
          <Button variant="secondary" onClick={() => { setSelectedCategory('all'); setPriceFilter('all'); setFormatFilter('all'); setSearch(''); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map(space => {
            const isFree = space.isFree || space.price === 0 || space.price === null || space.price === undefined;
            const priceFormatted = isFree ? 'Gratuito' : `€${space.price || 49}`;
            const hasCommunity = (space.channelsCount && space.channelsCount > 0) || space.hasCommunity !== false;

            return (
              <div
                key={space.id}
                className="group rounded-3xl bg-white dark:bg-[#0c0c0c] border border-slate-200/90 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:border-slate-300 dark:hover:border-neutral-700 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* 16:9 Cinematic Thumbnail */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={space.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* Vignette Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        {space.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-zinc-200 shadow-lg flex items-center gap-1">
                        {hasCommunity ? <Users className="w-3 h-3 text-emerald-400" /> : <BookOpen className="w-3 h-3 text-blue-400" />}
                        {hasCommunity ? 'Comunidade' : 'Auto-estudo'}
                      </span>
                    </div>

                    {/* Right: Acquired or Price */}
                    <div>
                      {space.isMember ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-600/95 text-white font-extrabold text-xs shadow-lg backdrop-blur-md flex items-center gap-1 border border-emerald-400/30 uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Adquirido
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

                  {/* Bottom Overlays on Image */}
                  <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-md">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9</span>
                      <span className="text-zinc-400 text-[11px]">({space.membersCount || 0} alunos)</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 shadow-md">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{hasCommunity ? `${space.channelsCount || 4} canais` : 'Aulas'}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-950 dark:text-white text-lg leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Link to={space.isMember || isFree ? `/learn/${space.slug || space.id}` : `/courses/${space.slug || space.id}`}>{space.name}</Link>
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                      {space.description}
                    </p>
                  </div>

                  {/* Footer with Instructor & CTA */}
                  <div className="pt-4 mt-6 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={space.owner?.avatarUrl || space.logoUrl} name={space.owner?.name || space.name} size="sm" />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {space.owner?.name ? `${space.owner.name}` : space.name}
                      </span>
                    </div>

                    <Link to={space.isMember || isFree ? `/learn/${space.slug || space.id}` : `/courses/${space.slug || space.id}`}>
                      <button
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          space.isMember || isFree
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-950/20'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        }`}
                      >
                        <span>{space.isMember ? 'Aceder ao Curso' : isFree ? 'Aceder Grátis' : `Comprar ${priceFormatted}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
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
