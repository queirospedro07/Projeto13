import React from 'react';
import { Download, FileText } from 'lucide-react';
import { formatBytes } from '../../../utils/formatters';

export const CourseDocumentsView = ({ documents = [] }) => {
  const docsToRender = Array.isArray(documents) && documents.length > 0
    ? documents
    : [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-1">
          Repositório de Documentos do Curso
        </h3>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Descarregue o código de apoio, diapositivos, ficheiros PDF e cheatsheets organizados pelo formador.
        </p>
      </div>

      {docsToRender.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 dark:text-white">Sem ficheiros adicionais</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            O formador ainda não disponibilizou documentos para download neste curso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docsToRender.map((doc, idx) => {
            const docUrl = doc.url || doc.data || '#';
            const docTitle = doc.title || doc.name || `Documento ${idx + 1}`;
            const docType = (doc.type || 'PDF').toUpperCase();
            const docSize = doc.size || (doc.sizeBytes ? formatBytes(doc.sizeBytes) : 'Ficheiro Direto');

            return (
              <div
                key={doc.id || doc.title || idx}
                className="p-5 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs flex items-center justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                    {docType.length > 4 ? docType.slice(0, 4) : docType}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {docTitle}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      {docSize}
                    </p>
                  </div>
                </div>
                <a
                  href={docUrl}
                  download={docTitle}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 ml-3"
                >
                  <button className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Descarregar</span>
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};