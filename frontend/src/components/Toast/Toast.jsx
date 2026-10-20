import './Toast.css';
import { useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LuCircleCheck as CheckCircle2,
  LuCircleAlert as AlertCircle,
  LuInfo as Info,
  LuX as X,
  LuTriangleAlert as AlertTriangle,
} from 'react-icons/lu';

import { ToastContext } from '../../context/contexts';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback(({ title, message, type = 'success' }) => {
    const id = Math.random().toString(36).substring(2, 9);

    setToasts((prev) => [
      ...prev.slice(-4),
      {
        id,
        title,
        message,
        type,
      },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast,
      }}
    >
      {children}

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
              >
                <div className="toast-panel-3">
                  {t.type === 'success' && (
                    <div className="toast-panel-4">
                      <CheckCircle2 className="toast-check-circle2" />
                    </div>
                  )}
                  {t.type === 'error' && (
                    <div className="toast-panel-5">
                      <AlertCircle className="toast-check-circle2" />
                    </div>
                  )}
                  {t.type === 'warning' && (
                    <div className="toast-panel-6">
                      <AlertTriangle className="toast-check-circle2" />
                    </div>
                  )}
                  {t.type === 'info' && (
                    <div className="toast-panel-7">
                      <Info className="toast-check-circle2" />
                    </div>
                  )}
                </div>

                <div className="toast-panel-8">
                  <h4 className="toast-caption">{t.title}</h4>
                  {t.message && <p className="toast-description">{t.message}</p>}
                </div>

                <button
                  onClick={() => removeToast(t.id)}
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
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');

  return context;
};
