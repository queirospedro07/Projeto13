import './Janela.css';
import { bloquearJanelaDeslocar } from '../../utilitarios/deslocamentoJanelas';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuX as X } from 'react-icons/lu';

export const Janela = ({
  isOpen: isAbrir,
  onClose: onFechar,
  title: titulo,
  children: conteudoFilho,
  maxWidth = 'lg',
  bodyClassName: bodyTurmaNome = 'modal-modal-body-class-name custom-scrollbar',
}) => {
  const [mounted, definirMounted] = useState(false);
  const dialogRef = useRef(null);
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);
  useEffect(() => {
    definirMounted(true);
  }, []);
  useEffect(() => {
    if (!isAbrir || !mounted) return;
    const previouslyFocused = document.activeElement;
    const releaseDeslocar = bloquearJanelaDeslocar();
    const dialog = dialogRef.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length > 0);
    const tratarChaveDown = (evento) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (evento.key === 'Escape') {
        evento.preventDefault();
        fecharRef.current();
      }

      if (evento.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const ultima = elements.at(-1);
      if (!first) {
        evento.preventDefault();
        dialog.focus();

        return;
      }

      if (
        evento.shiftKey &&
        (document.activeElement === first || !dialog.contains(document.activeElement))
      ) {
        evento.preventDefault();
        ultima.focus();
      } else if (
        !evento.shiftKey &&
        (document.activeElement === ultima || !dialog.contains(document.activeElement))
      ) {
        evento.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', tratarChaveDown);
    (focusable()[0] || dialog)?.focus();

    return () => {
      releaseDeslocar();
      window.removeEventListener('keydown', tratarChaveDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isAbrir, mounted]);
  if (!isAbrir || !mounted) return null;
  const maxWidths = {
    sm: 'modal-max-widths-sm',
    md: 'modal-max-widths-md',
    lg: 'modal-max-widths-lg',
    xl: 'modal-max-widths-xl',
    '2xl': 'modal-max-widths-2xl',
    '4xl': 'modal-max-widths-4xl',
  };
  const janelaConteudo = (
    <div className="modal-panel dialog-layer">
      {/* Crisp Solid Dark Backdrop - Fixed to viewport */}
      <div
        className="modal-panel-2"
        onClick={onFechar}
        aria-hidden="true"
      />

      <div
        className={`modal-panel-3 ${maxWidths[maxWidth]} modal-panel-4`}
        onClick={(evento) => evento.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo || 'Janela de diálogo'}
      >
        {titulo && (
          <div className="modal-panel-5 modal-header-spacing">
            <h3 className="modal-subheading">{titulo}</h3>
            <button
              type="button"
              onClick={onFechar}
              className="modal-button"
              aria-label="Fechar diálogo"
              title="Fechar"
            >
              <X className="modal-x" />
            </button>
          </div>
        )}

        <div className={bodyTurmaNome}>{conteudoFilho}</div>
      </div>
    </div>
  );

  return createPortal(janelaConteudo, document.body);
};
