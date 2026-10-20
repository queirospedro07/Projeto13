import './LessonNotesTab.css';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';

export const LessonNotesTab = ({ lessonId, initialNote = '', onSave }) => {
  const [noteContent, setNoteContent] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;

    setNoteContent(initialNote);
    setLoading(true);
    setError('');
    setLoadError(false);
    setSaved(false);
    if (!lessonId) {
      setLoading(false);

      return;
    }

    api
      .get(`/notes/${encodeURIComponent(lessonId)}`)
      .then(({ data }) => {
        if (active) setNoteContent(data.content || '');
      })
      .catch((err) => {
        if (active) {
          setLoadError(true);
          setError(err.message || 'Não foi possível carregar as notas.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialNote, lessonId, retry]);

  const handleSave = async () => {
    if (!lessonId || loading || submitting.current) return;
    submitting.current = true;
    setError('');
    setSaved(false);
    setIsSaving(true);
    try {
      await api
        .post(`/notes/${lessonId}`, {
          content: noteContent,
        })
        .then(({ data }) => data);
      soundEffects.playSuccess();
      setSaved(true);
      if (onSave) onSave(noteContent);
    } catch (err) {
      setError(err.message || 'Não foi possível guardar as notas.');
    } finally {
      submitting.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="lesson-notes-tab-panel">
      <div className="lesson-notes-tab-panel-2">
        <div>
          <h4 className="lesson-notes-tab-caption">Notas Pessoais da Aula</h4>
          <p className="lesson-notes-tab-description">
            Guardadas na sua conta ao selecionar «Guardar Notas».
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || loading || loadError}
          className="lesson-notes-tab-button"
        >
          {isSaving ? 'A guardar...' : 'Guardar Notas'}
        </button>
      </div>
      {loading && <p role="status">A carregar notas...</p>}
      {saved && <p role="status">Notas guardadas.</p>}
      {error && (
        <p role="alert">
          {error}{' '}
          <button
            type="button"
            onClick={() => (loadError ? setRetry((n) => n + 1) : handleSave())}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <textarea
        aria-label="Notas pessoais da aula"
        maxLength={20000}
        disabled={loading || isSaving || loadError}
        rows={6}
        value={noteContent}
        onChange={(e) => {
          setNoteContent(e.target.value);
          setSaved(false);
        }}
        placeholder="Escreva as suas anotações técnicas aqui..."
        className="lesson-notes-tab-textarea"
      />
    </div>
  );
};
