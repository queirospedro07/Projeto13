import axios from 'axios';

const ambienteApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = ambienteApiUrl ? `${ambienteApiUrl.replace(/\/$/, '')}` : '/api';

// Instância HTTP partilhada pela aplicação.
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
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
      erro.response?.data?.message ||
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
