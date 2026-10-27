import { useViewportVisual } from '../../utilitarios/viewportVisual';
import './Estrutura.css';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { BarraNavegacao } from '../BarraNavegacao';
import { BarraLateral } from '../BarraLateral';
import { NavegacaoInferiorMovel } from '../NavegacaoInferiorMovel';

export const Estrutura = () => {
  useViewportVisual();

  const { user: utilizador } = useAutenticacao();
  const localizacao = useLocation();
  const principalConteudoRef = React.useRef(null);

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [localizacao.pathname]);
  React.useEffect(() => {
    const principalConteudo = principalConteudoRef.current;
    if (
      !principalConteudo ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return undefined;
    const observedElements = new Set();
    const intersectionObserver = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('is-visible');
          intersectionObserver.unobserve(entrada.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -32px 0px',
      },
    );
    const observarSeccoes = () => {
      principalConteudo
        .querySelectorAll('section, article, [data-scroll-reveal]')
        .forEach((element) => {
          if (observedElements.has(element)) return;
          observedElements.add(element);
          element.classList.add('scroll-reveal');
          intersectionObserver.observe(element);
        });
    };

    observarSeccoes();

    const mutationObserver = new MutationObserver(observarSeccoes);

    mutationObserver.observe(principalConteudo, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [localizacao.pathname]);

  const isLanding = localizacao.pathname === '/';
  const isAutenticacaoPagina =
    localizacao.pathname === '/entrar' ||
    localizacao.pathname === '/registar' ||
    localizacao.pathname === '/recuperar-palavra-passe' ||
    localizacao.pathname === '/repor-palavra-passe';
  const isAprenderLeitor = localizacao.pathname.startsWith('/aprender/');
  const isCursoEditor = localizacao.pathname.startsWith('/formador/cursos/');
  const isMensagens = localizacao.pathname.startsWith('/mensagens');
  const mostrarAplicacaoBarraLateral = Boolean(utilizador) && !isLanding && !isAutenticacaoPagina;

  return (
    <div className={`app-layout-panel app-shell ${isLanding ? '' : 'interface-interna'}`}>
      <BarraNavegacao />

      <div className="app-layout-panel-2">
        {mostrarAplicacaoBarraLateral && <BarraLateral />}

        <main
          id="main-content"
          ref={principalConteudoRef}
          className={`app-layout-main ${isAprenderLeitor || isLanding || isAutenticacaoPagina || isCursoEditor ? 'app-layout-main-2' : isMensagens ? 'app-layout-main-3' : 'app-layout-main-4'}`}
        >
          <div
            key={localizacao.pathname}
            className={`route-enter ${mostrarAplicacaoBarraLateral ? 'app-layout-panel-3' : ''}`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {mostrarAplicacaoBarraLateral && <NavegacaoInferiorMovel />}
    </div>
  );
};
