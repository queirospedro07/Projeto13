import './Avisos.css';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LuCircleCheck as CheckCircle2,
  LuCircleAlert as AlertCircle,
  LuInfo as Info,
  LuX as X,
  LuTriangleAlert as AlertTriangle,
} from 'react-icons/lu';
import { ContextoAvisos } from '../../contextos/contextos';

export const FornecedorAvisos = ({ children: conteudoFilho }) => {
  const [toasts, definirToasts] = useState([]);
  const recentes = useRef(new Map());

  useEffect(() => {
    if (!toasts.length) return undefined;
    const proximo = Math.min(...toasts.map((item) => item.expiraEm));
    const timer = setTimeout(
      () => definirToasts((atual) => atual.filter((item) => item.expiraEm > Date.now())),
      Math.max(0, proximo - Date.now()),
    );

    return () => clearTimeout(timer);
  }, [toasts]);

  const aviso = useCallback(({ title: titulo, message: mensagem, type = 'success' }) => {
    const chave = JSON.stringify([type, titulo || '', mensagem || '']);
    const agora = Date.now();
    if (agora - (recentes.current.get(chave) ?? -Infinity) < 4500) return;
    recentes.current.set(chave, agora);
    for (const [anterior, instante] of recentes.current)
      if (agora - instante > 10000) recentes.current.delete(anterior);
    const id = Math.random().toString(36).substring(2, 9);

    definirToasts((anterior) => [
      ...anterior.slice(-2),
      {
        id,
        title: titulo,
        message: mensagem,
        type,
        expiraEm: agora + 4500,
      },
    ]);
  }, []);
  const removerAviso = (id) => {
    definirToasts((anterior) => anterior.filter((t) => t.id !== id));
  };

  return (
    <ContextoAvisos.Provider
      value={{
        toast: aviso,
      }}
    >
      {conteudoFilho}

      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="toast-panel"
            role="status"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className="toast-panel-2 toast-enter"
                data-type={t.type}
              >
                <span
                  className="toast-icon"
                  aria-hidden="true"
                >
                  {t.type === 'success' && <CheckCircle2 />}
                  {t.type === 'error' && <AlertCircle />}
                  {t.type === 'warning' && <AlertTriangle />}
                  {t.type === 'info' && <Info />}
                </span>

                <div className="toast-panel-8">
                  {t.title && <h4 className="toast-caption">{t.title}</h4>}
                  {t.message && <p className="toast-description">{t.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => removerAviso(t.id)}
                  className="toast-button"
                  title="Fechar notificação"
                  aria-label="Fechar notificação"
                >
                  <X className="toast-check-circle2" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ContextoAvisos.Provider>
  );
};

export const useAvisos = () => {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) throw new Error('useAvisos must be used within FornecedorAvisos');

  return contexto;
};
