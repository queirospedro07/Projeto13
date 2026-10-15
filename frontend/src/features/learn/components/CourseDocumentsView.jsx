import { safeDownloadUrl } from '../../../utils/safeUrl';
import './CourseDocumentsView.css';
import React from 'react';
import { FileText, Download } from 'lucide-react';

export const CourseDocumentsView = ({ documents = [] }) => {
  const docsToRender = Array.isArray(documents) && documents.length > 0 ? documents : [];

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
            const docTitle = doc.title || doc.name || `Documento ${idx + 1}`;
            const fileHref = safeDownloadUrl(doc.url || doc.data);

            return (
              <div key={doc.id || doc.title || idx} className="course-documents-view-panel-4">
                <div className="course-documents-view-panel-5">
                  <FileText className="course-documents-view-file-text-2" />
                  <span className="course-documents-view-label">{docTitle}</span>
                </div>
                {fileHref && (
                  <a
                    href={fileHref}
                    download={doc.fileName || docTitle}
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
