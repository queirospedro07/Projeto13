import './LessonNotesTab.css';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';

export const AulaNotasSeparador = ({
  idAula: aulaId,
  initialNote: inicialNota = '',
  onSave: onGuardar,
}) => {
  const [notaConteudo, definirNotaConteudo] = useState(inicialNota);
  const [isSaving, definirIsSaving] = useState(false);
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState('');
  const [carregarErro, definirCarregarErro] = useState(false);
  const [guardado, definirGuardado] = useState(false);
  const [retry, definirRetry] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let ativo = true;

    definirNotaConteudo(inicialNota);
    definirCarregamento(true);
    definirErro('');
    definirCarregarErro(false);
    definirGuardado(false);
    if (!aulaId) {
      definirCarregamento(false);

      return;
    }

    api
      .get(`/notas/${encodeURIComponent(aulaId)}`)
      .then(({ data: dados }) => {
        if (ativo) definirNotaConteudo(dados.content || '');
      })
      .catch((erro2) => {
        if (ativo) {
          definirCarregarErro(true);
          definirErro(erro2.message || 'Não foi possível carregar as notas.');
        }
      })
      .finally(() => {
        if (ativo) definirCarregamento(false);
      });

    return () => {
      ativo = false;
    };
  }, [inicialNota, aulaId, retry]);

  const tratarGuardar = async () => {
    if (!aulaId || carregamento || submitting.current) return;
    submitting.current = true;
    definirErro('');
    definirGuardado(false);
    definirIsSaving(true);
    try {
      await api
        .post(`/notas/${aulaId}`, {
          content: notaConteudo,
        })
        .then(({ data: dados }) => dados);
      soundEffects.reproduzirSucesso();
      definirGuardado(true);
      if (onGuardar) onGuardar(notaConteudo);
    } catch (erro2) {
      definirErro(erro2.message || 'Não foi possível guardar as notas.');
    } finally {
      submitting.current = false;
      definirIsSaving(false);
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
          onClick={tratarGuardar}
          disabled={isSaving || carregamento || carregarErro}
          className="lesson-notes-tab-button"
        >
          {isSaving ? 'A guardar...' : 'Guardar Notas'}
        </button>
      </div>
      {carregamento && <p role="status">A carregar notas...</p>}
      {guardado && <p role="status">Notas guardadas.</p>}
      {erro && (
        <p role="alert">
          {erro}{' '}
          <button
            type="button"
            onClick={() => (carregarErro ? definirRetry((n) => n + 1) : tratarGuardar())}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <textarea
        aria-label="Notas pessoais da aula"
        maxLength={20000}
        disabled={carregamento || isSaving || carregarErro}
        rows={6}
        value={notaConteudo}
        onChange={(evento) => {
          definirNotaConteudo(evento.target.value);
          definirGuardado(false);
        }}
        placeholder="Escreva as suas anotações técnicas aqui..."
        className="lesson-notes-tab-textarea"
      />
    </div>
  );
};
