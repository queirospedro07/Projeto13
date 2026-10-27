import axios from 'axios';

function resolverApiBase(url) {
  if (!url) return '/api';
  const limpo = url.trim().replace(/\/+$/, '');
  return limpo.endsWith('/api') ? limpo : `${limpo}/api`;
}

const ambienteApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = resolverApiBase(ambienteApiUrl);

// Instância HTTP partilhada pela aplicação.
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});
const TOKEN_KEYS = ['nexo_token', 'token', 'learnspace_token'];

export function obterAutenticacaoToken() {
  for (const armazenamento of [sessionStorage, localStorage])
    for (const chave of TOKEN_KEYS) {
      const token = armazenamento.getItem(chave);
      if (token) return token;
    }

  return null;
}

export function definirAutenticacaoToken(token, remember = false) {
  removerAutenticacaoToken();
  (remember ? localStorage : sessionStorage).setItem('nexo_token', token);
}

export function removerAutenticacaoToken() {
  for (const armazenamento of [sessionStorage, localStorage])
    for (const chave of TOKEN_KEYS) armazenamento.removeItem(chave);
}

// Acrescenta o token Bearer aos pedidos autenticados.
api.interceptors.request.use(
  (config) => {
    const token = obterAutenticacaoToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (erro) => Promise.reject(erro),
);

// Trata a expiração da sessão nas respostas HTTP 401.
api.interceptors.response.use(
  (response) => response,
  (erro) => {
    if (erro.response?.status === 401) {
      const url = erro.config?.url || '';
      const isAutenticacaoEndpoint =
        url.includes('/autenticacao/entrar') || url.includes('/autenticacao/registar');
      if (!isAutenticacaoEndpoint) {
        removerAutenticacaoToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/entrar')) {
          window.location.href = '/entrar';
        }
      }
    }

    const mensagem =
      erro.code === 'ECONNABORTED'
        ? 'O servidor está a iniciar (acordar do plano gratuito). Por favor tente novamente dentro de instantes.'
        : erro.response?.data?.message ||
          erro.response?.data?.error ||
          erro.message ||
          'Erro no pedido';
    const requestErro = new Error(mensagem);

    requestErro.status = erro.response?.status;
    requestErro.code = erro.code;

    return Promise.reject(requestErro);
  },
);

export default api;
