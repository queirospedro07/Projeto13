import React from 'react';
import { FileText } from 'lucide-react';

export const CourseDocumentsView = ({ documents = [] }) => {
  const docsToRender = Array.isArray(documents) && documents.length > 0
    ? documents
    : [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-1">
          Documentos e Recursos do Curso
        </h3>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Lista de ficheiros e materiais associados pelo formador.
        </p>
      </div>

      {docsToRender.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 dark:text-white">Sem ficheiros adicionais</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Não existem documentos associados a este curso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docsToRender.map((doc, idx) => {
            const docTitle = doc.title || doc.name || `Documento ${idx + 1}`;

            return (
              <div
                key={doc.id || doc.title || idx}
                className="p-4 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {docTitle}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};