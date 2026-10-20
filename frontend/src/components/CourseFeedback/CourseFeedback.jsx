import './CourseFeedback.css';
import { publicationLabels } from '../../constants/coursePublication';

export function CourseFeedback({ course }) {
  return (
    <section
      className="course-feedback"
      aria-label="Estado de publicação"
    >
      <strong>
        {publicationLabels[course.approvalStatus] || 'Rascunho'}
        {course.approvalStatus === 'APPROVED' && course.isPublished ? ' · Publicado' : ''}
      </strong>
      {course.approvalStatus === 'PENDING' && (
        <p>O curso foi enviado à administração. A decisão aparecerá aqui e nas notificações.</p>
      )}
      {course.adminNotes && (
        <div>
          <p>
            <b>Feedback da administração</b>
            {course.reviewedAt ? ` · ${new Date(course.reviewedAt).toLocaleString('pt-PT')}` : ''}
          </p>
          <p className="course-feedback__notes">{course.adminNotes}</p>
        </div>
      )}
      {course.approvalStatus === 'REJECTED' && (
        <p>Edite o curso, guarde as correções e volte a enviá-lo para revisão.</p>
      )}
      {course.approvalStatus === 'DRAFT' && (
        <p>O rascunho está guardado. Envie-o para revisão quando estiver pronto.</p>
      )}
    </section>
  );
}
