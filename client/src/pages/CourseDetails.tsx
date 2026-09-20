import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Play, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Download,
  Share2,
  ShieldCheck,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';

export const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'community' | 'reviews' | 'resources'>('overview');
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCourse = async () => {
    if (!id) return;
    try {
      let data: any = null;
      try {
        data = await api.getCourse(id);
      } catch (e) {
        try {
          const spaceData = await api.getSpace(id);
          if (spaceData) {
            data = {
              id: spaceData.id,
              title: spaceData.name,
              slug: spaceData.slug,
              description: spaceData.description,
              thumbnailUrl: spaceData.bannerUrl || spaceData.iconUrl,
              bannerUrl: spaceData.bannerUrl,
              category: spaceData.category || 'Geral',
              difficulty: 'Iniciante',
              durationHours: 10,
              language: 'Português',
              price: 0,
              isFree: true,
              creator: spaceData.owner,
              studentsCount: spaceData.membersCount || 1,
              modules: [],
              space: spaceData
            };
          }
        } catch (e2) {
          console.error(e2);
        }
      }
      setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.enrollCourse(course.id);
      toast({
        title: 'Matrícula Confirmada!',
        message: `Bem-vindo a ${course.title}. Bons estudos!`,
        type: 'success',
      });
      navigate(`/learn/${course.id}`);
    } catch (err: any) {
      toast({
        title: 'Erro na matrícula',
        message: err.message || 'Não foi possível matricular no curso',
        type: 'error',
      });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await api.submitReview(course.id, { rating: reviewRating, comment: reviewComment });
      toast({ title: 'Avaliação Enviada', message: 'Obrigado pelo seu feedback!' });
      setReviewComment('');
      fetchCourse();
    } catch (err) {
      toast({ title: 'Erro ao avaliar', message: 'Não foi possível publicar a avaliação', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-base text-slate-500 font-medium">A carregar detalhes do curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center bg-white rounded-3xl border border-slate-200 p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Curso Não Encontrado</h2>
        <p className="text-slate-500 mb-6">O curso que procura não existe ou foi removido.</p>
        <Link to="/explore">
          <Button variant="secondary" size="md">Voltar ao Catálogo</Button>
        </Link>
      </div>
    );
  }

  const isEnrolled = !!course.userEnrollment;
  const userProgress = course.userEnrollment?.progressPercent || 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Details */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge size="md" variant="primary">{course.category}</Badge>
              <Badge variant="outline" size="md">{course.difficulty}</Badge>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">• {course.language}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-base text-slate-600 leading-relaxed">
              {course.description}
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                {course.averageRating || '5.0'} ({course.reviews?.length || 0} avaliações)
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-slate-400" />
                {course.studentsCount || 0} alunos
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                {course.durationHours} horas
              </span>
            </div>

            {/* Creator info */}
            <div className="flex items-center gap-4 pt-3">
              <Avatar src={course.creator?.avatarUrl} name={course.creator?.name} size="md" />
              <div>
                <p className="text-sm font-bold text-slate-900">Ministrado por {course.creator?.name}</p>
                <p className="text-xs text-slate-500">{course.creator?.bio || 'Instrutor Especialista'}</p>
              </div>
            </div>
          </div>

          {/* Right Card with Video Preview & Enrollment CTA */}
          <div className="lg:col-span-5">
            <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-md">
              <div className="relative h-56 sm:h-64 w-full bg-slate-900 group">
                <img
                  src={course.bannerUrl || course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-7 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  {isEnrolled ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Curso Adquirido
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">Acesso Vitalício Ativo</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {course.isFree ? 'Gratuito' : `€${course.price}`}
                      </span>
                      {!course.isFree && (
                        <span className="text-sm text-slate-400 line-through font-medium">€149</span>
                      )}
                    </div>
                  )}
                </div>

                {isEnrolled ? (
                  <Link to={`/learn/${course.id}`} className="w-full">
                    <Button variant="primary" size="lg" className="w-full font-bold shadow-md shadow-blue-500/20">
                      Continuar Aulas ({Math.round(userProgress)}%)
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={handleEnroll} variant="primary" size="lg" className="w-full font-bold shadow-md shadow-blue-500/20">
                    Inscrever Agora
                  </Button>
                )}

                <div className="flex flex-col gap-3 pt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Acesso vitalício completo ao currículo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Espaço de comunidade & canais ao vivo estilo Discord</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certificado verificado ao concluir 100%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>

      {/* 2. TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'curriculum', label: `Currículo (${course.modules?.length || 0})` },
          { id: 'community', label: 'Espaço & Comunidade' },
          { id: 'reviews', label: `Avaliações (${course.reviews?.length || 0})` },
          { id: 'resources', label: `Recursos (${course.resources?.length || 0})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'text-blue-600 bg-blue-50/80 border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. TABS CONTENT */}
      <div>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Sobre este Curso</h3>
                <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
                <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  O que vai aprender:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Construir arquiteturas resilientes e de alta performance.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Dominar hooks modernos, concorrência e chamadas de servidor.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Canais em tempo real, partilha de ecrã e salas interativas.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Publicar aplicações em produção com total segurança.</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Space teaser sidebar */}
            <div className="flex flex-col gap-4">
              {course.space && (
                <Card className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={course.space.logoUrl} name={course.space.name} size="lg" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{course.space.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">Incluído no curso</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {course.space.tagline || 'Colabore com outros alunos e com o criador em canais de chat e voz ao vivo.'}
                  </p>
                  <Link to={`/community/${course.space.slug || course.space.id}`}>
                    <Button variant="secondary" size="md" className="w-full">
                      Ver Espaço da Comunidade
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* CURRICULUM ACCORDION TAB */}
        {activeTab === 'curriculum' && (
          <div className="flex flex-col gap-4 max-w-4xl">
            {course.modules?.map((mod: any, index: number) => {
              const isOpen = openModuleIndex === index;
              return (
                <Card key={mod.id} className="p-0 overflow-hidden border-slate-200">
                  <button
                    onClick={() => setOpenModuleIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{mod.title}</h4>
                      {mod.description && (
                        <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {mod.lessons?.length || 0} aulas
                      </span>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-slate-100 bg-slate-50/50 border-t border-slate-100">
                      {mod.lessons?.map((les: any, lIdx: number) => (
                        <div key={les.id} className="p-4 sm:px-6 flex items-center justify-between text-sm hover:bg-white transition-colors">
                          <div className="flex items-center gap-3.5">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-xs">
                              {lIdx + 1}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">{les.title}</span>
                              {les.type === 'quiz' && (
                                <Badge size="sm" variant="accent" className="ml-2.5 font-bold">Quiz (+{les.xpReward} XP)</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{les.durationMin}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* COMMUNITY SPACE TAB */}
        {activeTab === 'community' && (
          <Card className="p-8 max-w-3xl flex flex-col gap-5">
            <h3 className="text-xl font-bold text-slate-900">Comunidade e Servidor do Curso</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Ao inscrever-se neste curso, ganha acesso imediato ao servidor da turma com canais de texto temáticos, canais de voz, partilha de ecrã para tirar dúvidas e conferências com o instrutor {course.creator?.name}.
            </p>
            {course.spaceId && (
              <Link to={`/community/${course.spaceId}`}>
                <Button variant="primary" size="md" className="self-start">Abrir Espaço da Comunidade</Button>
              </Link>
            )}
          </Card>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl flex flex-col gap-6">
            {/* Add Review */}
            {isEnrolled && (
              <Card className="p-6">
                <h4 className="font-bold text-slate-900 text-base mb-4">Deixar uma Avaliação</h4>
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">Classificação:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="cursor-pointer p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Partilhe a sua opinião sobre este curso..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                  <Button type="submit" variant="primary" size="md" isLoading={isSubmittingReview} className="self-end font-semibold">
                    Publicar Avaliação
                  </Button>
                </form>
              </Card>
            )}

            {/* Reviews List */}
            <div className="flex flex-col gap-4">
              {course.reviews?.length === 0 ? (
                <Card className="py-12 text-center text-slate-500 font-medium">
                  Ainda não existem avaliações. Seja o primeiro a avaliar!
                </Card>
              ) : (
                course.reviews?.map((r: any) => (
                  <Card key={r.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.user?.avatarUrl} name={r.user?.name} size="sm" />
                        <div>
                          <span className="text-sm font-bold text-slate-900">{r.user?.name}</span>
                          <span className="text-xs text-slate-400 ml-2">@{r.user?.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="max-w-3xl flex flex-col gap-3">
            {course.resources?.length === 0 ? (
              <Card className="py-12 text-center text-slate-500 font-medium">
                Sem ficheiros adicionais associados a este curso.
              </Card>
            ) : (
              course.resources?.map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                      {res.type}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{res.title}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {res.sizeBytes ? `${(res.sizeBytes / 1024 / 1024).toFixed(1)} MB` : 'Link Direto'}
                      </p>
                    </div>
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
