import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  Download, 
  Plus, 
  Sparkles, 
  Check, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

export const SpaceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'events' | 'members' | 'resources'>('home');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSpace = async () => {
    if (!id) return;
    try {
      const data = await api.getSpace(id);
      setSpace(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [id]);

  const handleJoin = async () => {
    try {
      await api.joinSpace(space.id);
      toast({ title: 'Bem-vindo ao Espaço!', message: `Entrou com sucesso em ${space.name}.` });
      fetchSpace();
    } catch (err) {
      toast({ title: 'Erro', message: 'Não foi possível entrar no espaço', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-base text-slate-500 font-medium">A carregar o espaço...</p>
      </div>
    );
  }
  if (!space) return <div className="p-16 text-center text-slate-700 font-medium">Espaço não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* 1. HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-56 sm:h-72 w-full bg-slate-900 overflow-hidden">
          <img src={space.bannerUrl} alt={space.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-8 sm:p-10 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-20 sm:-mt-24 mb-6">
            <Avatar
              src={space.logoUrl}
              name={space.name}
              size="xl"
              className="ring-4 ring-white bg-white shadow-lg"
            />

            <div className="flex items-center gap-3">
              {space.isMember ? (
                <Link to={`/learn/${space.slug || space.id}`}>
                  <Button variant="primary" size="lg" leftIcon={<Play className="w-5 h-5 fill-current" />} className="font-bold shadow-md shadow-blue-500/20">
                    Aceder ao Curso & Comunidade
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleJoin} variant="primary" size="lg" leftIcon={<Users className="w-5 h-5" />} className="font-bold shadow-md shadow-blue-500/20">
                  Aderir ao Curso & Comunidade
                </Button>
              )}
            </div>
          </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{space.name}</h1>
                  <Badge size="md" variant="primary">{space.category}</Badge>
                </div>
                <p className="text-base text-slate-600 max-w-4xl leading-relaxed">
                  {space.description}
                </p>
              </div>

              {/* Pricing Tag */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-start sm:items-end shrink-0 gap-1">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Acesso ao Curso</span>
                <span className="text-2xl font-bold text-slate-950">
                  {space.courses?.[0]?.isFree || !space.courses?.[0]?.price ? 'Gratuito' : `€${space.courses[0].price}`}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Inclui aulas, canais e certificado</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 text-sm text-slate-600">
              <span className="flex items-center gap-2 font-medium">
                <Users className="w-4 h-4 text-slate-400" />
                {space.membersCount} Alunos
              </span>
              <span>•</span>
              <span className="flex items-center gap-2 font-medium">
                <BookOpen className="w-4 h-4 text-slate-400" />
                {space.coursesCount || 1} Módulos
              </span>
              <span>•</span>
              <span className="font-medium">Criado por {space.owner?.name}</span>
            </div>
          </div>
        </div>

      {/* 2. TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'home', label: 'Início' },
          { id: 'courses', label: `Aulas & Módulos (${space.courses?.length || 0})` },
          { id: 'events', label: `Eventos & Lives (${space.events?.length || 0})` },
          { id: 'members', label: `Membros (${space.membersCount || 0})` },
          { id: 'resources', label: `Recursos (${space.resources?.length || 0})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'text-slate-900 bg-slate-100 border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. TAB CONTENT */}
      <div>
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Announcements */}
              <Card className="p-7 bg-white border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider mb-2">
                  <span>Anúncio Oficial</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bem-vindo a {space.name}</h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Participe nas conversas em <Link to={`/community/${space.slug || space.id}/chat`} className="text-slate-900 font-bold hover:underline">#geral</Link>, acompanhe as aulas integradas e participe nas mentorias ao vivo com partilha de ecrã.
                </p>
              </Card>

              {/* Featured Course / Modules */}
              {space.courses?.[0] && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Aulas Integradas neste Espaço</h4>
                  <Card hover className="p-5 flex items-center justify-between border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center gap-4">
                      <img src={space.courses[0].thumbnailUrl} alt={space.courses[0].title} className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                      <div>
                        <h5 className="font-bold text-slate-900 text-base">{space.courses[0].title}</h5>
                        <p className="text-xs text-slate-500 font-medium mt-1">{space.courses[0].difficulty} • {space.courses[0].durationHours}h de aulas</p>
                      </div>
                    </div>
                    <Link to={`/learn/${space.courses[0].id}`}>
                      <Button variant="primary" size="md" className="font-bold">Aceder às Aulas</Button>
                    </Link>
                  </Card>
                </div>
              )}
            </div>

            {/* Upcoming Events sidebar */}
            <div className="flex flex-col gap-6">
              <Card className="p-6 border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-900" /> Próximos Eventos
                  </h4>
                </div>

                <div className="flex flex-col gap-3">
                  {space.events?.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium py-4 text-center">Sem eventos agendados de momento.</p>
                  ) : (
                    space.events?.map((ev: any) => (
                      <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(ev.startDate).toLocaleDateString()} às {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-slate-700 font-semibold">{ev.location}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {space.courses?.map((c: any) => (
              <Card key={c.id} hover className="p-5 flex flex-col justify-between border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-4">
                  <img src={c.thumbnailUrl} alt={c.title} className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{c.title}</h5>
                    <p className="text-xs text-slate-500 font-medium mt-1">{c.difficulty} • {c.durationHours}h de aulas</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
                  <Link to={`/learn/${c.id}`}>
                    <Button variant="primary" size="md" className="font-bold">Aceder às Aulas do Espaço</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {space.members?.map((m: any) => (
              <Card key={m.id} className="p-4 flex items-center justify-between border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-3">
                  <Avatar src={m.user?.avatarUrl} name={m.user?.name} size="sm" status="online" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{m.user?.name}</p>
                    <p className="text-xs text-slate-400">@{m.user?.username}</p>
                  </div>
                </div>
                <Badge variant={m.role === 'OWNER' ? 'primary' : m.role === 'MODERATOR' ? 'success' : 'outline'} size="sm">
                  {m.role}
                </Badge>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="flex flex-col gap-4 max-w-3xl">
            {space.events?.map((ev: any) => (
              <Card key={ev.id} className="p-6 flex items-start justify-between border-slate-200 bg-white shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{ev.title}</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{ev.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-3">
                    <span>Organizador: {ev.hostName}</span>
                    <span>•</span>
                    <span>Sala: {ev.location}</span>
                  </div>
                </div>
                <Button variant="primary" size="md" className="font-semibold">Participar</Button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="flex flex-col gap-3 max-w-3xl">
            {space.resources?.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 font-medium">Sem ficheiros adicionados a esta comunidade.</Card>
            ) : (
              space.resources?.map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{res.title}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">{res.type}</p>
                  </div>
                  <a href={res.url} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm" rightIcon={<Download className="w-4 h-4" />}>
                      Descarregar
                    </Button>
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};
