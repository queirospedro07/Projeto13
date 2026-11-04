import { seguroDescarregarUrl } from '../../utils/safeUrl';
import './CourseDocumentsView.css';
import { LuFileText as FileText, LuDownload as Download } from 'react-icons/lu';

export const CursoDocumentosVista = ({ documents: documentos = [] }) => {
  const docsToRender = Array.isArray(documentos) && documentos.length > 0 ? documentos : [];

  return (
    <div className="course-documents-view-panel custom-scrollbar">
      <div>
        <h3 className="course-documents-view-subheading">Documentos e Recursos do Curso</h3>
        <p className="course-documents-view-description">
          Lista de ficheiros e materiais associados pelo formador.
        </p>
      </div>

      {docsToRender.length === 0 ? (
        <div className="course-documents-view-panel-2">
          <FileText className="course-documents-view-file-text" />
          <h4 className="course-documents-view-caption">Sem ficheiros adicionais</h4>
          <p className="course-documents-view-description-2">
            Não existem documentos associados a este curso.
          </p>
        </div>
      ) : (
        <div className="course-documents-view-panel-3">
          {docsToRender.map((doc, idx) => {
            const docTitulo = doc.title || doc.name || `Documento ${idx + 1}`;
            const ficheiroHref = seguroDescarregarUrl(doc.url || doc.data);

            return (
              <div
                key={doc.id || doc.title || idx}
                className="course-documents-view-panel-4"
              >
                <div className="course-documents-view-panel-5">
                  <FileText className="course-documents-view-file-text-2" />
                  <span className="course-documents-view-label">{docTitulo}</span>
                </div>
                {ficheiroHref && (
                  <a
                    href={ficheiroHref}
                    download={doc.fileName || docTitulo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="course-documents-view-link"
                  >
                    <Download className="course-documents-view-download" />
                    <span>Transferir</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
