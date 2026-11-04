import { seguroDescarregarUrl } from '../../utils/safeUrl';
import './LessonResourcesTab.css';
import { LuFileText as FileText, LuDownload as Download } from 'react-icons/lu';

export const AulaRecursosSeparador = ({ resources: recursos = [] }) => {
  if (recursos.length === 0) {
    return (
      <div className="lesson-resources-tab-panel">
        Não existem recursos adicionais associados a esta aula.
      </div>
    );
  }

  return (
    <div className="lesson-resources-tab-panel-2">
      {recursos.map((resposta, idx) => {
        const docTitulo = resposta.title || resposta.name || `Recurso ${idx + 1}`;
        const ficheiroHref = seguroDescarregarUrl(resposta.url || resposta.data);

        return (
          <div
            key={resposta.id || docTitulo || idx}
            className="lesson-resources-tab-panel-3"
          >
            <div className="lesson-resources-tab-panel-4">
              <FileText className="lesson-resources-tab-file-text" />
              <span className="lesson-resources-tab-label">{docTitulo}</span>
            </div>
            {ficheiroHref && (
              <a
                href={ficheiroHref}
                download={resposta.fileName || docTitulo}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-resources-tab-link"
              >
                <Download className="lesson-resources-tab-download" />
                <span>Transferir</span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};
