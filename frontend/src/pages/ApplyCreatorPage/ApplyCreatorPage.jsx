import './ApplyCreatorPage.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LuSparkles as Sparkles,
  LuClock as Clock,
  LuCircleAlert as AlertCircle,
  LuArrowRight as ArrowRight,
  LuArrowLeft as ArrowLeft,
  LuSend as Send,
  LuCodeXml as Code2,
  LuCpu as Cpu,
  LuShield as Shield,
  LuCloud as Cloud,
  LuPalette as Palette,
  LuCoins as Coins,
  LuCheck as Check,
  LuUserCheck as UserCheck,
} from 'react-icons/lu';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const EXPERTISE_OPTIONS = [
  {
    id: 'web',
    label: 'Engenharia Web & Full-Stack',
    desc: 'React, Node.js, TypeScript, Next.js, APIs',
    icon: Code2,
  },
  {
    id: 'ai',
    label: 'Inteligência Artificial & Dados',
    desc: 'LLMs, Python, Machine Learning, Análise de Dados',
    icon: Cpu,
  },
  {
    id: 'security',
    label: 'Cibersegurança & Red Team',
    desc: 'Pentesting, Ethical Hacking, DevSecOps, Auditoria',
    icon: Shield,
  },
  {
    id: 'cloud',
    label: 'Cloud Computing & DevOps',
    desc: 'AWS, Docker, Kubernetes, CI/CD, Terraform',
    icon: Cloud,
  },
  {
    id: 'design',
    label: 'UI/UX Design & Produto',
    desc: 'Figma, Sistemas de Design, Prototipagem, Usabilidade',
    icon: Palette,
  },
  {
    id: 'business',
    label: 'Finanças, Negócios & Web3',
    desc: 'Gestão Tecnológica, Blockchain, Smart Contracts',
    icon: Coins,
  },
];
const EXPERIENCE_LEVELS = [
  {
    value: 2,
    label: '1 a 2 Anos',
    badge: 'Início de Carreira',
  },
  {
    value: 4,
    label: '3 a 5 Anos',
    badge: 'Recomendado',
  },
  {
    value: 8,
    label: '6 a 10 Anos',
    badge: 'Sénior / Especialista',
  },
  {
    value: 12,
    label: 'Mais de 10 Anos',
    badge: 'Veterano da Indústria',
  },
];

export const ApplyCreatorPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    bio: user?.bio || '',
    expertise: 'Engenharia Web & Full-Stack',
    experienceYears: 4,
    portfolioUrl: '',
    motivation: '',
    proposedCourses: '',
    sampleVideoUrl: '',
    agreedTerms: false,
  });
  const fetchStatus = async () => {
    try {
      const res = await api.get('/creator/application-status').then(({ data }) => data);
      if (res?.application) {
        setApplication(res.application);
        // Pre-fill form with prior data if rejected so user can rectify easily
        if (res.application.status === 'REJECTED') {
          setFormData((prev) => ({
            ...prev,
            fullName: res.application.fullName || prev.fullName,
            bio: res.application.bio || prev.bio,
            expertise: res.application.expertise || prev.expertise,
            experienceYears: res.application.experienceYears || prev.experienceYears,
            portfolioUrl: res.application.portfolioUrl || prev.portfolioUrl,
            motivation: res.application.motivation || prev.motivation,
            proposedCourses: res.application.proposedCourses || prev.proposedCourses,
            sampleVideoUrl: res.application.sampleVideoUrl || prev.sampleVideoUrl,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
        toast({
          title: 'Nome Obrigatório',
          message: 'Indique o seu nome completo com pelo menos 3 caracteres.',
          type: 'error',
        });

        return false;
      }

      if (!formData.bio.trim() || formData.bio.trim().length < 20) {
        toast({
          title: 'Biografia Curta',
          message: 'Descreva resumidamente o seu percurso profissional (mínimo 20 caracteres).',
          type: 'error',
        });

        return false;
      }
    }

    if (step === 2) {
      if (!formData.expertise.trim()) {
        toast({
          title: 'Área Obrigatória',
          message: 'Selecione ou indique a sua área principal de especialização.',
          type: 'error',
        });

        return false;
      }
    }

    if (step === 3) {
      if (!formData.motivation.trim() || formData.motivation.trim().length < 20) {
        toast({
          title: 'Motivação Obrigatória',
          message: 'Partilhe a sua motivação para lecionar no NEXO (mínimo 20 caracteres).',
          type: 'error',
        });

        return false;
      }

      if (!formData.proposedCourses.trim() || formData.proposedCourses.trim().length < 30) {
        toast({
          title: 'Proposta Incompleta',
          message:
            'Apresente os detalhes da proposta pedagógica (título do curso e tópicos previstos).',
          type: 'error',
        });

        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({
        top: 120,
        behavior: 'smooth',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({
      top: 120,
      behavior: 'smooth',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    if (!formData.agreedTerms) {
      toast({
        title: 'Termo Pedagógico',
        message:
          'Por favor, assinale o compromisso de rigor pedagógico e ética da plataforma NEXO.',
        type: 'error',
      });

      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/creator/apply', formData).then(({ data }) => data);

      toast({
        title: 'Inquérito Submetido!',
        message:
          res.message ||
          'O seu inquérito foi submetido com sucesso para análise do Conselho Pedagógico.',
        type: 'success',
      });
      setApplication(res.application);
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      toast({
        title: 'Falha ao Submeter',
        message: err.message || 'Não foi possível submeter o inquérito. Tente novamente.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="apply-creator-panel">
        <div className="apply-creator-panel-2" />
        <span className="apply-creator-label">A carregar inquérito de candidatura...</span>
      </div>
    );
  }

  // Se já é Formador ou Administrador
  if (user?.role === 'CREATOR' || user?.role === 'ADMIN') {
    return (
      <div className="apply-creator-panel-3">
        <Card className="apply-creator-card">
          <div className="apply-creator-panel-4">
            <UserCheck className="apply-creator-user-check" />
          </div>
          <Badge
            size="md"
            variant="primary"
            className="apply-creator-badge"
          >
            Estatuto Ativo
          </Badge>
          <h2 className="apply-creator-heading">
            Já possui estatuto de{' '}
            {user?.role === 'ADMIN' ? 'Administrador e Formador' : 'Formador NEXO'}
          </h2>
          <p className="apply-creator-description">
            A sua conta tem permissões completas de publicação de módulos, criação de salas de
            mentoria WebRTC e emissão de certificados oficiais.
          </p>
          <Link to="/creator">
            <Button
              as="span"
              variant="primary"
              size="lg"
              className="apply-creator-button"
            >
              Aceder ao Painel do Criador
              <ArrowRight className="apply-creator-arrow-right" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Se tem candidatura PENDENTE (Timeline Corporativa de Moderação)
  if (application && application.status === 'PENDING') {
    return (
      <div className="apply-creator-panel-5">
        <div className="apply-creator-panel-6">
          <div className="apply-creator-panel-7">
            <div className="apply-creator-panel-8">
              <Clock className="apply-creator-clock" />
            </div>
            <div>
              <span className="apply-creator-label-2">Em Análise do Conselho Pedagógico</span>
              <h2 className="apply-creator-heading-2">Inquérito Submetido com Sucesso</h2>
            </div>
          </div>

          <p className="apply-creator-description-2">
            O seu inquérito foi registado na plataforma. O Conselho Pedagógico da NEXO analisa a
            proposta metodológica, os tópicos dos cursos e os materiais de apresentação antes de
            libertar o acesso ao estúdio de publicação.
          </p>

          {/* Corporate 3-Step Process Timeline */}
          <div className="apply-creator-panel-9">
            {/* Step 1 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-11">
                <Check className="apply-creator-check" />
              </div>
              <h4 className="apply-creator-caption">1. Submissão Concluída</h4>
              <p className="apply-creator-description-3">Inquérito e materiais enviados</p>
              <span className="apply-creator-label-3">
                {new Date(application.createdAt || Date.now()).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Step 2 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-12" />
              <h4 className="apply-creator-caption-2">2. Moderação Pedagógica em Curso</h4>
              <p className="apply-creator-description-3">
                Avaliação de qualidade curricular e didática
              </p>
              <p className="apply-creator-description-4">
                Tempo médio de homologação: 24 a 48 horas úteis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-13" />
              <h4 className="apply-creator-caption-3">3. Ativação do Estúdio de Criador</h4>
              <p className="apply-creator-description-5">
                Libertação do painel de cursos, salas WebRTC e remuneração
              </p>
            </div>
          </div>

          {/* Submission Recap Summary Box */}
          <div className="apply-creator-panel-14">
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Candidato:</span>
              <span className="apply-creator-label-5">{application.fullName}</span>
            </div>
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Área de Especialização:</span>
              <span className="apply-creator-label-6">{application.expertise}</span>
            </div>
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Experiência Indicada:</span>
              <span className="apply-creator-label-5">{application.experienceYears} Anos</span>
            </div>
            <div>
              <span className="apply-creator-label-7">Cursos Previstos:</span>
              <p className="apply-creator-description-6">{application.proposedCourses}</p>
            </div>
          </div>

          <div className="apply-creator-panel-16">
            <Link to="/dashboard">
              <Button
                as="span"
                variant="secondary"
                size="md"
                className="apply-creator-button-2"
              >
                Voltar ao Painel do Aluno
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulário Oficial Multi-Step
  return (
    <div className="apply-creator-panel-17">
      {/* Header */}
      <div className="apply-creator-panel-18">
        <div className="apply-creator-panel-19">
          <Sparkles className="apply-creator-sparkles" />
          <span>Programa Oficial de Formadores NEXO</span>
        </div>
        <h1 className="apply-creator-title">Inquérito de Candidatura a Criador</h1>
        <p className="apply-creator-description-7">
          Submeta o seu perfil e proposta de cursos para validação. Junte-se a uma rede de
          especialistas que ensinam tecnologia com rigor e prática em tempo real.
        </p>
      </div>

      {/* Rejection Notice with Rectification action */}
      {application?.status === 'REJECTED' && (
        <div className="apply-creator-panel-20">
          <div className="apply-creator-panel-21">
            <AlertCircle className="apply-creator-alert-circle" />
          </div>
          <div>
            <h4 className="apply-creator-caption-4">Candidatura Anterior Necessita de Ajustes</h4>
            <p className="apply-creator-description-8">
              <strong>Parecer da Administração:</strong>{' '}
              {application.adminFeedback ||
                'Ajuste a ementa dos cursos propostos e reenvie o inquérito para nova apreciação.'}
            </p>
            <p className="apply-creator-description-9">
              Os seus dados anteriores foram recuperados abaixo para facilitar a retificação.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Navigation Bar */}
      <div className="apply-creator-panel-22">
        <div className="apply-creator-panel-23">
          {[
            {
              step: 1,
              title: 'Identificação',
              desc: 'Dados Pessoais',
            },
            {
              step: 2,
              title: 'Especialidade',
              desc: 'Domínio Técnico',
            },
            {
              step: 3,
              title: 'Pedagogia',
              desc: 'Proposta de Cursos',
            },
            {
              step: 4,
              title: 'Revisão',
              desc: 'Materiais & Envio',
            },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step < currentStep) setCurrentStep(s.step);
                }}
                disabled={s.step > currentStep}
                className={`apply-creator-button-3 ${isActive ? 'apply-creator-button-4' : isCompleted ? 'apply-creator-button-5' : 'apply-creator-button-6'}`}
              >
                <div
                  className={`apply-creator-panel-24 ${isCompleted ? 'apply-creator-panel-25' : isActive ? 'apply-creator-panel-26' : 'apply-creator-panel-27'}`}
                >
                  {isCompleted ? <Check className="apply-creator-check-2" /> : s.step}
                </div>
                <div className="apply-creator-panel-28">
                  <p
                    className={`apply-creator-description-10 ${isActive ? 'apply-creator-description-11' : 'apply-creator-description-12'}`}
                  >
                    {s.title}
                  </p>
                  <p className="apply-creator-description-13">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Card */}
      <Card className="apply-creator-card-2">
        <form onSubmit={handleSubmit}>
          {/* STEP 1: IDENTIFICAÇÃO & PERFIL */}
          {currentStep === 1 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 1: Identificação & Perfil Profissional
                </h3>
                <p className="apply-creator-description-14">
                  Estes dados serão utilizados para compor a ficha técnica de formador na
                  plataforma.
                </p>
              </div>

              <div className="apply-creator-panel-31">
                <div>
                  <label className="apply-creator-field-label">Nome Completo Profissional *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ex.: Engenheiro Pedro Silva"
                    className="apply-creator-field"
                  />
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Biografia Executiva & Trajetória *
                  </label>
                  <textarea
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Resuma a sua formação académica, certificações, empresas onde trabalhou ou projetos de engenharia de destaque."
                    className="apply-creator-textarea"
                  />
                  <div className="apply-creator-panel-32">
                    <span>Mínimo recomendado: 20 caracteres</span>
                    <span>{formData.bio.length} caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Portfólio Oficial / LinkedIn / GitHub
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/seunome ou https://github.com/seunome"
                    className="apply-creator-field-2"
                  />
                  <span className="apply-creator-label-8">
                    Facilita a validação do seu histórico de código e experiência pelo Conselho.
                  </span>
                </div>
              </div>

              <div className="apply-creator-panel-33">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={nextStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Especialidade Técnica
                  <ArrowRight className="apply-creator-arrow-right" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ESPECIALIDADE & ANOS DE EXPERIÊNCIA */}
          {currentStep === 2 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 2: Domínio Técnico & Anos de Carreira
                </h3>
                <p className="apply-creator-description-14">
                  Selecione o ecossistema principal em que pretende lecionar e estruturar cursos.
                </p>
              </div>

              {/* Visual Category Selection Grid */}
              <div>
                <label className="apply-creator-field-label-2">Área de Ensino *</label>
                <div className="apply-creator-panel-34">
                  {EXPERTISE_OPTIONS.map((opt) => {
                    const isSelected = formData.expertise === opt.label;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            expertise: opt.label,
                          }))
                        }
                        className={`apply-creator-button-8 ${isSelected ? 'apply-creator-button-9' : 'apply-creator-button-10'}`}
                      >
                        <div
                          className={`apply-creator-panel-35 ${isSelected ? 'apply-creator-panel-36' : 'apply-creator-panel-27'}`}
                        >
                          <Icon className="apply-creator-alert-circle" />
                        </div>
                        <div className="apply-creator-panel-37">
                          <p className="apply-creator-description-15">{opt.label}</p>
                          <p className="apply-creator-description-16">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level Pill Selector */}
              <div>
                <label className="apply-creator-field-label-2">
                  Tempo de Experiência Prática no Mercado *
                </label>
                <div className="apply-creator-panel-38">
                  {EXPERIENCE_LEVELS.map((lvl) => {
                    const isSelected = Number(formData.experienceYears) === lvl.value;

                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            experienceYears: lvl.value,
                          }))
                        }
                        className={`apply-creator-button-11 ${isSelected ? 'apply-creator-button-12' : 'apply-creator-button-13'}`}
                      >
                        <div className="apply-creator-panel-39">{lvl.label}</div>
                        <span className="apply-creator-label-9">{lvl.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="apply-creator-panel-40">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={prevStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={nextStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Proposta Curricular
                  <ArrowRight className="apply-creator-arrow-right" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PROPOSTA PEDAGÓGICA & CURSOS */}
          {currentStep === 3 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 3: Proposta Pedagógica & Estrutura de Aulas
                </h3>
                <p className="apply-creator-description-14">
                  Defina a metodologia de ensino e o primeiro curso prático que planeia lecionar.
                </p>
              </div>

              <div className="apply-creator-panel-31">
                <div>
                  <label className="apply-creator-field-label">
                    Metodologia & Motivação: Porque quer ensinar no NEXO? *
                  </label>
                  <textarea
                    name="motivation"
                    required
                    minLength={20}
                    rows={3}
                    value={formData.motivation}
                    onChange={handleChange}
                    placeholder="Explique como pretende estruturar os desafios práticos, o acompanhamento em salas ao vivo e a metodologia 'aprender fazendo'."
                    className="apply-creator-textarea"
                  />
                  <p className="apply-creator-description-17">
                    {formData.motivation.trim().length}/20 caracteres mínimos
                  </p>
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Proposta Detalhada do Primeiro Curso (Ementa & Módulos) *
                  </label>
                  <textarea
                    name="proposedCourses"
                    required
                    minLength={30}
                    rows={6}
                    value={formData.proposedCourses}
                    onChange={handleChange}
                    placeholder={`Exemplo estruturado:
1. Título: Domínio Avançado de Microsserviços e WebRTC
2. Nível: Intermédio a Avançado
3. Módulos propostos:
   - Módulo 1: Arquitetura de Comunicação em Tempo Real
   - Módulo 2: Implementação de Salas WebRTC P2P e SFU
   - Módulo 3: Projeto Prático de Fim de Curso e Certificação`}
                    className="apply-creator-textarea-2"
                  />
                  <span className="apply-creator-label-8">
                    Uma ementa clara com módulos bem definidos acelera a homologação direta pelo
                    Administrador.
                  </span>
                  <p className="apply-creator-description-17">
                    {formData.proposedCourses.trim().length}/30 caracteres mínimos
                  </p>
                </div>
              </div>

              <div className="apply-creator-panel-40">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={prevStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={nextStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Materiais & Revisão
                  <ArrowRight className="apply-creator-arrow-right" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: VÍDEO PILOTO, REVISÃO & SUBMISSÃO */}
          {currentStep === 4 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 4: Materiais Piloto, Compromisso & Submissão
                </h3>
                <p className="apply-creator-description-14">
                  Reveja os dados submetidos e confirme o termo de compromisso pedagógico.
                </p>
              </div>

              <div className="apply-creator-panel-41">
                <div>
                  <label className="apply-creator-field-label">
                    Vídeo Piloto ou Gravação Demonstrativa (Opcional)
                  </label>
                  <input
                    type="url"
                    name="sampleVideoUrl"
                    value={formData.sampleVideoUrl}
                    onChange={handleChange}
                    placeholder="URL de Loom, YouTube (não listado), Vimeo ou Google Drive"
                    className="apply-creator-field-2"
                  />
                  <span className="apply-creator-label-8">
                    Um vídeo de 3 minutos a demonstrar a sua dicção e capacidade explicativa confere
                    prioridade máxima na aprovação.
                  </span>
                </div>

                {/* Consolidated Review Box */}
                <div className="apply-creator-panel-42">
                  <div className="apply-creator-panel-43">Resumo do Inquérito a Enviar</div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Nome:</span>
                    <span className="apply-creator-label-5">{formData.fullName}</span>
                  </div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Área:</span>
                    <span className="apply-creator-label-6">{formData.expertise}</span>
                  </div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Experiência:</span>
                    <span className="apply-creator-label-5">{formData.experienceYears} Anos</span>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Perfil profissional:</span>
                    <p className="apply-creator-description-18">{formData.bio}</p>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Motivação e metodologia:</span>
                    <p className="apply-creator-description-18">{formData.motivation}</p>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Ementa e módulos propostos:</span>
                    <p className="apply-creator-description-19">{formData.proposedCourses}</p>
                  </div>
                  {formData.portfolioUrl && (
                    <div className="apply-creator-panel-45">
                      <span className="apply-creator-label-4">Portfólio: </span>
                      <span className="apply-creator-label-10">{formData.portfolioUrl}</span>
                    </div>
                  )}
                  {formData.sampleVideoUrl && (
                    <div className="apply-creator-panel-45">
                      <span className="apply-creator-label-4">Vídeo demonstrativo: </span>
                      <span className="apply-creator-label-10">{formData.sampleVideoUrl}</span>
                    </div>
                  )}
                </div>

                {/* Code of Ethics Agreement */}
                <label className="apply-creator-field-label-3">
                  <input
                    type="checkbox"
                    name="agreedTerms"
                    checked={formData.agreedTerms}
                    onChange={handleChange}
                    className="apply-creator-field-3"
                  />
                  <div className="apply-creator-panel-46">
                    <strong className="apply-creator-strong">
                      Compromisso de Excelência Pedagógica NEXO
                    </strong>
                    Comprometo-me a fornecer conteúdos técnicos rigorosos, respeitar a propriedade
                    intelectual, manter conduta ética e prestar suporte atempado aos alunos nos
                    canais da turma.
                  </div>
                </label>
              </div>

              <div className="apply-creator-panel-47">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={prevStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="apply-creator-button-14"
                >
                  {submitting ? 'A Submeter Inquérito...' : 'Submeter Inquérito Oficial'}
                  <Send className="apply-creator-arrow-right" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default ApplyCreatorPage;
