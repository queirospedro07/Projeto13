import { PaymentSimulationModal } from '../PaymentSimulationModal';
import './CourseEnrollModal.css';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  LuX as X,
  LuCircleCheck as CheckCircle2,
  LuExternalLink as ExternalLink,
  LuGraduationCap as GraduationCap,
  LuAward as Award,
  LuClock as Clock,
  LuPlay as Play,
  LuArrowRight as ArrowRight,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';
export const CourseEnrollModal = ({
  isOpen,
  onClose,
  course,
  onEnrollSuccess,
  isSpace = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!isOpen || showPayment) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showPayment]);
  if (!isOpen || !mounted || !course) return null;
  const isFree = course.isFree || Number(course.price || 0) <= 0;
  const isAlreadyEnrolled = Boolean(course.isEnrolled || course.isMember);
  const courseTitle = course.title || course.name || 'Curso';
  const bannerImage =
    course.bannerUrl ||
    course.thumbnailUrl ||
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80';
  const creator = course.creator || course.owner;
  const courseIdentifier = course.slug || course.id;
  const handleGoToDetails = () => {
    onClose();
    navigate(`/courses/${courseIdentifier}`);
  };
  const handleConfirmEnroll = async () => {
    if (isAlreadyEnrolled) {
      onClose();
      navigate(`/learn/${courseIdentifier}`);
      return;
    }
    if (!user) {
      toast({
        title: 'Sessão Necessária',
        message: 'Por favor inicie sessão ou crie conta para se inscrever.',
        type: 'info',
      });
      onClose();
      navigate('/login');
      return;
    }
    if (!isFree) {
      setShowPayment(true);
      return;
    }
    setIsSubmitting(true);
    try {
      if (
        isSpace &&
        !String(course.id).startsWith('course-') &&
        !String(course.id).startsWith('demo-course-')
      ) {
        await api.post(`/spaces/${course.id}/join`).then(({ data }) => data);
      } else {
        await api.post(`/courses/${course.id}/enroll`).then(({ data }) => data);
      }
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      toast({
        title: 'Matrícula Confirmada!',
        message: `Já faz parte do curso "${courseTitle}". Bons estudos!`,
        type: 'success',
      });
      onClose();
      if (onEnrollSuccess) {
        onEnrollSuccess(course.id);
      } else {
        navigate(`/learn/${courseIdentifier}`);
      }
    } catch (err) {
      toast({
        title: 'Erro na Inscrição',
        message: err.message || 'Não foi possível confirmar a matrícula. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const modalContent = (
    <div className="course-enroll-modal-panel dialog-layer">
      {/* Fixed solid dark backdrop */}
      <div className="course-enroll-modal-panel-2" onClick={onClose} aria-hidden="true" />

      {/* Centering container allowing natural full scroll without bottom cutoff */}
      <div className="course-enroll-modal-panel-3">
        <div className="course-enroll-modal-panel-4" onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="course-enroll-modal-button"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="course-enroll-modal-x" />
          </button>

          {/* Course Banner Header */}
          <div className="course-enroll-modal-panel-5">
            <img
              src={bannerImage}
              alt={courseTitle}
              className="course-enroll-modal-image course-enroll-modal-dynamic-1"
              style={{
                '--course-enroll-modal-object-position':
                  course.bannerPosition || course.thumbnailPosition || 'center',
              }}
            />
            <div className="course-enroll-modal-panel-6" />

            {/* Top badges */}
            <div className="course-enroll-modal-panel-7">
              {course.category && (
                <span className="course-enroll-modal-label">
                  <GraduationCap className="course-enroll-modal-graduation-cap" />
                  {formatCategory(course.category)}
                </span>
              )}
              <span className="course-enroll-modal-label-2">
                {isAlreadyEnrolled
                  ? 'Já estou no curso'
                  : isFree
                    ? '100% Gratuito'
                    : 'Compra Segura'}
              </span>
            </div>

            {/* Banner bottom info */}
            <div className="course-enroll-modal-panel-8">
              <div className="course-enroll-modal-panel-9">
                <Avatar src={creator?.avatarUrl} name={creator?.name || 'Instrutor'} size="sm" />
                <span className="course-enroll-modal-label-3">
                  {creator?.name || 'Instrutor Certificado'}
                </span>
              </div>
              {course.durationHours && (
                <span className="course-enroll-modal-label-4">
                  <Clock className="course-enroll-modal-clock" />
                  {course.durationHours}h de conteúdo
                </span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="course-enroll-modal-panel-10 custom-scrollbar">
            <div>
              <div className="course-enroll-modal-panel-11">
                <h2 className="course-enroll-modal-heading">{courseTitle}</h2>
                <div className="course-enroll-modal-panel-12">
                  <div className="course-enroll-modal-panel-13">Preço</div>
                  <div className="course-enroll-modal-panel-14">{formatCoursePrice(course)}</div>
                </div>
              </div>
              {course.description && (
                <p className="course-enroll-modal-description">{course.description}</p>
              )}
            </div>

            {/* Value Highlights */}
            <div className="course-enroll-modal-panel-15">
              <div className="course-enroll-modal-panel-16">
                <div className="course-enroll-modal-panel-17">
                  <Play className="course-enroll-modal-x" />
                </div>
                <div>
                  <p className="course-enroll-modal-description-2">Aulas em Vídeo</p>
                  <p className="course-enroll-modal-description-3">Acesso Vitalício</p>
                </div>
              </div>

              <div className="course-enroll-modal-panel-16">
                <div className="course-enroll-modal-panel-18">
                  <Award className="course-enroll-modal-x" />
                </div>
                <div>
                  <p className="course-enroll-modal-description-2">Certificado Oficial</p>
                  <p className="course-enroll-modal-description-3">Ao Concluir</p>
                </div>
              </div>
            </div>

            {!isFree && !isAlreadyEnrolled && (
              <p className="course-enroll-modal-description-5">
                Simule um pagamento para experimentar a inscrição. Não existe cobrança real.
              </p>
            )}

            <div className="course-enroll-modal-panel-23">
              <p className="course-enroll-modal-description-6">
                O que está incluído na sua inscrição:
              </p>
              <div className="course-enroll-modal-panel-24">
                <CheckCircle2 className="course-enroll-modal-check-circle2" />
                <span>Acesso imediato a todos os módulos e aulas práticas</span>
              </div>
              <div className="course-enroll-modal-panel-24">
                <CheckCircle2 className="course-enroll-modal-check-circle2" />
                <span>Sessões de mentoria e esclarecimento de dúvidas</span>
              </div>
              <div className="course-enroll-modal-panel-24">
                <CheckCircle2 className="course-enroll-modal-check-circle2" />
                <span>Certificado digital verificado de conclusão do curso</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="course-enroll-modal-panel-25">
              {/* View Course Full Page Button */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleGoToDetails}
                className="course-enroll-modal-button-2"
              >
                <ExternalLink className="course-enroll-modal-external-link" />
                Ver Página do Curso
              </Button>

              {/* Confirm Enrollment / Enter Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleConfirmEnroll}
                className={`course-enroll-modal-button-3 ${isAlreadyEnrolled ? 'course-enroll-modal-button-4' : 'course-enroll-modal-button-5'}`}
              >
                {isAlreadyEnrolled
                  ? 'Já estou no curso • Ir para as Aulas'
                  : isFree
                    ? 'Confirmar Entrada Gratuita'
                    : 'Simular pagamento'}
                <ArrowRight className="course-enroll-modal-arrow-right" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (showPayment)
    return (
      <PaymentSimulationModal
        course={course}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          onClose();
          if (onEnrollSuccess) onEnrollSuccess(course.id);
          else navigate(`/learn/${courseIdentifier}`);
        }}
      />
    );
  return createPortal(modalContent, document.body);
};
export default CourseEnrollModal;
