import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Bell, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  toast: (options: { title: string; message?: string; type?: 'success' | 'error' | 'info' | 'warning' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, message, type = 'success' }: { title: string; message?: string; type?: 'success' | 'error' | 'info' | 'warning' }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-4), { id, title, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container - Top Right Apple Glassmorphic Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3.5 p-4 bg-slate-950/90 dark:bg-black/95 backdrop-blur-xl border border-slate-700/60 dark:border-white/15 text-white rounded-2xl shadow-2xl shadow-black/60 animate-slide-in transition-all"
          >
            {/* Icon Badges */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'warning' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Title & Message Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                {t.title}
              </h4>
              {t.message && (
                <p className="text-xs text-slate-300 dark:text-zinc-300 mt-1 leading-relaxed break-words font-medium">
                  {t.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
