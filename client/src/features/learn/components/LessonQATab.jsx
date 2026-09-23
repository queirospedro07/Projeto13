import React from 'react';
import { Avatar } from '../../../components/ui/Avatar';
export const LessonQATab = ({
  questions,
  onOpenAskModal
}) => {
  return <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-base">
          Discussão & Dúvidas da Aula
        </h4>
        <button onClick={onOpenAskModal} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer transition-all">
          Fazer Pergunta
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {questions.length === 0 ? <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#12141c] rounded-2xl border border-slate-200 dark:border-[#222636]">
            Ainda não existem perguntas publicadas para esta aula. Seja o primeiro a colocar uma
            dúvida!
          </div> : questions.map(q => <div key={q.id} className="p-5 rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar src={q.author?.avatarUrl} name={q.author?.name || 'Aluno'} size="xs" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {q.author?.name || 'Aluno'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-[#171a24] px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-[#222636]">
                  ▲ {q.upvotes || 0}
                </span>
              </div>
              <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{q.title}</h5>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {q.content}
              </p>
            </div>)}
      </div>
    </div>;
};