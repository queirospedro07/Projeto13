import './CourseDetailsPage.css';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LuStar as Star,
  LuClock as Clock,
  LuUsers as Users,
  LuCircleCheck as CheckCircle2,
  LuPlay as Play,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuBookOpen as BookOpen,
  LuAward as Award,
  LuArrowLeft as ArrowLeft,
  LuLayers as Layers,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { CourseEnrollModal } from '../../components/CourseEnrollModal';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useActiveCall } from '../../context/ActiveCallContext';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';
export const CourseDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCall } = useActiveCall();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModuleIndex, setOpenModuleIndex] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('nexo_course_details_tab');
      return saved && saved !== 'resources' ? saved : 'overview';
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
  const isInstructorOfThisCourse = Boolean(
    user &&
    (user.id === course?.creator?.id ||
      user.id === course?.creatorId ||
      user.id === course?.instructorId),
  );
  const isCreatorOrAdmin = Boolean(user && (user.role === 'ADMIN' || isInstructorOfThisCourse));
  const outcomes =
    Array.isArray(course?.learningOutcomes) && course.learningOutcomes.length > 0
      ? course.learningOutcomes
      : [
          'Construção de projetos práticos e arquiteturas de alta fiabilidade.',
          'Domínio de ferramentas, padrões modernos e fluxos de trabalho da indústria.',
          'Resolução de questionários técnicos, desafios práticos e depuração de código real.',
          'Metodologias recomendadas pelo formador e boas práticas aplicadas.',
        ];
  const reqs =
    Array.isArray(course?.requirements) && course.requirements.length > 0
      ? course.requirements
      : [
          'Computador com acesso à Internet e navegador moderno atualizado.',
          'Curiosidade técnica e compromisso para praticar os conceitos ensinados em cada aula.',
          'Nenhum conhecimento prévio avançado exigido além das noções básicas da categoria.',
        ];
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const fetchCourse = async () => {
    if (!id) return;
    try {
      let data = null;
      try {
        data = await api.get(`/courses/${id}`).then(({ data }) => data);
      } catch {
        try {
          const spaceData = await api.get(`/spaces/${id}`).then(({ data }) => data);
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
              space: spaceData,
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
  }, [id, user?.id]);
  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            isEnrolled: true,
            isMember: true,
          }
        : prev,
    );
    window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
    fetchCourse();
  };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await api
        .post(`/courses/${course.id}/reviews`, {
          rating: reviewRating,
          comment: reviewComment,
        })
        .then(({ data }) => data);
      toast({
        title: 'Avaliação Registada',
        message: 'Obrigado pela sua contribuição pedagógica!',
        type: 'success',
      });
      setReviewComment('');
      fetchCourse();
    } catch (err) {
      toast({
        title: 'Erro ao avaliar',
        message: err.message || 'Não foi possível publicar a sua avaliação.',
        type: 'error',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };
  if (loading) {
    return (
      <div className="course-details-panel">
        <div className="course-details-panel-2" />
        <p className="course-details-description">A carregar os detalhes do curso...</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="course-details-panel-3">
        <h2 className="course-details-heading">Curso Não Encontrado</h2>
        <p className="course-details-description-2">
          O curso solicitado não existe ou foi temporariamente arquivado.
        </p>
        <Link to="/explore">
          <Button variant="secondary" size="md" className="course-details-button">
            Explorar Outros Cursos
          </Button>
        </Link>
      </div>
    );
  }
  const isEnrolled = Boolean(
    course?.isEnrolled || course?.userEnrollment || (user && course?.creator?.id === user.id),
  );
  const userProgress = Math.round(
    course?.userProgress ?? course?.userEnrollment?.progressPercent ?? 0,
  );
  const totalLessons = (course.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const classmates = course.classmates || course.space?.members?.map((m) => m.user || m) || [];
  const difficultyMap = {
    Beginner: 'Iniciante',
    Intermediate: 'Intermédio',
    Advanced: 'Avançado',
  };
  return (
    <>
      <SEO
        title={`${course.title} — Curso na NEXO`}
        description={
          course.description ||
          `Aprenda ${course.title} na plataforma NEXO com aulas práticas, mentoria WebRTC e certificado verificado.`
        }
        canonical={`https://nexo.pt/courses/${course.id}`}
        ogImage={course.thumbnailUrl || '/hero-showcase.jpg'}
      />

      <div className="course-details-panel-4">
        {/* Breadcrumb & Voltar */}
        <div className="course-details-panel-5">
          <div className="course-details-panel-6">
            <Link to="/explore" className="course-details-link">
              <ArrowLeft className="course-details-arrow-left" />
              <span>Catálogo de Cursos</span>
            </Link>
            <span>/</span>
            <span className="course-details-label">{course.title}</span>
          </div>
        </div>

        {/* Hero / Card Principal de Apresentação */}
        <div className="course-details-panel-7">
          <div className="course-details-panel-8">
            {/* Informações Centrais */}
            <div className="course-details-panel-9">
              <div className="course-details-panel-10">
                <span className="course-details-label-2">{formatCategory(course.category)}</span>
                <span className="course-details-label-3">
                  Nível {difficultyMap[course.difficulty] || course.difficulty || 'Geral'}
                </span>
                <span className="course-details-label-4">
                  • {course.language || 'Português (pt-PT)'}
                </span>
              </div>

              <h1 className="course-details-title">{course.title}</h1>

              <p className="course-details-description-3">{course.description}</p>

              {/* Quick Metrics Bar */}
              <div className="course-details-panel-11">
                {course.reviews && course.reviews.length > 0 ? (
                  <span className="course-details-label-5">
                    <Star className="course-details-star" />
                    {(
                      course.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
                      course.reviews.length
                    ).toFixed(1)}{' '}
                    ({course.reviews.length}{' '}
                    {course.reviews.length === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                ) : (
                  <span className="course-details-label-6">
                    <Star className="course-details-star-2" />
                    <span>Sem avaliações</span>
                  </span>
                )}
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Users className="course-details-users" />
                  {course.studentsCount || 0} alunos inscritos
                </span>
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Clock className="course-details-users" />
                  {course.durationHours || 12} horas de carga letiva
                </span>
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Layers className="course-details-users" />
                  {course.modules?.length || 0} módulos ({totalLessons} aulas)
                </span>
              </div>

              {/* Formador */}
              <Link
                to={`/profile/${course.creator?.username || course.creator?.id || ''}`}
                className="course-details-link-2 group/instructor"
                title={
                  course.creator?.name
                    ? `Ver perfil do formador ${course.creator.name}`
                    : 'Ver perfil do formador'
                }
              >
                <Avatar
                  src={course.creator?.avatarUrl}
                  name={course.creator?.name || 'Formador'}
                  size="lg"
                />
                <div>
                  <div className="course-details-panel-6">
                    <span className="course-details-label-9">Formador Oficial</span>
                    <Badge variant="outline" size="sm">
                      Verificado
                    </Badge>
                  </div>
                  <p className="course-details-description-4">
                    {course.creator?.name || 'Especialista Convidado'}
                  </p>
                  <p className="course-details-description-5">
                    {course.creator?.bio ||
                      'Profissional especialista da indústria e instrutor oficial na NEXO.'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Cartão de Aquisição / Acesso Rápido Lateral */}
            <div className="course-details-panel-12">
              <div className="course-details-panel-13">
                {/* Media Thumbnail (Apenas Foto) */}
                <div className="course-details-panel-14">
                  <img
                    src={
                      course.bannerUrl ||
                      course.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'
                    }
                    alt={course.title}
                    className="course-details-image course-details-dynamic-1"
                    style={{
                      '--course-details-object-position':
                        course.bannerPosition || course.thumbnailPosition || 'center',
                    }}
                  />
                </div>

                {/* Corpo de Ações */}
                <div className="course-details-panel-15">
                  <div className="course-details-panel-16">
                    {isInstructorOfThisCourse ? (
                      <div className="course-details-panel-17">
                        <span className="course-details-label-10">
                          <Sparkles className="course-details-sparkles" />
                          Acesso de Formador (Autor)
                        </span>
                        <span className="course-details-label-11">
                          Acesso total ilimitado como formador deste curso
                        </span>
                      </div>
                    ) : isEnrolled ? (
                      <div className="course-details-panel-17">
                        <span className="course-details-label-12">
                          <CheckCircle2 className="course-details-check-circle2" />
                          Já estou neste curso
                        </span>
                        <span className="course-details-label-11">
                          Progresso: {userProgress}% concluído
                        </span>
                      </div>
                    ) : (
                      <div className="course-details-panel-18">
                        <span className="course-details-label-13">{formatCoursePrice(course)}</span>
                        {!course.isFree && Number(course.price || 0) > 0 && (
                          <span className="course-details-label-14">
                            €{(Number(course.price) * 1.5).toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  {isInstructorOfThisCourse ? (
                    <div className="course-details-panel-19">
                      <Link to={`/learn/${course.id}`} className="course-details-link-3">
                        <button className="course-details-button-2">
                          <Play className="course-details-play" />
                          <span>Abrir Sala de Aula (Modo Formador)</span>
                          <ArrowRight className="course-details-arrow-right" />
                        </button>
                      </Link>

                      <Link
                        to={`/creator/courses/${course.id}/edit`}
                        className="course-details-link-3"
                      >
                        <button className="course-details-button-3">
                          <Sparkles className="course-details-sparkles" />
                          <span>Gerir no Estúdio do Formador</span>
                        </button>
                      </Link>
                    </div>
                  ) : isEnrolled ? (
                    <div className="course-details-panel-19">
                      <Link to={`/learn/${course.id}`} className="course-details-link-3">
                        <button className="course-details-button-4">
                          <CheckCircle2 className="course-details-check-circle2-2" />
                          <span>Já estou no curso • Continuar Aulas ({userProgress}%)</span>
                          <ArrowRight className="course-details-arrow-right" />
                        </button>
                      </Link>

                      {isCreatorOrAdmin && (
                        <Link
                          to={`/creator/courses/${course.id}/edit`}
                          className="course-details-link-3"
                        >
                          <button className="course-details-button-3">
                            <Sparkles className="course-details-sparkles" />
                            <span>Editar este Curso no Estúdio</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="course-details-panel-19">
                      <button
                        onClick={() => setShowEnrollModal(true)}
                        className="course-details-button-5"
                      >
                        <span>
                          {course.isFree
                            ? 'Inscrever Gratuitamente'
                            : `Comprar agora • ${formatCoursePrice(course)}`}
                        </span>
                        <ArrowRight className="course-details-arrow-right-2" />
                      </button>

                      {isCreatorOrAdmin && (
                        <Link
                          to={`/creator/courses/${course.id}/edit`}
                          className="course-details-link-3"
                        >
                          <button className="course-details-button-6">
                            <Sparkles className="course-details-sparkles-2" />
                            <span>Editar este Curso no Estúdio</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Vantagens incluídas */}
                  <div className="course-details-panel-20">
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Acesso vitalício ao currículo e atualizações futuras</span>
                    </div>
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Questionários práticos e desafios de código integrados</span>
                    </div>
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Certificado oficial autenticado após 100% de conclusão</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação de Separadores / Tabs */}
        <div className="course-details-panel-22 no-scrollbar">
          {[
            {
              id: 'overview',
              label: 'Visão Geral & Programa',
              icon: BookOpen,
            },
            {
              id: 'curriculum',
              label: `Currículo (${course.modules?.length || 0} módulos)`,
              icon: Layers,
            },
            {
              id: 'reviews',
              label: `Avaliações (${course.reviews?.length || 0})`,
              icon: Star,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`course-details-button-7 ${isActive ? 'course-details-button-8' : 'course-details-button-9'}`}
              >
                <Icon className="course-details-arrow-right-2" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo dos Separadores */}
        <div>
          {/* 1. VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="course-details-panel-23">
              <div className="course-details-panel-24">
                {/* Sobre o Curso */}
                <div className="course-details-panel-25">
                  <h3 className="course-details-subheading">O que é este Curso?</h3>
                  <p className="course-details-description-6">{course.description}</p>
                </div>

                {/* O que vai aprender */}
                <div className="course-details-panel-26">
                  <h4 className="course-details-caption">
                    <Sparkles className="course-details-sparkles-3" />
                    Competências que vai dominar:
                  </h4>
                  <div className="course-details-panel-27">
                    {outcomes.map((item, idx) => (
                      <div key={idx} className="course-details-panel-28 subtle-shadow">
                        <CheckCircle2 className="course-details-check-circle2-4" />
                        <span className="course-details-label-15">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requisitos */}
                <div className="course-details-panel-25">
                  <h4 className="course-details-caption-2">Requisitos e Pré-requisitos</h4>
                  <ul className="course-details-list">
                    {reqs.map((rItem, idx) => (
                      <li key={idx} className="course-details-list-item">
                        {rItem}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coluna Lateral da Visão Geral */}
              <div className="course-details-panel-29">
                {/* Certificado de Conclusão */}
                <div className="course-details-panel-30">
                  <div className="course-details-panel-31">
                    <Award className="course-details-award" />
                  </div>
                  <div>
                    <h4 className="course-details-caption-3">Certificado de Mérito NEXO</h4>
                    <p className="course-details-description-7">
                      Conclua 100% das aulas e quizzes do curso para emitir o seu certificado
                      oficial com código hash criptográfico de validação pública.
                    </p>
                  </div>
                </div>

                {/* Espaço do Servidor */}
                {course.space && (
                  <div className="course-details-panel-32">
                    <div className="course-details-panel-33">
                      <Avatar
                        src={course.space.logoUrl || course.space.iconUrl}
                        name={course.space.name}
                        size="md"
                      />
                      <div>
                        <h4 className="course-details-caption-4">{course.space.name}</h4>
                        <p className="course-details-description-8">Turma Dedicada</p>
                      </div>
                    </div>
                    <p className="course-details-description-9">
                      {course.space.description ||
                        course.space.tagline ||
                        'Canais de voz, partilha de ecrã e salas de estudo dedicadas a este curso.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. CURRÍCULO DETALHADO */}
          {activeTab === 'curriculum' && (
            <div className="course-details-panel-34">
              <div className="course-details-panel-35">
                <span className="course-details-label-16">
                  {course.modules?.length || 0} módulos no total • {totalLessons} aulas programadas
                </span>
                <button
                  onClick={() => setOpenModuleIndex(openModuleIndex === -1 ? null : -1)}
                  className="course-details-button-10"
                >
                  {openModuleIndex === -1 ? 'Recolher Todos' : 'Expandir Todos'}
                </button>
              </div>

              {!course.modules || course.modules.length === 0 ? (
                <div className="course-details-panel-36">
                  <BookOpen className="course-details-book-open" />
                  <h4 className="course-details-caption-5">Estrutura Curricular em Atualização</h4>
                  <p className="course-details-description-10">
                    O formador está a finalizar os ficheiros deste currículo.
                  </p>
                </div>
              ) : (
                course.modules.map((mod, index) => {
                  const isOpen = openModuleIndex === index || openModuleIndex === -1;
                  const modDuration = (mod.lessons || []).reduce(
                    (acc, l) => acc + (l.durationMin || 10),
                    0,
                  );
                  return (
                    <div key={mod.id || index} className="course-details-panel-37">
                      <button
                        onClick={() => setOpenModuleIndex(openModuleIndex === index ? null : index)}
                        className="course-details-button-11"
                      >
                        <div className="course-details-panel-38">
                          <div className="course-details-panel-39">{index + 1}</div>
                          <div className="course-details-panel-40">
                            <h4 className="course-details-caption-6">{mod.title}</h4>
                            {mod.description && (
                              <p className="course-details-description-11">{mod.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="course-details-panel-41">
                          <span className="course-details-label-17">
                            {mod.lessons?.length || 0} aulas • {modDuration}m
                          </span>
                          {isOpen ? (
                            <ChevronUp className="course-details-chevron-up" />
                          ) : (
                            <ChevronDown className="course-details-chevron-up" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="course-details-panel-42">
                          {mod.lessons?.map((les, lIdx) => (
                            <div key={les.id || lIdx} className="course-details-panel-43">
                              <div className="course-details-panel-38">
                                <div className="course-details-panel-44">{lIdx + 1}</div>
                                <div className="course-details-panel-40">
                                  <span className="course-details-label-18">{les.title}</span>
                                  <div className="course-details-panel-45">
                                    {les.type === 'quiz' ? (
                                      <span className="course-details-label-19">
                                        Quiz Avaliativo
                                      </span>
                                    ) : les.type === 'code' ? (
                                      <span className="course-details-label-20">
                                        Desafio Prático de Código
                                      </span>
                                    ) : (
                                      <span className="course-details-label-21">
                                        Aula em Vídeo HD
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="course-details-label-22">
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
            <div className="course-details-panel-46">
              {user ? (
                <div className="course-details-panel-47">
                  <h4 className="course-details-caption-7">Publicar a sua Avaliação</h4>
                  <form onSubmit={handleReviewSubmit} className="course-details-form">
                    <div className="course-details-panel-33">
                      <span className="course-details-label-23">Classificação:</span>
                      <div className="course-details-panel-48">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="course-details-button-12"
                          >
                            <Star
                              className={`course-details-star-3 ${star <= reviewRating ? 'course-details-star-4' : 'course-details-star-5'}`}
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
                      className="course-details-textarea"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSubmittingReview}
                      className="course-details-button-13"
                    >
                      Submeter Avaliação
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="course-details-panel-49">
                  <p className="course-details-description-12">
                    Inicie sessão para poder partilhar a sua avaliação sobre este curso.
                  </p>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="course-details-button">
                      Iniciar Sessão
                    </Button>
                  </Link>
                </div>
              )}

              <div className="course-details-form">
                {!course.reviews || course.reviews.length === 0 ? (
                  <div className="course-details-panel-50">
                    Ainda não existem avaliações para este curso. Seja o primeiro a partilhar a sua
                    opinião!
                  </div>
                ) : (
                  course.reviews.map((r) => (
                    <div key={r.id} className="course-details-panel-32">
                      <div className="course-details-panel-16">
                        <div className="course-details-panel-33">
                          <Avatar src={r.user?.avatarUrl} name={r.user?.name} size="sm" />
                          <div>
                            <span className="course-details-label-24">
                              {r.user?.name || 'Aluno NEXO'}
                            </span>
                            <span className="course-details-label-25">
                              @{r.user?.username || 'aluno'}
                            </span>
                          </div>
                        </div>
                        <div className="course-details-panel-51">
                          {Array.from({
                            length: r.rating || 5,
                          }).map((_, i) => (
                            <Star key={i} className="course-details-play" />
                          ))}
                        </div>
                      </div>
                      <p className="course-details-description-13">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
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
      </div>
    </>
  );
};
export default CourseDetailsPage;
