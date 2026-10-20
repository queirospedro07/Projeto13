import { createContext } from 'react';

// Definições estáveis, separadas dos componentes que são atualizados pelo Vite.
export const AuthContext = createContext(undefined);

export const ThemeContext = createContext(undefined);

export const SocketContext = createContext(undefined);

export const ActiveCallContext = createContext(null);

export const ToastContext = createContext(undefined);
