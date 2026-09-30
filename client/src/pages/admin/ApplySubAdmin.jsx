import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Shield,
  Users,
  Send,
  HelpCircle,
  FileCheck2,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const ApplySubAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    motivation: '',
    experience: '',
    weeklyAvailabilityHours: 10,
    areasOfInterest: [
      'Moderação de Salas WebRTC & Voz',
      'Validação & Revisão de Novos Cursos'
    ],
    situationScenario: ''
  });

  const availableAreas = [
    'Moderação de Salas WebRTC & Voz',
    'Validação & Revisão de Novos Cursos',
    'Apoio ao Aluno & Resolução de Dúvidas',
    'Auditoria de Qualidade & Integridade da Plataforma',
    'Gestão e Dinamização de Espaços Comunitários'
  ];

  const fetchStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getSubAdminApplicationStatus();
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
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleArea = (area) => {
    setFormData((prev) => {
      const exists = prev.areasOfInterest.includes(area);
      if (exists) {
        return {
          ...prev,
          areasOfInterest: prev.areasOfInterest.filter((a) => a !== area)
        };
      } else {
        return {
          ...prev,
          areasOfInterest: [...prev.areasOfInterest, area]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.motivation || !formData.experience || !formData.situationScenario) {
      toast({
        title: 'Campos Obrigatórios',
        message: 'Por favor, preencha todos os campos do inquérito de candidatura.',
        type: 'error'
      });
      return;
    }

    if (formData.areasOfInterest.length === 0) {
      toast({
        title: 'Áreas de Interesse',
        message: 'Selecione pelo menos uma área de intervenção preferencial.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.applySubAdmin({
        ...formData,
        areasOfInterest: JSON.stringify(formData.areasOfInterest)
      });
      toast({
        title: 'Candidatura Submetida!',
        message: 'O seu inquérito foi enviado com sucesso para a equipa de administração.',
        type: 'success'
      });
      fetchStatus();
    } catch (err) {
      toast({
        title: 'Erro na Submissão',
        message: err.message || 'Não foi possível submeter a candidatura.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <div className="w-14 h-14 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Candidatura à Equipa de Moderação & Gestão
        </h2>
        <p className="text-slate-600 dark:text-neutral-400 max-w-md mx-auto text-sm leading-relaxed">
          Para submeter um inquérito e juntar-se à equipa de administração do NEXO, inicie sessão na sua conta de estudante.
        </p>
        <div className="pt-2">
          <Link
            to="/login?redirect=/admin/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm transition-all"
          >
            <span>Iniciar Sessão</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-sans">
        <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono uppercase tracking-wider text-slate-500">
          A carregar inquérito...
        </p>
      </div>
    );
  }

  // Já é Administrador
  if (user.role === 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Já é Administrador do NEXO
        </h2>
        <p className="text-slate-600 dark:text-neutral-400 max-w-md mx-auto text-sm leading-relaxed">
          A sua conta possui permissões completas de administração e moderação da plataforma.
        </p>
        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm transition-all"
          >
            <span>Abrir Painel de Administração</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Candidatura Pendente
  if (application && application.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 font-sans">
        <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d14] p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Candidatura em Análise pela Administração
          </h2>
          <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
            O seu inquérito para integrar a equipa de moderação e sub-administração foi submetido em{' '}
            <strong>{new Date(application.createdAt).toLocaleDateString('pt-PT')}</strong>. A equipa principal está a avaliar as respostas e receberá uma notificação assim que houver um parecer.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white font-bold text-xs transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 font-sans">
      
      {/* Header */}
      <div className="mb-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Shield className="w-3.5 h-3.5" />
          Recrutamento de Equipa
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Junte-se à Equipa de Moderação & Gestão
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Preencha o inquérito de candidatura para trabalhar diretamente com os administradores do NEXO, apoiar a comunidade, moderar salas WebRTC e validar novos cursos.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d14] p-6 sm:p-10 shadow-sm space-y-6">
        
        {/* Identificação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="O seu nome e apelido"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
              Email de Contacto *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemplo.pt"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        {/* Motivação */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
            Por que motivo deseja integrar a equipa de administração? *
          </label>
          <textarea
            name="motivation"
            value={formData.motivation}
            onChange={handleChange}
            rows={3}
            placeholder="Descreva o que o motiva a assumir responsabilidades de moderação e apoio no NEXO..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 leading-relaxed"
            required
          />
        </div>

        {/* Experiência Prévia */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
            Experiência Prévia em Moderação ou Liderança Técnica *
          </label>
          <textarea
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            rows={3}
            placeholder="Tem experiência prévia em gestão de comunidades (Discord, fóruns, equipas de desenvolvimento, moderação de eventos online)? Partilhe exemplos concretos..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 leading-relaxed"
            required
          />
        </div>

        {/* Disponibilidade Semanal */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
              Disponibilidade Estimada
            </label>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {formData.weeklyAvailabilityHours} horas / semana
            </span>
          </div>
          <input
            type="range"
            name="weeklyAvailabilityHours"
            min="4"
            max="30"
            step="1"
            value={formData.weeklyAvailabilityHours}
            onChange={handleChange}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Áreas de Interesse */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
            Áreas de Intervenção Preferenciais *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableAreas.map((area) => {
              const selected = formData.areasOfInterest.includes(area);
              return (
                <button
                  type="button"
                  key={area}
                  onClick={() => handleToggleArea(area)}
                  className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                  }`}
                >
                  <span>{area}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cenário Prático */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
            Cenário Prático: Resolução de Conflito *
          </label>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2">
            "Durante uma sessão de estudo WebRTC aberta com 20 alunos, um utilizador começa a interromper agressivamente a explicação técnica e a criar tensão no chat. Como procederia como sub-administrador?"
          </p>
          <textarea
            name="situationScenario"
            value={formData.situationScenario}
            onChange={handleChange}
            rows={4}
            placeholder="Descreva os passos e a atitude que tomaria para restabelecer a harmonia pedagógica na sala..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 leading-relaxed"
            required
          />
        </div>

        {/* Botão de Envio */}
        <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-slate-950 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {submitting ? (
              <span>A submeter...</span>
            ) : (
              <>
                <span>Submeter Inquérito</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ApplySubAdmin;
