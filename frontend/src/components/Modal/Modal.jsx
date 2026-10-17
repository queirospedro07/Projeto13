import './Modal.css';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuX as X } from 'react-icons/lu';
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  bodyClassName = 'modal-modal-body-class-name custom-scrollbar',
}) => {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length > 0);
    const handleKeyDown = (event) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable(),
        first = elements[0],
        last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    (focusable()[0] || dialog)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen, mounted]);
  if (!isOpen || !mounted) return null;
  const maxWidths = {
    sm: 'modal-max-widths-sm',
    md: 'modal-max-widths-md',
    lg: 'modal-max-widths-lg',
    xl: 'modal-max-widths-xl',
    '2xl': 'modal-max-widths-2xl',
    '4xl': 'modal-max-widths-4xl',
  };
  const modalContent = (
    <div className="modal-panel dialog-layer">
      {/* Crisp Solid Dark Backdrop - Fixed to viewport */}
      <div className="modal-panel-2" onClick={onClose} aria-hidden="true" />

      <div
        className={`modal-panel-3 ${maxWidths[maxWidth]} modal-panel-4`}
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Janela de diálogo'}
      >
        {title && (
          <div className="modal-panel-5 modal-header-spacing">
            <h3 className="modal-subheading">{title}</h3>
            <button
              onClick={onClose}
              className="modal-button"
              aria-label="Fechar diálogo"
              title="Fechar"
            >
              <X className="modal-x" />
            </button>
          </div>
        )}

        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
};
