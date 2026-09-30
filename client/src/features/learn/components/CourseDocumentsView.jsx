import React from 'react';
import { Download } from 'lucide-react';
import { formatBytes } from '../../../utils/formatters';
export const CourseDocumentsView = ({
  documents = [{
    title: 'Código-Fonte Completo do Projeto (GitHub / ZIP)',
    type: 'ZIP',
    size: '14.2 MB',
    url: '#'
  }, {
    title: 'Guia de Arquitetura & Padrões Concorrentes',
    type: 'PDF',
    size: '3.8 MB',
    url: '#'
  }, {
    title: 'Cheatsheet de Hooks do React 19',
    type: 'PDF',
    size: '1.2 MB',
    url: '#'
  }, {
    title: 'Esquema de Base de Dados SQLite & Migrações',
    type: 'SQL',
    size: '450 KB',
    url: '#'
  }]
}) => {
  return <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-950 mb-1">
          Repositório de Documentos do Curso
        </h3>
        <p className="text-sm text-slate-600">
          Descarregue o código de apoio, diapositivos e cheatsheets organizados pelo criador.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map((doc, idx) => <div key={doc.id || doc.title || idx} className="p-5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {doc.type}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {doc.size || (doc.sizeBytes ? formatBytes(doc.sizeBytes) : 'Ficheiro Direto')}
                </p>
              </div>
            </div>
            <a href={doc.url || '#'} download target="_blank" rel="noreferrer" className="shrink-0 ml-3">
              <button className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer">
                <Download className="w-4 h-4" />
                <span>Descarregar</span>
              </button>
            </a>
          </div>)}
      </div>
    </div>;
};