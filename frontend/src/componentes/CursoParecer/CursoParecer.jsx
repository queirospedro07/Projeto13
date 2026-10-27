import './CursoParecer.css';
import { publicationLabels } from '../../constantes/publicacaoCurso';

export function CursoParecer({ course: curso }) {
  return (
    <section
      className="course-feedback"
      aria-label="Estado de publicação"
    >
      <strong>
        {publicationLabels[curso.estadoAprovacao] || 'Rascunho'}
        {curso.estadoAprovacao === 'APPROVED' && curso.estaPublicado ? ' · Publicado' : ''}
      </strong>
      {curso.estadoAprovacao === 'PENDING' && (
        <p>O curso foi enviado à administração. A decisão aparecerá aqui e nas notificações.</p>
      )}
      {curso.notasAdministracao && (
        <div>
          <p>
            <b>Feedback da administração</b>
            {curso.revistoEm ? ` · ${new Date(curso.revistoEm).toLocaleString('pt-PT')}` : ''}
          </p>
          <p className="course-feedback__notes">{curso.notasAdministracao}</p>
        </div>
      )}
      {curso.estadoAprovacao === 'REJECTED' && (
        <p>Edite o curso, guarde as correções e volte a enviá-lo para revisão.</p>
      )}
      {curso.estadoAprovacao === 'DRAFT' && (
        <p>O rascunho está guardado. Envie-o para revisão quando estiver pronto.</p>
      )}
    </section>
  );
}
