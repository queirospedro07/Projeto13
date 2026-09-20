import React from 'react';
import { Download } from 'lucide-react';
import { formatBytes } from '../../../utils/formatters';

export interface LessonResource {
  id: string;
  title: string;
  type: string;
  sizeBytes?: number;
  url: string;
}

interface LessonResourcesTabProps {
  resources: LessonResource[];
}

export const LessonResourcesTab: React.FC<LessonResourcesTabProps> = ({
  resources = []
}) => {
  if (resources.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        Não existem recursos adicionais para download nesta aula.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
      {resources.map((res) => (
        <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {res.type}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{res.title}</p>
              <p className="text-xs text-slate-500 font-mono">
                {res.sizeBytes ? formatBytes(res.sizeBytes) : 'Recurso Direto'}
              </p>
            </div>
          </div>
          <a href={res.url} target="_blank" rel="noreferrer" className="shrink-0 ml-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              <span>Descarregar</span>
            </button>
          </a>
        </div>
      ))}
    </div>
  );
};
