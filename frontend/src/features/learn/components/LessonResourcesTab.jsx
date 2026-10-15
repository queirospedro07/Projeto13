import { safeDownloadUrl } from '../../../utils/safeUrl';
import './LessonResourcesTab.css';
import React from 'react';
import { FileText, Download } from 'lucide-react';

export const LessonResourcesTab = ({ resources = [] }) => {
  if (resources.length === 0) {
    return (
      <div className="lesson-resources-tab-panel">
        Não existem recursos adicionais associados a esta aula.
      </div>
    );
  }
  return (
    <div className="lesson-resources-tab-panel-2">
      {resources.map((res, idx) => {
        const docTitle = res.title || res.name || `Recurso ${idx + 1}`;
        const fileHref = safeDownloadUrl(res.url || res.data);
        return (
          <div key={res.id || docTitle || idx} className="lesson-resources-tab-panel-3">
            <div className="lesson-resources-tab-panel-4">
              <FileText className="lesson-resources-tab-file-text" />
              <span className="lesson-resources-tab-label">{docTitle}</span>
            </div>
            {fileHref && (
              <a
                href={fileHref}
                download={res.fileName || docTitle}
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
