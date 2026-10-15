import './LessonNotesTab.css';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { soundEffects } from '../../../services/soundEffects';
export const LessonNotesTab = ({ lessonId, initialNote = '', onSave }) => {
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
  return (
    <div className="lesson-notes-tab-panel">
      <div className="lesson-notes-tab-panel-2">
        <div>
          <h4 className="lesson-notes-tab-caption">Notas Pessoais da Aula</h4>
          <p className="lesson-notes-tab-description">
            Sincronizadas automaticamente com o seu perfil.
          </p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="lesson-notes-tab-button">
          {isSaving ? 'A guardar...' : 'Guardar Notas'}
        </button>
      </div>
      <textarea
        rows={6}
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Escreva as suas anotações técnicas aqui..."
        className="lesson-notes-tab-textarea"
      />
    </div>
  );
};
