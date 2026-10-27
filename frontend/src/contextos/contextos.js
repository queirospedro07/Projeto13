import { createContext } from 'react';

// Definições estáveis, separadas dos componentes que são atualizados pelo Vite.
export const ContextoAutenticacao = createContext(undefined);

export const ContextoTema = createContext(undefined);

export const ContextoSocket = createContext(undefined);

export const ContextoChamadaAtiva = createContext(null);

export const ContextoAvisos = createContext(undefined);
