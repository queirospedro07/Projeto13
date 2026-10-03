import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  Shield, 
  CheckCircle2, 
  Send, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../../services/api';

export const SubAdminApplicationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [weeklyAvailabilityHours, setWeeklyAvailabilityHours] = useState('10');
  const [areasOfInterest, setAreasOfInterest] = useState([]);
  const [situationScenario, setSituationScenario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const availableAreas = [
    'Moderação de Comunidade & Canais',
    'Revisão e Moderação de Cursos',
    'Salas de Mentoria e Chamadas WebRTC',
    'Suporte Técnico aos Formadores',
    'Resolução Ética de Conflitos'
  ];

  const toggleArea = (area) => {
    if (areasOfInterest.includes(area)) {
      setAreasOfInterest(areasOfInterest.filter((a) => a !== area));
    } else {
      setAreasOfInterest([...areasOfInterest, area]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || experience.trim().length < 40 || motivation.trim().length < 40 || situationScenario.trim().length < 60 || areasOfInterest.length === 0) {
      toast({
        title: 'Reveja a candidatura',
        message: 'Preencha experiência e motivação (40 caracteres), selecione uma área e responda ao cenário (60 caracteres).',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.applySubAdmin({
        fullName: fullName.trim(),
        email: email.trim(),
        motivation: motivation.trim(),
        experience: experience.trim(),
        weeklyAvailabilityHours: Number(weeklyAvailabilityHours) || 10,
        areasOfInterest,
        situationScenario: situationScenario.trim(),
        userId: user?.id || null
      });

      setIsSubmitted(true);
      toast({
        title: 'Candidatura Submetida!',
        message: 'O seu inquérito foi enviado com sucesso para a equipa de administração.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Falha no Envio',
        message: err.message || 'Erro ao submeter inquérito. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
      {/* Fixed solid dark backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity" 
        onClick={handleClose} 
        aria-hidden="true"
      />

      {/* Centering container allowing natural full scroll */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div 
          className="relative w-full max-w-2xl bg-white dark:bg-[#0d0f14] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in my-6 max-h-[88vh] flex flex-col text-slate-900 dark:text-white text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#12151d] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
                  Junte-se à Equipa
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Inquérito de integração para a equipa de Moderação e Apoio NEXO
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg animate-scale-in">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Inquérito Recebido com Sucesso!
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md leading-relaxed">
                  Obrigado pelo seu interesse em apoiar a integridade da nossa comunidade de aprendizagem. A administração irá analisar as suas respostas e entrará em contacto direto.
                </p>
                <div className="pt-4">
                  <Button variant="primary" onClick={handleClose}>
                    Fechar Janela
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                {/* Note Banner */}
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <span className="font-bold">Estatuto de Sub-Administrador:</span> Terá permissões para moderar comunidades, canais, salas de chamada e aprovar/rever cursos submetidos por formadores. Não terá permissão para alterar contas de Administradores Principais.
                  </div>
                </div>

                {/* Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                      Email de Contacto *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Experiência & Moderação */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Experiência Prévia em Moderação ou Ensino *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={40}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Descreva a sua experiência em moderação de comunidades, grupos de estudo, fóruns ou gestão de conteúdos..."
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{experience.trim().length}/40 caracteres mínimos</p>
                </div>

                {/* Motivação */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Por que pretende juntar-se à equipa do NEXO? *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={40}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Explique o que o motiva a dedicar tempo à gestão e segurança da plataforma..."
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{motivation.trim().length}/40 caracteres mínimos</p>
                </div>

                {/* Disponibilidade Semanal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Disponibilidade Estimada (Horas por Semana)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min="2"
                      max="40"
                      value={weeklyAvailabilityHours}
                      onChange={(e) => setWeeklyAvailabilityHours(e.target.value)}
                      className="w-24 bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-xs text-slate-500 dark:text-neutral-400">
                      horas semanais para monitorização e suporte
                    </span>
                  </div>
                </div>

                {/* Áreas de Interesse */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                    Áreas Principais de Atuação Desejada
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableAreas.map((area) => {
                      const selected = areasOfInterest.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          aria-pressed={selected}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            selected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resolução de Caso Prático */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Cenário Prático de Moderação *
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-2">
                    Se detetar um curso submetido com partes com direitos de autor não autorizados ou um utilizador recorrentemente conflituoso no chat ao vivo, que passos adotaria?
                  </p>
                  <textarea
                    rows={2}
                    required
                    minLength={60}
                    value={situationScenario}
                    onChange={(e) => setSituationScenario(e.target.value)}
                    placeholder="Explique resumidamente a sua postura e critério de ação..."
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{situationScenario.trim().length}/60 caracteres mínimos</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-neutral-800">
                  <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Submeter Inquérito
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SubAdminApplicationModal;
