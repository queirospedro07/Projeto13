import { useContext, useState, useEffect, useRef } from 'react';
import {
  api,
  definirAutenticacaoToken,
  removerAutenticacaoToken,
  obterAutenticacaoToken,
} from '../services/api';
import { ContextoAutenticacao } from './contexts';

export const FornecedorAutenticacao = ({ children: conteudoFilho }) => {
  const [utilizador, definirUtilizador] = useState(null);
  const [token, definirToken] = useState(obterAutenticacaoToken());
  const [isCarregamento, definirIsCarregamento] = useState(true);
  const [sessaoErro, definirSessaoErro] = useState('');
  const sessaoRequest = useRef(0);
  const carregarAtualUtilizador = async () => {
    const requestId = ++sessaoRequest.current;

    definirIsCarregamento(true);
    definirSessaoErro('');
    try {
      const guardadoToken = obterAutenticacaoToken();
      if (guardadoToken) {
        const utilizadorDados = await api.get('/autenticacao/eu').then(({ data: dados }) => dados);
        if (requestId === sessaoRequest.current)
          definirUtilizador(utilizadorDados.user || utilizadorDados);
      } else {
        definirUtilizador(null);
      }
    } catch (erro) {
      if (requestId !== sessaoRequest.current) return;
      if (erro.status === 401) {
        removerAutenticacaoToken();
        definirToken(null);
        definirUtilizador(null);
      } else {
        definirSessaoErro(
          'Não foi possível verificar a sua sessão. Verifique a ligação e tente novamente.',
        );
      }
    } finally {
      if (requestId === sessaoRequest.current) definirIsCarregamento(false);
    }
  };

  useEffect(() => {
    carregarAtualUtilizador();
  }, []);

  const iniciarSessao = async (credenciais, remember = false) => {
    const resposta = await api
      .post('/autenticacao/entrar', credenciais)
      .then(({ data: dados }) => dados);

    sessaoRequest.current++;
    definirSessaoErro('');
    definirIsCarregamento(false);
    definirAutenticacaoToken(resposta.token, remember);
    definirToken(resposta.token);
    definirUtilizador(resposta.user);

    return resposta.user;
  };

  const registar = async (utilizadorDados) => {
    const resposta = await api
      .post('/autenticacao/registar', utilizadorDados)
      .then(({ data: dados }) => dados);

    sessaoRequest.current++;
    definirSessaoErro('');
    definirIsCarregamento(false);
    definirAutenticacaoToken(resposta.token);
    definirToken(resposta.token);
    definirUtilizador(resposta.user);

    return resposta.user;
  };

  const demonstracaoIniciarSessao = async (cargo) => {
    definirIsCarregamento(true);
    try {
      const resposta = await api
        .get(`/autenticacao/demo/${cargo}`)
        .then(({ data: dados }) => dados);

      definirAutenticacaoToken(resposta.token);
      definirToken(resposta.token);
      definirUtilizador(resposta.user);
    } finally {
      definirIsCarregamento(false);
    }
  };

  const terminarSessao = () => {
    sessaoRequest.current++;
    definirSessaoErro('');
    definirIsCarregamento(false);
    removerAutenticacaoToken();
    definirToken(null);
    definirUtilizador(null);
  };

  const atualizarUtilizador = async () => {
    if (token) {
      try {
        const utilizadorDados = await api.get('/autenticacao/eu').then(({ data: dados }) => dados);

        definirUtilizador(utilizadorDados?.user || utilizadorDados);
      } catch (erro) {
        console.error('Erro ao atualizar os dados do utilizador:', erro);
      }
    }
  };

  return (
    <ContextoAutenticacao.Provider
      value={{
        user: utilizador,
        token,
        isLoading: isCarregamento,
        sessionError: sessaoErro,
        retrySession: carregarAtualUtilizador,
        iniciarSessao: iniciarSessao,
        registar: registar,
        demonstracaoIniciarSessao,
        terminarSessao: terminarSessao,
        atualizarUtilizador,
      }}
    >
      {conteudoFilho}
    </ContextoAutenticacao.Provider>
  );
};

export const useAutenticacao = () => {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('useAutenticacao must be used within an FornecedorAutenticacao');

  return contexto;
};
