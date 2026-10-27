import './RotaProtegida.css';
import { podeEnsinar } from '../../utilitarios/permissoes';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { Botao } from '../Botao';

export const RotaProtegida = ({ children: conteudoFilho, requiredRole: obrigatorioCargo }) => {
  const {
    user: utilizador,
    isLoading: isCarregamento,
    sessionError: sessaoErro,
    retrySession: retrySessao,
  } = useAutenticacao();
  const localizacao = useLocation();
  if (isCarregamento) {
    return (
      <div className="protected-route-panel">
        <div className="protected-route-panel-2"></div>
        <p className="protected-route-description">A verificar credenciais de segurança...</p>
      </div>
    );
  }

  if (sessaoErro) {
    return (
      <div
        className="protected-route-panel"
        role="alert"
      >
        <p>{sessaoErro}</p>
        <Botao onClick={retrySessao}>Tentar novamente</Botao>
      </div>
    );
  }

  if (!utilizador) {
    return (
      <Navigate
        to="/entrar"
        state={{
          from: localizacao,
        }}
        replace
      />
    );
  }

  if (obrigatorioCargo) {
    const isAuthorized =
      obrigatorioCargo === 'CREATOR'
        ? podeEnsinar(utilizador)
        : utilizador.role === obrigatorioCargo || utilizador.role === 'ADMIN';
    if (!isAuthorized) {
      if (obrigatorioCargo === 'CREATOR') {
        if (utilizador.role === 'ADMIN')
          return (
            <Navigate
              to="/administracao"
              replace
            />
          );

        return (
          <Navigate
            to="/formador/candidatar"
            replace
          />
        );
      }

      return (
        <Navigate
          to="/painel"
          replace
        />
      );
    }
  }

  return conteudoFilho;
};
