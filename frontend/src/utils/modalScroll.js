let openModals = 0;
let previousBodyOverflow = '';

// O bloqueio pertence ao conjunto de diálogos, não ao último que foi aberto.
export function lockModalScroll() {
  if (openModals === 0) previousBodyOverflow = document.body.style.overflow;
  openModals += 1;
  document.body.style.overflow = 'hidden';

  let released = false;

  return () => {
    if (released) return;
    released = true;
    openModals -= 1;
    if (openModals === 0) document.body.style.overflow = previousBodyOverflow;
  };
}
