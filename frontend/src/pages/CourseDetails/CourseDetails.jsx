import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Users,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Award,
  ShieldCheck,
  Video,
  HelpCircle,
  FileCode2,
  Share2,
  ArrowLeft,
  Check,
  Calendar,
  Layers,
  GraduationCap,
  Radio
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { CourseEnrollModal } from '../../components/course/CourseEnrollModal';
import { SocialShareModal } from '../../components/common/SocialShareModal';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useActiveCall } from '../../context/ActiveCallContext';
import { api } from '../../services/api';

export const CourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCall } = useActiveCall();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('nexo_course_details_tab') || 'overview';
    } catch {
      return 'overview';
    }
  });

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('nexo_course_details_tab', tabId);
    } catch {}
  };
  const isInstructorOfThisCourse = Boolean(user && (user.id === course?.creator?.id || user.id === course?.creatorId || user.id === course?.instructorId));
  const isCreatorOrAdmin = Boolean(user && (user.role === 'ADMIN' || isInstructorOfThisCourse));

  const outcomes = (Array.isArray(course?.learningOutcomes) && course.learningOutcomes.length > 0)
    ? course.learningOutcomes
    : [
        'Construção de projetos práticos e arquiteturas de alta fiabilidade.',
        'Domínio de ferramentas, padrões modernos e fluxos de trabalho da indústria.',
        'Resolução de quizzes técnicos, desafios práticos e depuração de código real.',
        'Metodologias recomendadas pelo formador e boas práticas aplicadas.'
      ];

  const reqs = (Array.isArray(course?.requirements) && course.requirements.length > 0)
    ? course.requirements
    : [
        'Computador com acesso à Internet e navegador moderno atualizado.',
        'Curiosidade técnica e compromisso para praticar os conceitos ensinados em cada aula.',
        'Nenhum conhecimento prévio avançado exigido além das noções básicas da categoria.'
      ];

  const courseDocs = Array.isArray(course?.documents) && course.documents.length > 0
    ? course.documents
    : (course?.resources || []);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchCourse = async () => {
    if (!id) return;
    try {
      let data = null;
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
              language: 'Português (Portugal)',
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

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    fetchCourse();
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await api.submitReview(course.id, {
        rating: reviewRating,
        comment: reviewComment
      });
      toast({
        title: 'Avaliação Registada',
        message: 'Obrigado pela sua contribuição pedagógica!',
        type: 'success'
      });
      setReviewComment('');
      fetchCourse();
    } catch (err) {
      toast({
        title: 'Erro ao avaliar',
        message: err.message || 'Não foi possível publicar a sua avaliação.',
        type: 'error'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Ligação Copiada',
      message: 'A ligação do curso foi copiada para a área de transferência.',
      type: 'info'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-base text-slate-500 dark:text-zinc-400 font-medium">A carregar os detalhes do curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 shadow-xs">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Curso Não Encontrado</h2>
        <p className="text-slate-500 dark:text-zinc-400 mb-6">O curso solicitado não existe ou foi temporariamente arquivado.</p>
        <Link to="/explore">
          <Button variant="secondary" size="md" className="font-bold">
            Explorar Outros Cursos
          </Button>
        </Link>
      </div>
    );
  }

  const isEnrolled = !!course.userEnrollment;
  const userProgress = Math.round(course.userEnrollment?.progressPercent || 0);
  const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const previewVideo = course.previewVideoUrl || course.modules?.[0]?.lessons?.[0]?.videoUrl;
  const classmates = course.classmates || (course.space?.members?.map(m => m.user || m) || []);

  const difficultyMap = {
    Beginner: 'Iniciante',
    Intermediate: 'Intermédio',
    Advanced: 'Avançado'
  };

  return (
    <>
      <SEO
        title={`${course.title} — Curso na NEXO`}
        description={course.description || `Aprenda ${course.title} na plataforma NEXO com aulas práticas, mentoria WebRTC e certificado verificado.`}
        canonical={`https://nexo.pt/courses/${course.id}`}
        ogImage={course.thumbnailUrl || '/hero-showcase.jpg'}
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-20">
        
        {/* ── Breadcrumb & Voltar ── */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Link
              to="/explore"
              className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catálogo de Cursos</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-zinc-200 font-bold truncate max-w-xs sm:max-w-md">
              {course.title}
            </span>
          </div>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Partilhar curso"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partilhar</span>
          </button>
        </div>

      {/* ── Hero / Card Principal de Apresentação ── */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Informações Centrais */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                {course.category || 'Tecnologia'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">
                Nível {difficultyMap[course.difficulty] || course.difficulty || 'Geral'}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                • {course.language || 'Português (pt-PT)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              {course.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-neutral-900">
              {course.reviews && course.reviews.length > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {(course.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / course.reviews.length).toFixed(1)} ({course.reviews.length} {course.reviews.length === 1 ? 'avaliação' : 'avaliações'})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-xs font-semibold">
                  <Star className="w-4 h-4 text-slate-300 dark:text-neutral-700" />
                  <span>Sem avaliações</span>
                </span>
              )}
              <span className="text-slate-300 dark:text-neutral-800">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                {course.studentsCount || 0} alunos inscritos
              </span>
              <span className="text-slate-300 dark:text-neutral-800">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                {course.durationHours || 12} horas de carga letiva
              </span>
              <span className="text-slate-300 dark:text-neutral-800">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                {course.modules?.length || 0} módulos ({totalLessons} aulas)
              </span>
            </div>

            {/* Formador */}
            <Link
              to={`/profile/${course.creator?.username || course.creator?.id || ''}`}
              className="flex items-center gap-4 pt-3 group/instructor hover:opacity-90 transition-opacity cursor-pointer border-t border-slate-100 dark:border-neutral-900"
              title={course.creator?.name ? `Ver perfil do formador ${course.creator.name}` : 'Ver perfil do formador'}
            >
              <Avatar src={course.creator?.avatarUrl} name={course.creator?.name || 'Formador'} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Formador Oficial
                  </span>
                  <Badge variant="outline" size="sm">Verificado</Badge>
                </div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white group-hover/instructor:text-blue-500 dark:group-hover/instructor:text-blue-400 transition-colors">
                  {course.creator?.name || 'Especialista Convidado'}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                  {course.creator?.bio || 'Profissional especialista da indústria e instrutor oficial na NEXO.'}
                </p>
              </div>
            </Link>
          </div>

          {/* Cartão de Aquisição / Acesso Rápido Lateral */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-[#0a0a0a] shadow-lg sticky top-6">
              
              {/* Media Thumbnail / Preview */}
              <div className="relative aspect-video w-full bg-neutral-900 group overflow-hidden">
                <img
                  src={course.bannerUrl || course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  style={{ objectPosition: course.bannerPosition || course.thumbnailPosition || 'center' }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {previewVideo ? (
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 transition-all cursor-pointer group/btn"
                      title="Ver pré-visualização do curso"
                    >
                      <Play className="w-7 h-7 fill-current ml-1 text-blue-600 transition-transform group-hover/btn:scale-110" />
                    </button>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/80 text-slate-950 flex items-center justify-center shadow-md">
                      <GraduationCap className="w-7 h-7 text-blue-600" />
                    </div>
                  )}
                </div>
                {previewVideo && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    Trailer / Aula Piloto
                  </span>
                )}
              </div>

              {/* Corpo de Ações */}
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  {isInstructorOfThisCourse ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        Acesso de Formador (Autor)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Acesso total ilimitado como formador deste curso
                      </span>
                    </div>
                  ) : isEnrolled ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Inscrição Ativa
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Progresso: {userProgress}% concluído
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-950 dark:text-white">
                        {course.isFree || course.price === 0 || !course.price ? 'Gratuito' : `€${course.price}`}
                      </span>
                      {!course.isFree && course.price > 0 && (
                        <span className="text-sm text-slate-400 line-through font-medium">
                          €{(course.price * 1.5).toFixed(0)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                {isInstructorOfThisCourse ? (
                  <div className="flex flex-col gap-2.5">
                    <Link to={`/learn/${course.id}`} className="w-full">
                      <button className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <Play className="w-4 h-4 fill-current" />
                        <span>Abrir Sala de Aula (Modo Formador)</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </Link>

                    <Link to={`/creator/courses/${course.id}/edit`} className="w-full">
                      <button className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-900 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-neutral-700">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>Gerir no Estúdio do Formador</span>
                      </button>
                    </Link>
                  </div>
                ) : isEnrolled ? (
                  <div className="flex flex-col gap-2.5">
                    <Link to={`/learn/${course.id}`} className="w-full">
                      <button className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <Play className="w-4 h-4 fill-current" />
                        <span>Continuar Aulas ({userProgress}%)</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </Link>

                    {isCreatorOrAdmin && (
                      <Link to={`/creator/courses/${course.id}/edit`} className="w-full">
                        <button className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-900 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-neutral-700">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span>Editar este Curso no Studio</span>
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setShowEnrollModal(true)}
                      className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>{course.isFree ? 'Inscrever Gratuitamente' : 'Adquirir Acesso Completo'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {isCreatorOrAdmin && (
                      <Link to={`/creator/courses/${course.id}/edit`} className="w-full">
                        <button className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-900 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-neutral-700">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Editar este Curso no Studio</span>
                        </button>
                      </Link>
                    )}
                  </div>
                )}

                {/* Vantagens incluídas */}
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 dark:border-neutral-800 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Acesso vitalício ao currículo e atualizações futuras</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Documentos e materiais de apoio para download</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quizzes práticos e desafios de código integrados</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certificado oficial autenticado após 100% de conclusão</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegação de Separadores / Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral & Programa', icon: BookOpen },
          { id: 'curriculum', label: `Currículo (${course.modules?.length || 0} módulos)`, icon: Layers },
          { id: 'resources', label: `Recursos & Ficheiros (${courseDocs.length})`, icon: FileCode2 },
          { id: 'reviews', label: `Avaliações (${course.reviews?.length || 0})`, icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'text-white bg-slate-950 dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Conteúdo dos Separadores ── */}
      <div>
        
        {/* 1. VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Sobre o Curso */}
              <div className="p-7 sm:p-8 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs">
                <h3 className="text-xl font-black text-slate-950 dark:text-white mb-4">
                  O que é este Curso?
                </h3>
                <p className="text-slate-600 dark:text-zinc-300 text-base leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>

              {/* O que vai aprender */}
              <div className="p-7 sm:p-8 rounded-2xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800">
                <h4 className="font-black text-slate-950 dark:text-white text-lg mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Competências que vai dominar:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-zinc-300">
                  {outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-black/60 border border-slate-100 dark:border-neutral-800/80 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requisitos */}
              <div className="p-7 sm:p-8 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs">
                <h4 className="font-black text-slate-950 dark:text-white text-lg mb-4">
                  Requisitos e Pré-requisitos
                </h4>
                <ul className="list-disc pl-5 space-y-2.5 text-sm text-slate-600 dark:text-zinc-400">
                  {reqs.map((rItem, idx) => (
                    <li key={idx} className="leading-relaxed">{rItem}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coluna Lateral da Visão Geral */}
            <div className="flex flex-col gap-6">
              
              {/* Certificado de Conclusão */}
              <div className="p-6 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white text-base">
                    Certificado de Mérito NEXO
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Conclua 100% das aulas e quizzes do curso para emitir o seu certificado oficial com código hash criptográfico de validação pública.
                  </p>
                </div>
              </div>

              {/* Espaço do Servidor */}
              {course.space && (
                <div className="p-6 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={course.space.logoUrl || course.space.iconUrl} name={course.space.name} size="md" />
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-sm">
                        {course.space.name}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        Turma Dedicada
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {course.space.description || course.space.tagline || 'Canais de voz, partilha de ecrã e salas de estudo dedicadas a este curso.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. CURRÍCULO DETALHADO */}
        {activeTab === 'curriculum' && (
          <div className="flex flex-col gap-4 max-w-4xl">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
                {course.modules?.length || 0} módulos no total • {totalLessons} aulas programadas
              </span>
              <button
                onClick={() => setOpenModuleIndex(openModuleIndex === -1 ? 0 : -1)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {openModuleIndex === -1 ? 'Expandir Todos' : 'Recolher Todos'}
              </button>
            </div>

            {(!course.modules || course.modules.length === 0) ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white">Estrutura Curricular em Atualização</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">O formador está a finalizar os ficheiros deste currículo.</p>
              </div>
            ) : (
              course.modules.map((mod, index) => {
                const isOpen = openModuleIndex === index || openModuleIndex === -1;
                const modDuration = (mod.lessons || []).reduce((acc, l) => acc + (l.durationMin || 10), 0);

                return (
                  <div
                    key={mod.id || index}
                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-white dark:bg-black shadow-xs transition-all"
                  >
                    <button
                      onClick={() => setOpenModuleIndex(openModuleIndex === index ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-950 dark:text-white text-base truncate">
                            {mod.title}
                          </h4>
                          {mod.description && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                              {mod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-neutral-900 px-2.5 py-1 rounded-lg">
                          {mod.lessons?.length || 0} aulas • {modDuration}m
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-slate-100 dark:divide-neutral-900 bg-slate-50/50 dark:bg-[#070707] border-t border-slate-100 dark:border-neutral-800">
                        {mod.lessons?.map((les, lIdx) => (
                          <div
                            key={les.id || lIdx}
                            className="p-4 sm:px-6 flex items-center justify-between text-sm hover:bg-white dark:hover:bg-neutral-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {lIdx + 1}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 dark:text-zinc-200 truncate block">
                                  {les.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {les.type === 'quiz' ? (
                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                      Quiz Avaliativo (+{les.xpReward || 50} XP)
                                    </span>
                                  ) : les.type === 'code' ? (
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                      Desafio Prático de Código
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                                      Aula em Vídeo HD
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 shrink-0 ml-3">
                              {les.durationMin || 12} min
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. AVALIAÇÕES */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl flex flex-col gap-6">
            {user ? (
              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs">
                <h4 className="font-extrabold text-slate-950 dark:text-white text-base mb-4">
                  Publicar a sua Avaliação
                </h4>
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Classificação:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="cursor-pointer p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-neutral-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Partilhe a sua experiência de aprendizagem sobre este curso..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-blue-500 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmittingReview}
                    className="self-end font-bold"
                  >
                    Submeter Avaliação
                  </Button>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800">
                <p className="text-slate-600 dark:text-zinc-400 text-sm mb-3">
                  Inicie sessão para poder partilhar a sua avaliação sobre este curso.
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="font-bold">
                    Iniciar Sessão
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {(!course.reviews || course.reviews.length === 0) ? (
                <div className="py-12 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-zinc-400 font-medium text-sm">
                  Ainda não existem avaliações para este curso. Seja o primeiro a partilhar a sua opinião!
                </div>
              ) : (
                course.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-6 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.user?.avatarUrl} name={r.user?.name} size="sm" />
                        <div>
                          <span className="text-sm font-extrabold text-slate-950 dark:text-white">
                            {r.user?.name || 'Aluno NEXO'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 ml-2">
                            @{r.user?.username || 'aluno'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {r.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. RECURSOS E FICHEIROS */}
        {activeTab === 'resources' && (
          <div className="max-w-3xl flex flex-col gap-4">
            {(!courseDocs || courseDocs.length === 0) ? (
              <div className="py-12 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-zinc-400 font-medium text-sm">
                Sem ficheiros adicionais associados a este curso neste momento.
              </div>
            ) : (
              courseDocs.map((doc, dIdx) => {
                const docUrl = doc.url || doc.data || '#';
                const docTitle = doc.title || doc.name || `Documento ${dIdx + 1}`;
                const docType = (doc.type || 'PDF').toUpperCase();
                const docSize = doc.sizeBytes
                  ? `${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : doc.size || 'Ficheiro de Apoio';

                return (
                  <div
                    key={doc.id || dIdx}
                    className="flex items-center justify-between p-5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {docType.length > 4 ? docType.slice(0, 4) : docType}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{docTitle}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                          {docSize} • Disponibilizado pelo Formador
                        </p>
                      </div>
                    </div>
                    <a
                      href={docUrl}
                      download={docTitle}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="secondary" size="sm" rightIcon={<Download className="w-4 h-4" />}>
                        Descarregar
                      </Button>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Matrícula / Compra */}
      <CourseEnrollModal
        isOpen={showEnrollModal}
        course={course}
        onClose={() => setShowEnrollModal(false)}
        onEnrollSuccess={handleEnrollSuccess}
      />

      {/* Modal de Pré-visualização de Vídeo */}
      {showVideoModal && previewVideo && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 animate-fade-in" style={{ isolation: 'isolate' }}>
          <div className="fixed inset-0 bg-black/90" onClick={() => setShowVideoModal(false)} aria-hidden="true" />
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl z-10 animate-scale-in">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar Pré-visualização
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={previewVideo}
                title="Pré-visualização do Curso"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={course.title}
        text={`Estou a aprender no curso "${course.title}" na plataforma NEXO! Recomendo vivamente:`}
        url={window.location.href}
      />
    </div>
    </>
  );
};

export default CourseDetails;