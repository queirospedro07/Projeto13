import { useContext, useState, useEffect, useCallback } from 'react';
import { ContextoTema } from './contexts';

export const FornecedorTema = ({ children: conteudoFilho }) => {
  const [tema, definirTemaEstado] = useState(() => {
    return (
      localStorage.getItem('nexo_theme') || localStorage.getItem('learnspace_theme') || 'light'
    );
  });
  const [actualTema, definirActualTema] = useState('light');
  const candidatarTema = useCallback((atualTema) => {
    const root = document.documentElement;
    let resolved;
    if (atualTema === 'system') {
      const prefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = atualTema;
    }

    definirActualTema(resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, []);
  const definirTema = useCallback(
    (novoTema) => {
      definirTemaEstado(novoTema);
      localStorage.setItem('nexo_theme', novoTema);
      candidatarTema(novoTema);
    },
    [candidatarTema],
  );
  const alternarTema = useCallback(() => {
    if (tema === 'light') definirTema('dark');
    else if (tema === 'dark') definirTema('system');
    else definirTema('light');
  }, [tema, definirTema]);

  useEffect(() => {
    candidatarTema(tema);
    if (window.matchMedia) {
      const multimidiaConsultar = window.matchMedia('(prefers-color-scheme: dark)');
      const tratarMultimidiaAlterar = () => {
        const guardadoTema =
          localStorage.getItem('nexo_theme') || localStorage.getItem('learnspace_theme') || 'light';
        if (guardadoTema === 'system') {
          candidatarTema('system');
        }
      };

      try {
        multimidiaConsultar.addEventListener('change', tratarMultimidiaAlterar);

        return () => multimidiaConsultar.removeEventListener('change', tratarMultimidiaAlterar);
      } catch {
        multimidiaConsultar.addListener(tratarMultimidiaAlterar);

        return () => multimidiaConsultar.removeListener(tratarMultimidiaAlterar);
      }
    }
  }, [tema, candidatarTema]);

  return (
    <ContextoTema.Provider
      value={{
        theme: tema,
        setTheme: definirTema,
        actualTheme: actualTema,
        toggleTheme: alternarTema,
      }}
    >
      {conteudoFilho}
    </ContextoTema.Provider>
  );
};

export const useTema = () => {
  const contexto = useContext(ContextoTema);
  if (!contexto) throw new Error('useTema must be used within FornecedorTema');

  return contexto;
};
