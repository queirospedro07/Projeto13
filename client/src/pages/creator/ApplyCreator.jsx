import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Layers,
  Video,
  Send,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const ApplyCreator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    bio: user?.bio || '',
    expertise: '',
    experienceYears: 3,
    portfolioUrl: '',
    motivation: '',
    proposedCourses: '',
    sampleVideoUrl: '',
  });

  const fetchStatus = async () => {
    try {
      const res = await api.getCreatorApplicationStatus();
      if (res?.application) {
        setApplication(res.application);
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.expertise || !formData.motivation || !formData.proposedCourses) {
      toast({
        title: 'Campos Obrigatórios',
        message: 'Por favor, preencha o nome, especialização, motivação e proposta de cursos.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.applyCreator(formData);
      toast({
        title: 'Candidatura Submetida!',
        message: res.message || 'O seu inquérito foi enviado para análise do Administrador.',
        type: 'success',
      });
      setApplication(res.application);
    } catch (err) {
      toast({
        title: 'Falha ao Submeter',
        message: err.message || 'Não foi possível submeter a candidatura.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">A carregar estado da candidatura...</span>
      </div>
    );
  }

  // Se o utilizador já é formador ou admin
  if (user?.role === 'CREATOR' || user?.role === 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <Card className="p-8 text-center flex flex-col items-center rounded-xl">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Já possui estatuto de {user?.role === 'ADMIN' ? 'Administrador' : 'Formador / Criador'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
            A sua conta já tem permissões plenas para criar, estruturar e publicar cursos na plataforma NEXO.
          </p>
          <Link to="/creator">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Aceder ao Painel do Criador
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Se tem candidatura pendente
  if (application && application.status === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <Card className="p-8 text-center flex flex-col items-center rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <Badge size="md" variant="primary" className="mb-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-md">
            Candidatura em Análise
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Inquérito Submetido com Sucesso
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 max-w-lg mb-6 leading-relaxed">
            O seu inquérito de candidatura para se tornar Formador no NEXO foi recebido e encontra-se em fila de moderação pela Administração.
          </p>

          <div className="w-full text-left bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-slate-200 dark:border-neutral-800 space-y-2.5 text-xs mb-6">
            <div className="flex justify-between border-b border-slate-200/60 dark:border-neutral-800 pb-2">
              <span className="text-slate-500 dark:text-neutral-400">Área Proposta:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{application.expertise}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 dark:border-neutral-800 pb-2">
              <span className="text-slate-500 dark:text-neutral-400">Experiência:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{application.experienceYears} anos</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block mb-1">Cursos Previstos:</span>
              <p className="font-medium text-slate-800 dark:text-neutral-200">{application.proposedCourses}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Assim que a Administração validar a proposta, receberá uma notificação e o seu perfil será automaticamente promovido para Formador.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Programa de Formadores NEXO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          Candidatura a Criador de Cursos
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
          Preencha o inquérito pedagógico abaixo. Todas as candidaturas são avaliadas pessoalmente pela Administração para garantir o padrão de excelência da plataforma.
        </p>
      </div>

      {application?.status === 'REJECTED' && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-xs sm:text-sm text-red-900 dark:text-red-300">
              A sua candidatura anterior necessita de revisão
            </h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
              <strong>Motivo apontado pelo Administrador:</strong> {application.adminFeedback || 'Ajuste os detalhes dos cursos propostos e reenvie o formulário.'}
            </p>
          </div>
        </div>
      )}

      {/* Application Form */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Nome Completo *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ex.: Pedro Silva"
                className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Área Principal de Ensino *
              </label>
              <input
                type="text"
                name="expertise"
                required
                value={formData.expertise}
                onChange={handleChange}
                placeholder="Ex.: React, TypeScript, Cibersegurança, UI/UX"
                className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Anos de Experiência na Área *
              </label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                max="50"
                required
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                Portfólio / GitHub / LinkedIn
              </label>
              <input
                type="url"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleChange}
                placeholder="https://github.com/seunome"
                className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Biografia & Trajetória Profissional
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Descreva resumidamente a sua carreira, projetos de destaque e experiência prévia em formação."
              className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Motivação: Porque quer ensinar no NEXO? *
            </label>
            <textarea
              name="motivation"
              required
              rows={3}
              value={formData.motivation}
              onChange={handleChange}
              placeholder="Explique o que o motiva a juntar-se à rede de criadores do NEXO e a metodologia que pretende aplicar."
              className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Proposta do(s) Primeiro(s) Curso(s) *
            </label>
            <textarea
              name="proposedCourses"
              required
              rows={4}
              value={formData.proposedCourses}
              onChange={handleChange}
              placeholder="Exemplo:
1. Título do Curso: Arquitetura de Microsserviços com Node.js e Docker
2. Público-alvo: Desenvolvedores júnior e intermédios
3. Módulos previstos: Fundamentos, Comunicação assíncrona, Observabilidade e Deploy"
              className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Vídeo Demonstrativo ou Apresentação (Opcional)
            </label>
            <input
              type="url"
              name="sampleVideoUrl"
              value={formData.sampleVideoUrl}
              onChange={handleChange}
              placeholder="URL para YouTube, Vimeo, Loom ou Google Drive"
              className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
            />
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 block">
              Um vídeo curto de 2–5 minutos a explicar um conceito técnico acelera significativamente a aprovação.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Ao submeter, concorda em cumprir as diretrizes pedagógicas e éticas do NEXO.
            </span>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full sm:w-auto font-semibold px-6 cursor-pointer"
            >
              {submitting ? 'A Enviar Candidatura...' : 'Submeter Inquérito'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ApplyCreator;
