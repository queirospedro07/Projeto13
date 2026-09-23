import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { soundEffects } from '../../../services/soundEffects';
export const LessonNotesTab = ({
  lessonId,
  initialNote = '',
  onSave
}) => {
  const [noteContent, setNoteContent] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    setNoteContent(initialNote);
  }, [initialNote, lessonId]);
  const handleSave = async () => {
    if (!lessonId) return;
    setIsSaving(true);
    try {
      await api.saveLessonNote(lessonId, noteContent);
      soundEffects.playSuccess();
      if (onSave) onSave(noteContent);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  return <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] shadow-sm flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            Notas Pessoais da Aula
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sincronizadas automaticamente com o seu perfil.
          </p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 transition-all">
          {isSaving ? 'A guardar...' : 'Guardar Notas'}
        </button>
      </div>
      <textarea rows={6} value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Escreva as suas anotações técnicas aqui..." className="w-full bg-slate-50 dark:bg-[#171a24] border border-slate-300 dark:border-[#222636] focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1c202d] rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 font-mono transition-all" />
    </div>;
};