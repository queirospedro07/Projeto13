import './Aplicacao.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FornecedorAutenticacao } from './contextos/ContextoAutenticacao';
import { FornecedorTema } from './contextos/ContextoTema';
import { FornecedorSocket } from './contextos/ContextoSocket';
import { FornecedorAvisos } from './componentes/Avisos';
import { FornecedorChamadaAtiva } from './contextos/ContextoChamadaAtiva';
import { Estrutura } from './componentes/Estrutura';
import { ConsentimentoCookies } from './componentes/ConsentimentoCookies';
import { registarPaginaVista } from './utilitarios/analiseUtilizacao';
import { RotaProtegida } from './componentes/RotaProtegida';
import { RecebidaChamadaJanela } from './componentes/RecebidaChamadaJanela';
import { ChamadaSalaJanela } from './componentes/ChamadaSalaJanela';
import { useLocation } from 'react-router-dom';
import { RedirecionarRotaAnterior, ROTAS_ANTERIORES } from './componentes/RedirecionarRotaAnterior';
import { PaginaInicial } from './paginas/PaginaInicial';

const PaginaIniciarSessao = React.lazy(() => import('./paginas/PaginaIniciarSessao'));
const PaginaRegisto = React.lazy(() => import('./paginas/PaginaRegisto'));
const PainelPagina = React.lazy(() => import('./paginas/PainelPagina'));
const CursoDetalhesPagina = React.lazy(() => import('./paginas/CursoDetalhesPagina'));
const CursoLeitorPagina = React.lazy(() => import('./paginas/CursoLeitorPagina'));
const DescobrirEspacosPagina = React.lazy(() => import('./paginas/DescobrirEspacosPagina'));
const EspacoConversaPagina = React.lazy(() => import('./paginas/EspacoConversaPagina'));
const BibliotecaPagina = React.lazy(() => import('./paginas/BibliotecaPagina'));
const FormadorPainelPagina = React.lazy(() => import('./paginas/FormadorPainelPagina'));
const FormadorAvaliacoesPagina = React.lazy(() => import('./paginas/FormadorAvaliacoesPagina'));
const CursoEditorPagina = React.lazy(() => import('./paginas/CursoEditorPagina'));
const FormadorMembrosPagina = React.lazy(() => import('./paginas/FormadorMembrosPagina'));
const CandidatarFormadorPagina = React.lazy(() => import('./paginas/CandidatarFormadorPagina'));
const AdministracaoPainelPagina = React.lazy(() => import('./paginas/AdministracaoPainelPagina'));
const CertificadoVistaPagina = React.lazy(() => import('./paginas/CertificadoVistaPagina'));
const DefinicoesPagina = React.lazy(() => import('./paginas/DefinicoesPagina'));
const MensagensPagina = React.lazy(() => import('./paginas/MensagensPagina'));
const PerfilPagina = React.lazy(() => import('./paginas/PerfilPagina'));
const PerguntasFrequentesPagina = React.lazy(() => import('./paginas/PerguntasFrequentesPagina'));
const PaginaPoliticaPrivacidade = React.lazy(() => import('./paginas/PaginaPoliticaPrivacidade'));
const TermosPagina = React.lazy(() => import('./paginas/TermosPagina'));
const PesquisarResultadosPagina = React.lazy(() => import('./paginas/PesquisarResultadosPagina'));
const PaginaNaoEncontrada = React.lazy(() => import('./paginas/PaginaNaoEncontrada'));
const PaginaVistaTracker = () => {
  const localizacao = useLocation();

  React.useEffect(() => {
    registarPaginaVista(localizacao.pathname + localizacao.search);
  }, [localizacao.pathname, localizacao.search]);

  return null;
};

export const Aplicacao = () => {
  const [ativoDiretaChamada, definirAtivoDiretaChamada] = React.useState(null);

  return (
    <FornecedorTema>
      <FornecedorAutenticacao>
        <FornecedorSocket>
          <FornecedorChamadaAtiva>
            <FornecedorAvisos>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <PaginaVistaTracker />
                <ConsentimentoCookies />
                <RecebidaChamadaJanela
                  onAcceptCall={(chamada) => definirAtivoDiretaChamada(chamada)}
                />
                {ativoDiretaChamada && (
                  <ChamadaSalaJanela
                    isOpen={!!ativoDiretaChamada}
                    roomName={`Chamada com ${ativoDiretaChamada.caller?.name || 'Utilizador'}`}
                    roomId={ativoDiretaChamada.roomId}
                    onClose={() => definirAtivoDiretaChamada(null)}
                  />
                )}
                <React.Suspense
                  fallback={
                    <div
                      className="app-panel"
                      role="status"
                    >
                      A carregar...
                    </div>
                  }
                >
                  <Routes>
                    <Route
                      path="/"
                      element={<Estrutura />}
                    >
                      <Route
                        index
                        element={<PaginaInicial />}
                      />
                      <Route
                        path="entrar"
                        element={<PaginaIniciarSessao />}
                      />
                      <Route
                        path="registar"
                        element={<PaginaRegisto />}
                      />
                      <Route
                        path="recuperar-palavra-passe"
                        element={<Navigate to="/entrar" replace />}
                      />
                      <Route
                        path="repor-palavra-passe"
                        element={<Navigate to="/entrar" replace />}
                      />
                      <Route
                        path="explorar"
                        element={<DescobrirEspacosPagina />}
                      />
                      <Route
                        path="cursos/:id"
                        element={<CursoDetalhesPagina />}
                      />
                      <Route
                        path="certificados/verificar/:id"
                        element={<CertificadoVistaPagina />}
                      />
                      <Route
                        path="ajuda"
                        element={<PerguntasFrequentesPagina />}
                      />
                      <Route
                        path="apoio"
                        element={<PerguntasFrequentesPagina />}
                      />
                      <Route
                        path="privacidade"
                        element={<PaginaPoliticaPrivacidade />}
                      />
                      <Route
                        path="termos"
                        element={<TermosPagina />}
                      />
                      <Route
                        path="pesquisar"
                        element={
                          <RotaProtegida>
                            <PesquisarResultadosPagina />
                          </RotaProtegida>
                        }
                      />

                      <Route
                        path="painel"
                        element={
                          <RotaProtegida>
                            <PainelPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="aprender/:idCurso"
                        element={
                          <RotaProtegida>
                            <CursoLeitorPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="biblioteca"
                        element={
                          <RotaProtegida>
                            <BibliotecaPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="mensagens"
                        element={
                          <RotaProtegida>
                            <MensagensPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="perfil"
                        element={
                          <RotaProtegida>
                            <PerfilPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="perfil/:username"
                        element={
                          <RotaProtegida>
                            <PerfilPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="comunidade/:id"
                        element={
                          <RotaProtegida>
                            <EspacoConversaPagina />
                          </RotaProtegida>
                        }
                      />

                      <Route
                        path="formador/candidatar"
                        element={
                          <RotaProtegida>
                            <CandidatarFormadorPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="formador"
                        element={
                          <RotaProtegida requiredRole="CREATOR">
                            <FormadorPainelPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="formador/painel"
                        element={
                          <Navigate
                            to="/formador"
                            replace
                          />
                        }
                      />
                      <Route
                        path="formador/cursos/novo"
                        element={
                          <RotaProtegida requiredRole="CREATOR">
                            <CursoEditorPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="formador/cursos/:idCurso/editar"
                        element={
                          <RotaProtegida requiredRole="CREATOR">
                            <CursoEditorPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="formador/membros"
                        element={
                          <RotaProtegida requiredRole="CREATOR">
                            <FormadorMembrosPagina />
                          </RotaProtegida>
                        }
                      />

                      <Route
                        path="definicoes"
                        element={
                          <RotaProtegida>
                            <DefinicoesPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="administracao"
                        element={
                          <RotaProtegida requiredRole="ADMIN">
                            <AdministracaoPainelPagina />
                          </RotaProtegida>
                        }
                      />

                      <Route
                        path="formador/avaliacoes"
                        element={
                          <RotaProtegida requiredRole="CREATOR">
                            <FormadorAvaliacoesPagina />
                          </RotaProtegida>
                        }
                      />
                      <Route
                        path="comunidade"
                        element={
                          <Navigate
                            to="/explorar"
                            replace
                          />
                        }
                      />
                      <Route
                        path="progresso"
                        element={
                          <Navigate
                            to="/biblioteca"
                            replace
                          />
                        }
                      />
                      <Route
                        path="conquistas"
                        element={
                          <Navigate
                            to="/perfil"
                            replace
                          />
                        }
                      />
                      <Route
                        path="classificacao"
                        element={
                          <Navigate
                            to="/explorar"
                            replace
                          />
                        }
                      />

                      {ROTAS_ANTERIORES.map(([anterior]) => (
                        <Route
                          key={anterior}
                          path={anterior}
                          element={<RedirecionarRotaAnterior />}
                        />
                      ))}
                      <Route
                        path="*"
                        element={<PaginaNaoEncontrada />}
                      />
                    </Route>
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
            </FornecedorAvisos>
          </FornecedorChamadaAtiva>
        </FornecedorSocket>
      </FornecedorAutenticacao>
    </FornecedorTema>
  );
};

export default Aplicacao;
