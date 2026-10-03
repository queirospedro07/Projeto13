import React from 'react';
import { FileText } from 'lucide-react';

export const LessonResourcesTab = ({
  resources = []
}) => {
  if (resources.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
        Não existem recursos adicionais associados a esta aula.
      </div>;
  }
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
      {resources.map(res => <div key={res.id} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] shadow-xs">
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {res.title}
          </span>
        </div>)}
    </div>;
};