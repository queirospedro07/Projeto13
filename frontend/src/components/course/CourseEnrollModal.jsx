import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  GraduationCap, 
  Award, 
  Clock, 
  Play, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { formatCoursePrice } from '../../utils/formatters';

export const CourseEnrollModal = ({
  isOpen,
  onClose,
  course,
  onEnrollSuccess,
  isSpace = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPaidConfirmation, setIsPaidConfirmation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsPaidConfirmation(false);
  }, [isOpen, course?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !course) return null;

  const isFree = course.isFree || Number(course.price || 0) <= 0;
  const courseTitle = course.title || course.name || 'Curso';
  const bannerImage = course.bannerUrl || course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80';
  const creator = course.creator || course.owner;
  const courseIdentifier = course.slug || course.id;

  const handleGoToDetails = () => {
    onClose();
    navigate(`/courses/${courseIdentifier}`);
  };

  const handleConfirmEnroll = async () => {
    if (!user) {
      toast({
        title: 'Sessão Necessária',
        message: 'Por favor inicie sessão ou crie conta para se inscrever.',
        type: 'info'
      });
      onClose();
      navigate('/login');
      return;
    }

    if (!isFree && !isPaidConfirmation) {
      toast({
        title: 'Confirmação necessária',
        message: 'Confirme a compra para prosseguir com a aquisição do curso.',
        type: 'info'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSpace) {
        await api.joinSpace(course.id);
      } else {
        await api.enrollCourse(course.id);
      }
      toast({
        title: 'Matrícula Confirmada!',
        message: `Inscrição concluída com sucesso em "${courseTitle}". Bons estudos!`,
        type: 'success'
      });
      onClose();
      if (onEnrollSuccess) {
        onEnrollSuccess();
      } else {
        navigate(`/learn/${courseIdentifier}`);
      }
    } catch (err) {
      toast({
        title: 'Erro na Inscrição',
        message: err.message || 'Não foi possível confirmar a matrícula. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
      {/* Fixed solid dark backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Centering container allowing natural full scroll without bottom cutoff */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div 
          className="relative w-full max-w-xl bg-white dark:bg-[#0d0f14] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in my-6 text-slate-900 dark:text-white text-left max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Course Banner Header */}
          <div className="relative h-48 sm:h-52 w-full bg-slate-900 overflow-hidden shrink-0">
            <img 
              src={bannerImage} 
              alt={courseTitle} 
              className="w-full h-full object-cover opacity-90"
              style={{ objectPosition: course.bannerPosition || course.thumbnailPosition || 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {course.category && (
                <span className="px-3 py-1 rounded-lg bg-black/70 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  {course.category}
                </span>
              )}
              <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider">
                {isFree ? '100% Gratuito' : 'Compra Segura'}
              </span>
            </div>

            {/* Banner bottom info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar src={creator?.avatarUrl} name={creator?.name || 'Instrutor'} size="sm" />
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {creator?.name || 'Instrutor Certificado'}
                </span>
              </div>
              {course.durationHours && (
                <span className="text-xs font-semibold text-white/90 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  {course.durationHours}h de conteúdo
                </span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
                  {courseTitle}
                </h2>
                <div className="rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-3 py-1.5 text-right">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400 font-bold">Preço</div>
                  <div className="text-lg font-black text-slate-950 dark:text-white">{formatCoursePrice(course)}</div>
                </div>
              </div>
              {course.description && (
                <p className="text-sm text-slate-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#13151b] border border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Aulas em Vídeo</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Acesso Vitalício</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Certificado Oficial</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Ao Concluir</p>
                </div>
              </div>
            </div>

            {!isFree && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 p-1.5 text-amber-700 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                      Confirmação final da compra
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-zinc-200">
                      Vai pagar <span className="font-bold">{formatCoursePrice(course)}</span> e receber acesso imediato ao curso.
                    </p>
                  </div>
                </div>

                <label className="mt-3 flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaidConfirmation}
                    onChange={(e) => setIsPaidConfirmation(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Confirmo que desejo adquirir este curso por <span className="font-bold">{formatCoursePrice(course)}</span>.
                  </span>
                </label>
              </div>
            )}

            {/* What you get list */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                O que está incluído na sua inscrição:
              </p>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Acesso imediato a todos os módulos e aulas práticas</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sessões de mentoria e esclarecimento de dúvidas</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Certificado digital verificado de conclusão do curso</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
              {/* View Course Full Page Button */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleGoToDetails}
                className="w-full sm:w-auto flex-1 font-semibold border-slate-300 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 justify-center cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2 text-slate-500 dark:text-neutral-400" />
                Ver Página do Curso
              </Button>

              {/* Confirm Enrollment / Enter Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!isFree && !isPaidConfirmation}
                onClick={handleConfirmEnroll}
                className="w-full sm:w-auto flex-1 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFree ? 'Confirmar Entrada Gratuita' : `Confirmar compra • ${formatCoursePrice(course)}`}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
export default CourseEnrollModal;
