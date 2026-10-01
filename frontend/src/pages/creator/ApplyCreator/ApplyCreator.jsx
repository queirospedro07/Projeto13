import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Layers,
  Video,
  Send,
  HelpCircle,
  ExternalLink,
  Code2,
  Cpu,
  Shield,
  Cloud,
  Palette,
  Coins,
  Check,
  Award,
  FileText,
  UserCheck
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';

const EXPERTISE_OPTIONS = [
  { id: 'web', label: 'Engenharia Web & Full-Stack', desc: 'React, Node.js, TypeScript, Next.js, APIs', icon: Code2 },
  { id: 'ai', label: 'Inteligência Artificial & Dados', desc: 'LLMs, Python, Machine Learning, Análise de Dados', icon: Cpu },
  { id: 'security', label: 'Cibersegurança & Red Team', desc: 'Pentesting, Ethical Hacking, DevSecOps, Auditoria', icon: Shield },
  { id: 'cloud', label: 'Cloud Computing & DevOps', desc: 'AWS, Docker, Kubernetes, CI/CD, Terraform', icon: Cloud },
  { id: 'design', label: 'UI/UX Design & Produto', desc: 'Figma, Sistemas de Design, Prototipagem, Usabilidade', icon: Palette },
  { id: 'business', label: 'Finanças, Negócios & Web3', desc: 'Gestão Tecnológica, Blockchain, Smart Contracts', icon: Coins }
];

const EXPERIENCE_LEVELS = [
  { value: 2, label: '1 a 2 Anos', badge: 'Início de Carreira' },
  { value: 4, label: '3 a 5 Anos', badge: 'Recomendado' },
  { value: 8, label: '6 a 10 Anos', badge: 'Sénior / Especialista' },
  { value: 12, label: 'Mais de 10 Anos', badge: 'Veterano da Indústria' }
];

export const ApplyCreator = () => {
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
    agreedTerms: false
  });

  const fetchStatus = async () => {
    try {
      const res = await api.getCreatorApplicationStatus();
      if (res?.application) {
        setApplication(res.application);
        // Pre-fill form with prior data if rejected so user can rectify easily
        if (res.application.status === 'REJECTED') {
          setFormData(prev => ({
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
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
        toast({ title: 'Nome Obrigatório', message: 'Indique o seu nome completo com pelo menos 3 caracteres.', type: 'error' });
        return false;
      }
      if (!formData.bio.trim() || formData.bio.trim().length < 20) {
        toast({ title: 'Biografia Curta', message: 'Descreva resumidamente o seu percurso profissional (mínimo 20 caracteres).', type: 'error' });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.expertise.trim()) {
        toast({ title: 'Área Obrigatória', message: 'Selecione ou indique a sua área principal de especialização.', type: 'error' });
        return false;
      }
    }
    if (step === 3) {
      if (!formData.motivation.trim() || formData.motivation.trim().length < 20) {
        toast({ title: 'Motivação Obrigatória', message: 'Partilhe a sua motivação para lecionar no NEXO (mínimo 20 caracteres).', type: 'error' });
        return false;
      }
      if (!formData.proposedCourses.trim() || formData.proposedCourses.trim().length < 30) {
        toast({ title: 'Proposta Incompleta', message: 'Apresente os detalhes da proposta pedagógica (título do curso e tópicos previstos).', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    if (!formData.agreedTerms) {
      toast({
        title: 'Termo Pedagógico',
        message: 'Por favor, assinale o compromisso de rigor pedagógico e ética da plataforma NEXO.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.applyCreator(formData);
      toast({
        title: 'Inquérito Submetido!',
        message: res.message || 'O seu inquérito foi submetido com sucesso para análise do Conselho Pedagógico.',
        type: 'success',
      });
      setApplication(res.application);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">A carregar inquérito de candidatura...</span>
      </div>
    );
  }

  // Se já é Formador ou Administrador
  if (user?.role === 'CREATOR' || user?.role === 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 animate-fade-in">
        <Card className="p-8 sm:p-12 text-center flex flex-col items-center rounded-2xl border-slate-200 dark:border-neutral-800 bg-white dark:bg-black shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
            <UserCheck className="w-8 h-8" />
          </div>
          <Badge size="md" variant="primary" className="mb-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Estatuto Ativo
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            Já possui estatuto de {user?.role === 'ADMIN' ? 'Administrador' : 'Formador NEXO'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-lg mb-8 leading-relaxed">
            A sua conta tem permissões completas de publicação de módulos, criação de salas de mentoria WebRTC e emissão de certificados oficiais.
          </p>
          <Link to="/creator">
            <Button variant="primary" size="lg" className="font-bold bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black">
              Aceder ao Painel do Criador
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Se tem candidatura PENDENTE (Timeline Corporativa de Moderação)
  if (application && application.status === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-fade-in">
        <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-900">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Em Análise do Conselho Pedagógico
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
                Inquérito Submetido com Sucesso
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed mb-8">
            O seu inquérito foi registado na plataforma. O Conselho Pedagógico da NEXO analisa a proposta metodológica, os tópicos dos cursos e os materiais de apresentação antes de libertar o acesso ao estúdio de publicação.
          </p>

          {/* Corporate 3-Step Process Timeline */}
          <div className="relative border-l-2 border-slate-200 dark:border-neutral-800 ml-4 space-y-8 mb-8">
            {/* Step 1 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-black flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Submissão Concluída
              </h4>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                Inquérito e materiais enviados
              </p>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(application.createdAt || Date.now()).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white dark:ring-black animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                2. Moderação Pedagógica em Curso
              </h4>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                Avaliação de qualidade curricular e didática
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Tempo médio de homologação: 24 a 48 horas úteis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-neutral-800 ring-4 ring-white dark:ring-black" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                3. Ativação do Estúdio de Criador
              </h4>
              <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400 mt-0.5">
                Libertação do painel de cursos, salas WebRTC e remuneração
              </p>
            </div>
          </div>

          {/* Submission Recap Summary Box */}
          <div className="bg-slate-50 dark:bg-neutral-950 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800/80 space-y-3 text-xs mb-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-neutral-800">
              <span className="text-slate-500 dark:text-neutral-400">Candidato:</span>
              <span className="font-bold text-slate-900 dark:text-white">{application.fullName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-neutral-800">
              <span className="text-slate-500 dark:text-neutral-400">Área de Especialização:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{application.expertise}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-neutral-800">
              <span className="text-slate-500 dark:text-neutral-400">Experiência Indicada:</span>
              <span className="font-bold text-slate-900 dark:text-white">{application.experienceYears} Anos</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block mb-1">Cursos Previstos:</span>
              <p className="font-medium text-slate-800 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                {application.proposedCourses}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/dashboard">
              <Button variant="secondary" size="md" className="font-semibold">
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
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Programa Oficial de Formadores NEXO</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
          Inquérito de Candidatura a Criador
        </h1>
        <p className="text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
          Submeta o seu perfil e proposta de cursos para validação. Junte-se a uma rede de especialistas que ensinam tecnologia com rigor e prática em tempo real.
        </p>
      </div>

      {/* Rejection Notice with Rectification action */}
      {application?.status === 'REJECTED' && (
        <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-red-600 dark:text-red-400">
              Candidatura Anterior Necessita de Ajustes
            </h4>
            <p className="text-xs text-slate-700 dark:text-neutral-300 mt-1 leading-relaxed">
              <strong>Parecer da Administração:</strong> {application.adminFeedback || 'Ajuste a ementa dos cursos propostos e reenvie o inquérito para nova apreciação.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
              Os seus dados anteriores foram recuperados abaixo para facilitar a retificação.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Navigation Bar */}
      <div className="mb-10 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: 1, title: 'Identificação', desc: 'Dados Pessoais' },
            { step: 2, title: 'Especialidade', desc: 'Domínio Técnico' },
            { step: 3, title: 'Pedagogia', desc: 'Proposta de Cursos' },
            { step: 4, title: 'Revisão', desc: 'Materiais & Envio' }
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
                className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60'
                    : isCompleted
                    ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                </div>
                <div className="min-w-0 hidden xs:block">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                    {s.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Card */}
      <Card className="p-6 sm:p-10 border border-slate-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-black shadow-xl">
        <form onSubmit={handleSubmit}>
          
          {/* STEP 1: IDENTIFICAÇÃO & PERFIL */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  Passo 1: Identificação & Perfil Profissional
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Estes dados serão utilizados para compor a ficha técnica de formador na plataforma.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Nome Completo Profissional *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ex.: Engenheiro Pedro Silva"
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Biografia Executiva & Trajetória *
                  </label>
                  <textarea
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Resuma a sua formação académica, certificações, empresas onde trabalhou ou projetos de engenharia de destaque."
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                    <span>Mínimo recomendado: 20 caracteres</span>
                    <span>{formData.bio.length} caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Portfólio Oficial / LinkedIn / GitHub
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/seunome ou https://github.com/seunome"
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Facilita a validação do seu histórico de código e experiência pelo Conselho.
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-neutral-900 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={nextStep}
                  className="font-bold px-6 bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black"
                >
                  Seguinte: Especialidade Técnica
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ESPECIALIDADE & ANOS DE EXPERIÊNCIA */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  Passo 2: Domínio Técnico & Anos de Carreira
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Selecione o ecossistema principal em que pretende lecionar e estruturar cursos.
                </p>
              </div>

              {/* Visual Category Selection Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-3">
                  Área de Ensino *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXPERTISE_OPTIONS.map((opt) => {
                    const isSelected = formData.expertise === opt.label;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, expertise: opt.label }))}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-slate-950 dark:text-white shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-tight">{opt.label}</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-snug">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level Pill Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-3">
                  Tempo de Experiência Prática no Mercado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EXPERIENCE_LEVELS.map((lvl) => {
                    const isSelected = Number(formData.experienceYears) === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, experienceYears: lvl.value }))}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-neutral-900 border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold shadow-md ring-1 ring-blue-500'
                            : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-400 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-sm font-bold">{lvl.label}</div>
                        <span className="text-[10px] opacity-75 mt-0.5 block">{lvl.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-neutral-900 flex justify-between">
                <Button type="button" variant="secondary" size="md" onClick={prevStep} className="font-semibold">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button type="button" variant="primary" size="md" onClick={nextStep} className="font-bold px-6 bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black">
                  Seguinte: Proposta Curricular
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PROPOSTA PEDAGÓGICA & CURSOS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  Passo 3: Proposta Pedagógica & Estrutura de Aulas
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Defina a metodologia de ensino e o primeiro curso prático que planeia lecionar.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Metodologia & Motivação: Porque quer ensinar no NEXO? *
                  </label>
                  <textarea
                    name="motivation"
                    required
                    rows={3}
                    value={formData.motivation}
                    onChange={handleChange}
                    placeholder="Explique como pretende estruturar os desafios práticos, o acompanhamento em salas ao vivo e a metodologia 'aprender fazendo'."
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Proposta Detalhada do Primeiro Curso (Ementa & Módulos) *
                  </label>
                  <textarea
                    name="proposedCourses"
                    required
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
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl p-4 text-xs font-mono text-slate-900 dark:text-white focus:outline-none transition-all leading-relaxed"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Uma ementa clara com módulos bem definidos acelera a homologação direta pelo Administrador.
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-neutral-900 flex justify-between">
                <Button type="button" variant="secondary" size="md" onClick={prevStep} className="font-semibold">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button type="button" variant="primary" size="md" onClick={nextStep} className="font-bold px-6 bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black">
                  Seguinte: Materiais & Revisão
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: VÍDEO PILOTO, REVISÃO & SUBMISSÃO */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-neutral-900 pb-4">
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                  Passo 4: Materiais Piloto, Compromisso & Submissão
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Reveja os dados submetidos e confirme o termo de compromisso pedagógico.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Vídeo Piloto ou Gravação Demonstrativa (Opcional)
                  </label>
                  <input
                    type="url"
                    name="sampleVideoUrl"
                    value={formData.sampleVideoUrl}
                    onChange={handleChange}
                    placeholder="URL de Loom, YouTube (não listado), Vimeo ou Google Drive"
                    className="w-full bg-slate-50 dark:bg-neutral-900/60 border border-slate-300 dark:border-neutral-800 focus:border-blue-600 focus:bg-white dark:focus:bg-neutral-900 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none transition-all font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Um vídeo de 3 minutos a demonstrar a sua dicção e capacidade explicativa confere prioridade máxima na aprovação.
                  </span>
                </div>

                {/* Consolidated Review Box */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 space-y-3 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-1">
                    Resumo do Inquérito a Enviar
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 dark:border-neutral-800/80 pb-2">
                    <span className="text-slate-500 dark:text-neutral-400">Nome:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 dark:border-neutral-800/80 pb-2">
                    <span className="text-slate-500 dark:text-neutral-400">Área:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formData.expertise}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 dark:border-neutral-800/80 pb-2">
                    <span className="text-slate-500 dark:text-neutral-400">Experiência:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.experienceYears} Anos</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-neutral-400 block mb-1">Cursos Propostos:</span>
                    <p className="font-medium text-slate-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                      {formData.proposedCourses}
                    </p>
                  </div>
                </div>

                {/* Code of Ethics Agreement */}
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreedTerms"
                    checked={formData.agreedTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      Compromisso de Excelência Pedagógica NEXO
                    </strong>
                    Comprometo-me a fornecer conteúdos técnicos rigorosos, respeitar a propriedade intelectual, manter conduta ética e prestar suporte atempado aos alunos nos canais da turma.
                  </div>
                </label>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-neutral-900 flex justify-between items-center">
                <Button type="button" variant="secondary" size="md" onClick={prevStep} className="font-semibold">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="font-extrabold px-8 bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-black shadow-xl cursor-pointer"
                >
                  {submitting ? 'A Submeter Inquérito...' : 'Submeter Inquérito Oficial'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

        </form>
      </Card>
    </div>
  );
};

export default ApplyCreator;
