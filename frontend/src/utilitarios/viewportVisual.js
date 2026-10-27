import { useEffect } from 'react';

export function useViewportVisual() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const raiz = document.documentElement;
    const atualizar = () => {
      raiz.style.setProperty('--viewport-altura', (viewport?.height ?? window.innerHeight) + 'px');
      raiz.style.setProperty('--viewport-topo', (viewport?.offsetTop ?? 0) + 'px');
    };

    atualizar();
    window.addEventListener('resize', atualizar);
    viewport?.addEventListener('resize', atualizar);
    viewport?.addEventListener('scroll', atualizar);

    return () => {
      window.removeEventListener('resize', atualizar);
      viewport?.removeEventListener('resize', atualizar);
      viewport?.removeEventListener('scroll', atualizar);
      raiz.style.removeProperty('--viewport-altura');
      raiz.style.removeProperty('--viewport-topo');
    };
  }, []);
}
