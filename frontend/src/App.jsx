import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FornecedorAutenticacao } from './contexts/AuthContext';
import { FornecedorTema } from './contexts/ThemeContext';
import { FornecedorSocket } from './contexts/SocketContext';
import { FornecedorAvisos } from './components/Alerts';
import { FornecedorChamadaAtiva } from './contexts/ActiveCallContext';
import { Estrutura } from './components/Layout';
import { ConsentimentoCookies } from './components/CookieConsent';
import { registarPaginaVista } from './utils/usageAnalytics';
import { RotaProtegida } from './components/ProtectedRoute';
import { RecebidaChamadaJanela } from './components/IncomingCallDialog';
import { ChamadaSalaJanela } from './components/CallRoomDialog';
import { useLocation } from 'react-router-dom';
import { RedirecionarRotaAnterior, ROTAS_ANTERIORES } from './components/PreviousRouteRedirect';
import { PaginaInicial } from './pages/HomePage';
import { EsqueletoPagina } from './components/Skeleton';

const PaginaIniciarSessao = React.lazy(() => import('./pages/LoginPage'));
const PaginaRegisto = React.lazy(() => import('./pages/RegisterPage'));
const PainelPagina = React.lazy(() => import('./pages/DashboardPage'));
const CursoDetalhesPagina = React.lazy(() => import('./pages/CourseDetailsPage'));
const CursoLeitorPagina = React.lazy(() => import('./pages/CoursePlayerPage'));
const DescobrirEspacosPagina = React.lazy(() => import('./pages/DiscoverSpacesPage'));
const EspacoConversaPagina = React.lazy(() => import('./pages/SpaceConversationPage'));
const BibliotecaPagina = React.lazy(() => import('./pages/LibraryPage'));
const FormadorPainelPagina = React.lazy(() => import('./pages/InstructorDashboardPage'));
const FormadorAvaliacoesPagina = React.lazy(() => import('./pages/InstructorReviewsPage'));
const CursoEditorPagina = React.lazy(() => import('./pages/CourseEditorPage'));
const FormadorMembrosPagina = React.lazy(() => import('./pages/InstructorMembersPage'));
const CandidatarFormadorPagina = React.lazy(() => import('./pages/InstructorApplicationPage'));
const AdministracaoPainelPagina = React.lazy(() => import('./pages/AdminDashboardPage'));
const CertificadoVistaPagina = React.lazy(() => import('./pages/CertificateViewPage'));
const DefinicoesPagina = React.lazy(() => import('./pages/SettingsPage'));
const MensagensPagina = React.lazy(() => import('./pages/MessagesPage'));
const PerfilPagina = React.lazy(() => import('./pages/ProfilePage'));
const PerguntasFrequentesPagina = React.lazy(() => import('./pages/FAQPage'));
const PaginaPoliticaPrivacidade = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermosPagina = React.lazy(() => import('./pages/TermsPage'));
const PesquisarResultadosPagina = React.lazy(() => import('./pages/SearchResultsPage'));
const PaginaNaoEncontrada = React.lazy(() => import('./pages/NotFoundPage'));
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
                    <EsqueletoPagina label="A carregar página" />
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
