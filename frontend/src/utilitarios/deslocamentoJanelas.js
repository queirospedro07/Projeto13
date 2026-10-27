let abrirModals = 0;
let anteriorBodyOverflow = '';

// O bloqueio pertence ao conjunto de diálogos, não ao último que foi aberto.
export function bloquearJanelaDeslocar() {
  if (abrirModals === 0) anteriorBodyOverflow = document.body.style.overflow;
  abrirModals += 1;
  document.body.style.overflow = 'hidden';

  let released = false;

  return () => {
    if (released) return;
    released = true;
    abrirModals -= 1;
    if (abrirModals === 0) document.body.style.overflow = anteriorBodyOverflow;
  };
}
