import React from 'react';
import { FileText, Download } from 'lucide-react';

export const LessonResourcesTab = ({
  resources = []
}) => {
  if (resources.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
        Não existem recursos adicionais associados a esta aula.
      </div>;
  }
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
      {resources.map((res, idx) => {
        const docTitle = res.title || res.name || `Recurso ${idx + 1}`;
        const fileHref = res.url || res.data;
        return (
          <div key={res.id || docTitle || idx} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {docTitle}
              </span>
            </div>
            {fileHref && (
              <a
                href={fileHref}
                download={res.fileName || docTitle}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Transferir</span>
              </a>
            )}
          </div>
        );
      })}
    </div>;
};