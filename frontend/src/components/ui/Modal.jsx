import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg'
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
      {/* Crisp Solid Dark Backdrop - Fixed to viewport */}
      <div 
        className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Centering container that enables natural full vertical scrolling without cut-offs */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div 
          className={`relative w-full ${maxWidths[maxWidth]} bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl text-left overflow-hidden z-10 animate-fade-in my-6 max-h-[88vh] flex flex-col text-slate-900 dark:text-white`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-[#12141a] shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar text-slate-900 dark:text-neutral-100 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};