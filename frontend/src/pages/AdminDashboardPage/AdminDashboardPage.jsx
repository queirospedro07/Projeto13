import '../../styles/editor-management.css';
import UtilizadorCargoEditor from '../../components/UserRoleEditor/UserRoleEditor';
import { PaginaEstado } from '../../components/StatusPage';
import RevisaoCurso from '../../components/CourseReviewPanel/CourseReviewPanel';
import CursoEstadoGrafico from '../../components/CourseProgressChart';
import { seguroExternoUrl } from '../../utils/safeUrl';
import './AdminDashboardPage.css';
import '../../styles/management.css';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Janela } from '../../components/Dialog';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuSearch as Search,
  LuEye as Eye,
  LuExternalLink as ExternalLink,
  LuRefreshCw as RefreshCw,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Botao } from '../../components/Button';
import { Distintivo } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { useAvisos } from '../../components/Alerts';
import { api } from '../../services/api';
import { formatarCursoPreco, formatarCategoria } from '../../utils/formatting';

export const AdministracaoPainelPagina = () => {
  const [estatisticas, definirEstatisticas] = useState(null);
  const [utilizadores, definirUtilizadores] = useState([]);
  const [candidaturas, definirCandidaturas] = useState([]);
  const [cursos, definirCursos] = useState([]);

  // Navegação
  const [pesquisarParametros] = useSearchParams();
  const [ativoSeparador, definirAtivoSeparador] = useState(() =>
    ['overview', 'courses', 'applications', 'users'].includes(pesquisarParametros.get('tab'))
      ? pesquisarParametros.get('tab')
      : 'overview',
  );
  const [carregamento, definirCarregamento] = useState(true);
  const [carregarErro, definirCarregarErro] = useState(false);
  const [refreshing, definirRefreshing] = useState(false);

  // Filtros - Candidaturas
  const [aplicacaoFiltrar, definirAplicacaoFiltrar] = useState('PENDING');
  const [aplicacaoPesquisar, definirAplicacaoPesquisar] = useState('');

  // Filtros - Cursos
  const [cursoFiltrar, definirCursoFiltrar] = useState('PENDING');
  const [cursoPesquisar, definirCursoPesquisar] = useState('');

  // Filtros - Utilizadores
  const [utilizadorPesquisar, definirUtilizadorPesquisar] = useState('');
  const [utilizadorCargoFiltrar, definirUtilizadorCargoFiltrar] = useState('ALL');
  const [utilizadorEstadoFiltrar, definirUtilizadorEstadoFiltrar] = useState('ALL');

  // Modais
  const [selecionadoCursoDetail, definirSelecionadoCursoDetail] = useState(null);
  const [cursoDetailCarregamento, definirCursoDetailCarregamento] = useState(false);
  const [cursoReverErro, definirCursoReverErro] = useState(false);
  const cursoReverRequest = useRef(0);
  const [selecionadoAplicacao, definirSelecionadoAplicacao] = useState(null);
  const [selecionadoCurso, definirSelecionadoCurso] = useState(null);
  const [rejeitarParecer, definirRejeitarParecer] = useState('');
  const [mostrarRejeitarJanela, definirMostrarRejeitarJanela] = useState(false);
  const [rejeitarType, definirRejeitarType] = useState(null); // 'app' | 'course'
  const [acaoCarregamento, definirAcaoCarregamento] = useState(false);
  const { toast: aviso } = useAvisos();
  const carregarAdministracaoDados = useCallback(
    async (manual = false) => {
      definirCarregarErro(false);
      if (manual) definirRefreshing(true);
      try {
        const [estatisticasDados, utilizadoresDados, appsDados, cursosDados] = await Promise.all([
          api.get('/administracao/estatisticas').then(({ data: dados }) => dados),
          api.get('/administracao/utilizadores').then(({ data: dados }) => dados),
          api.get('/administracao/creator-applications').then(({ data: dados }) => dados),
          api
            .get('/administracao/cursos', {
              params: {
                status: 'all',
              },
            })
            .then(({ data: dados }) => dados),
        ]);

        definirEstatisticas(estatisticasDados || null);
        definirUtilizadores(utilizadoresDados || []);
        definirCandidaturas(appsDados || []);
        definirCursos(cursosDados || []);
        if (manual) {
          aviso({
            title: 'Atualizado',
            message: 'Dados sincronizados com sucesso.',
            type: 'success',
          });
        }
      } catch (erro) {
        definirCarregarErro(true);
        console.error(erro);
        aviso({
          title: 'Erro',
          message: 'Não foi possível carregar os dados.',
          type: 'error',
        });
      } finally {
        definirCarregamento(false);
        definirRefreshing(false);
      }
    },
    [aviso],
  );

  useEffect(() => {
    carregarAdministracaoDados();
  }, [carregarAdministracaoDados]);

  // Suspender / Reativar
  const tratarAlternarSuspender = async (utilizadorId) => {
    try {
      const resposta = await api
        .put(`/administracao/utilizadores/${utilizadorId}/suspender`)
        .then(({ data: dados }) => dados);

      definirUtilizadores((anterior) =>
        anterior.map((u) =>
          u.id === utilizadorId
            ? {
                ...u,
                estaSuspenso: resposta.estaSuspenso,
              }
            : u,
        ),
      );
      aviso({
        title: resposta.estaSuspenso ? 'Utilizador Suspenso' : 'Utilizador Reativado',
        message: resposta.estaSuspenso
          ? 'A conta foi temporariamente bloqueada.'
          : 'A conta está agora ativa.',
        type: resposta.estaSuspenso ? 'error' : 'success',
      });
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao alterar estado.',
        type: 'error',
      });
    }
  };

  // Aprovar candidatura
  const tratarAprovarCandidatura = async (aplicacaoId) => {
    definirAcaoCarregamento(true);
    try {
      await api
        .put(`/administracao/creator-applications/${aplicacaoId}/aprovar`)
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Candidatura Aprovada',
        message: 'O utilizador agora é Formador e pode publicar cursos.',
        type: 'success',
      });
      carregarAdministracaoDados();
      if (selecionadoAplicacao?.id === aplicacaoId) definirSelecionadoAplicacao(null);
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Não foi possível aprovar.',
        type: 'error',
      });
    } finally {
      definirAcaoCarregamento(false);
    }
  };

  // Confirmar rejeição da candidatura
  const tratarConfirmarRejeitarCandidatura = async () => {
    if (!selecionadoAplicacao) return;
    definirAcaoCarregamento(true);
    try {
      await api
        .put(`/administracao/creator-applications/${selecionadoAplicacao.id}/rejeitar`, {
          feedback: rejeitarParecer,
        })
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Candidatura Rejeitada',
        message: 'Feedback registado.',
        type: 'info',
      });
      definirMostrarRejeitarJanela(false);
      definirRejeitarParecer('');
      definirSelecionadoAplicacao(null);
      carregarAdministracaoDados();
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao rejeitar.',
        type: 'error',
      });
    } finally {
      definirAcaoCarregamento(false);
    }
  };

  // Aprovar curso
  const tratarAprovarCurso = async (cursoId) => {
    definirAcaoCarregamento(true);
    try {
      await api
        .put(`/administracao/cursos/${cursoId}/aprovar`, {
          atualizadoEmEsperado: selecionadoCursoDetail?.atualizadoEm,
        })
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Curso Aprovado',
        message: 'O curso já está visível para todos os alunos.',
        type: 'success',
      });
      carregarAdministracaoDados();
      if (selecionadoCursoDetail?.id === cursoId) definirSelecionadoCursoDetail(null);
      if (selecionadoCurso?.id === cursoId) definirSelecionadoCurso(null);
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao aprovar curso.',
        type: 'error',
      });
    } finally {
      definirAcaoCarregamento(false);
    }
  };

  // Confirmar rejeição do curso
  const tratarConfirmarRejeitarCurso = async () => {
    if (!selecionadoCurso) return;
    definirAcaoCarregamento(true);
    try {
      await api
        .put(`/administracao/cursos/${selecionadoCurso.id}/rejeitar`, {
          notes: rejeitarParecer,
          atualizadoEmEsperado: selecionadoCurso?.atualizadoEm,
        })
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Alterações Solicitadas',
        message: 'Feedback enviado ao formador.',
        type: 'info',
      });
      definirMostrarRejeitarJanela(false);
      definirRejeitarParecer('');
      definirSelecionadoCursoDetail(null);
      definirSelecionadoCurso(null);
      carregarAdministracaoDados();
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao rejeitar curso.',
        type: 'error',
      });
    } finally {
      definirAcaoCarregamento(false);
    }
  };

  // Ver currículo do curso
  const tratarAbrirCursoRever = async (curso) => {
    const requestId = ++cursoReverRequest.current;

    definirSelecionadoCursoDetail(curso);
    definirCursoDetailCarregamento(true);
    definirCursoReverErro(false);
    try {
      const detalhes = await api
        .get(`/formador/cursos/${curso.id}`)
        .then(({ data: dados }) => dados);
      if (requestId !== cursoReverRequest.current) return;
      definirSelecionadoCursoDetail({
        ...curso,
        ...detalhes,
      });
    } catch {
      if (requestId !== cursoReverRequest.current) return;
      definirCursoReverErro(true);
      aviso({
        title: 'Erro',
        message: 'Não foi possível carregar o currículo.',
        type: 'error',
      });
    } finally {
      if (requestId === cursoReverRequest.current) definirCursoDetailCarregamento(false);
    }
  };

  // Contagens
  const pendenteApps = candidaturas.filter((a) => a.status === 'PENDING');
  const pendenteCursos = cursos.filter((c) => c.estadoAprovacao === 'PENDING');

  // Filtros em memória
  const filteredCandidaturas = useMemo(() => {
    return candidaturas.filter((aplicacao) => {
      const matchEstado = aplicacaoFiltrar === 'ALL' || aplicacao.status === aplicacaoFiltrar;
      const q = aplicacaoPesquisar.trim().toLowerCase();
      const matchPesquisar =
        !q ||
        (aplicacao.nomeCompleto && aplicacao.nomeCompleto.toLowerCase().includes(q)) ||
        (aplicacao.expertise && aplicacao.expertise.toLowerCase().includes(q)) ||
        (aplicacao.user?.username && aplicacao.user.username.toLowerCase().includes(q));

      return matchEstado && matchPesquisar;
    });
  }, [candidaturas, aplicacaoFiltrar, aplicacaoPesquisar]);
  const filteredCursos = useMemo(() => {
    return cursos.filter((curso) => {
      const matchEstado = cursoFiltrar === 'ALL' || curso.estadoAprovacao === cursoFiltrar;
      const q = cursoPesquisar.trim().toLowerCase();
      const matchPesquisar =
        !q ||
        (curso.title && curso.title.toLowerCase().includes(q)) ||
        (curso.creator?.name && curso.creator.name.toLowerCase().includes(q));

      return matchEstado && matchPesquisar;
    });
  }, [cursos, cursoFiltrar, cursoPesquisar]);
  const filteredUtilizadores = useMemo(() => {
    return utilizadores.filter((u) => {
      const q = utilizadorPesquisar.trim().toLowerCase();
      const matchPesquisar =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q));
      const matchCargo =
        utilizadorCargoFiltrar === 'ALL' ||
        (utilizadorCargoFiltrar === 'CREATOR'
          ? u.role === 'CREATOR' || u.eFormador
          : u.role === utilizadorCargoFiltrar);
      const matchEstado =
        utilizadorEstadoFiltrar === 'ALL'
          ? true
          : utilizadorEstadoFiltrar === 'SUSPENDED'
            ? u.estaSuspenso
            : !u.estaSuspenso;

      return matchPesquisar && matchCargo && matchEstado;
    });
  }, [utilizadores, utilizadorPesquisar, utilizadorCargoFiltrar, utilizadorEstadoFiltrar]);
  if (carregamento)
    return (
      <PaginaEstado
        loading
        title="A carregar a administração…"
      />
    );
  if (carregarErro)
    return (
      <PaginaEstado
        title="Não foi possível carregar a administração"
        message="Os dados continuam guardados. Tente novamente."
        onRetry={() => carregarAdministracaoDados()}
      />
    );

  return (
    <div className="admin-dashboard-panel area-gestao area-administracao">
      <div className="admin-dashboard-panel-2">
        <div>
          <h1 className="admin-dashboard-title">Administração</h1>
          <p className="admin-dashboard-description">
            Utilizadores, cursos e pedidos de publicação.
          </p>
        </div>

        <div className="admin-dashboard-panel-3">
          <Botao
            variant="secondary"
            size="sm"
            onClick={() => carregarAdministracaoDados(true)}
            disabled={refreshing}
            leftIcon={
              <RefreshCw
                className={`admin-dashboard-refresh-cw ${refreshing ? 'admin-dashboard-refresh-cw-2' : ''}`}
              />
            }
            className="admin-dashboard-button"
          >
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </Botao>
        </div>
      </div>

      {/* ── NAVEGAÇÃO ENTRE ABAS (ESTILO SEGMENTADO CLEAN) ── */}
      <div className="admin-dashboard-panel-4">
        {[
          {
            id: 'overview',
            label: 'Visão Geral',
            count: null,
          },
          {
            id: 'applications',
            label: 'Candidaturas',
            count: pendenteApps.length,
          },
          {
            id: 'courses',
            label: 'Cursos',
            count: pendenteCursos.length,
          },
          {
            id: 'users',
            label: 'Utilizadores',
            count: utilizadores.length,
          },
        ].map((separador) => (
          <button
            key={separador.id}
            type="button"
            aria-pressed={ativoSeparador === separador.id}
            onClick={() => definirAtivoSeparador(separador.id)}
            className={`admin-dashboard-button-2 ${ativoSeparador === separador.id ? 'admin-dashboard-button-3' : 'admin-dashboard-button-4'}`}
          >
            <span>{separador.label}</span>
            {separador.count !== null && separador.count > 0 && (
              <span
                className={`admin-dashboard-label ${separador.id === 'applications' || separador.id === 'courses' ? 'admin-dashboard-label-2' : 'admin-dashboard-label-3'}`}
              >
                {separador.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {ativoSeparador === 'overview' && (
        <div className="admin-dashboard-panel-5">
          {/* Métricas Principais */}
          <div
            className="gestao-metricas gestao-metricas-admin"
            aria-label="Resumo da plataforma"
          >
            <button
              type="button"
              onClick={() => definirAtivoSeparador('users')}
            >
              <span className="gestao-metrica-nome">Utilizadores</span>
              <strong>{utilizadores.length}</strong>
              <span className="gestao-metrica-nota">Contas registadas</span>
            </button>
            <button
              type="button"
              onClick={() => definirAtivoSeparador('courses')}
            >
              <span className="gestao-metrica-nome">Cursos</span>
              <strong>{cursos.length}</strong>
              <span className="gestao-metrica-nota">{pendenteCursos.length} por rever</span>
            </button>
            <button
              type="button"
              onClick={() => definirAtivoSeparador('applications')}
            >
              <span className="gestao-metrica-nome">Candidaturas</span>
              <strong>{candidaturas.length}</strong>
              <span className="gestao-metrica-nota">{pendenteApps.length} por rever</span>
            </button>
            <div>
              <span className="gestao-metrica-nome">Inscrições</span>
              <strong>{estatisticas?.totalEnrollments ?? 0}</strong>
              <span className="gestao-metrica-nota">Nos cursos da plataforma</span>
            </div>
          </div>

          <CursoEstadoGrafico courses={cursos} />

          {/* Tarefas Pendentes de Atenção */}
          {(pendenteApps.length > 0 || pendenteCursos.length > 0) && (
            <div className="admin-dashboard-panel-12">
              <h3 className="admin-dashboard-subheading">
                <AlertCircle className="admin-dashboard-alert-circle" />
                <span>Por rever</span>
              </h3>

              <div className="admin-dashboard-panel-13">
                {pendenteApps.length > 0 && (
                  <div className="admin-dashboard-panel-14">
                    <div>
                      <div className="admin-dashboard-panel-15">
                        {pendenteApps.length} Candidatura(s) a Formador
                      </div>
                      <div className="admin-dashboard-panel-16">
                        Pedidos para dar formação na plataforma.
                      </div>
                    </div>
                    <Botao
                      variant="primary"
                      size="sm"
                      onClick={() => definirAtivoSeparador('applications')}
                      className="admin-dashboard-button-5"
                    >
                      Rever
                    </Botao>
                  </div>
                )}

                {pendenteCursos.length > 0 && (
                  <div className="admin-dashboard-panel-14">
                    <div>
                      <div className="admin-dashboard-panel-15">
                        {pendenteCursos.length} Curso(s) Submetido(s)
                      </div>
                      <div className="admin-dashboard-panel-16">
                        Cursos enviados para publicação.
                      </div>
                    </div>
                    <Botao
                      variant="primary"
                      size="sm"
                      onClick={() => definirAtivoSeparador('courses')}
                      className="admin-dashboard-button-5"
                    >
                      Moderar
                    </Botao>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duas colunas com resumos rápidos */}
          <div className="admin-dashboard-panel-17">
            {/* Utilizadores Recentes */}
            <div className="admin-dashboard-panel-18">
              <div className="admin-dashboard-panel-19">
                <h3 className="admin-dashboard-subheading-2">Registos recentes</h3>
                <button
                  type="button"
                  onClick={() => definirAtivoSeparador('users')}
                  className="admin-dashboard-button-6"
                >
                  Ver todos
                </button>
              </div>
              <div className="admin-dashboard-panel-20">
                {utilizadores.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="admin-dashboard-panel-21"
                  >
                    <div className="admin-dashboard-panel-22">
                      <Avatar
                        src={u.urlAvatar}
                        name={u.name}
                        username={u.username}
                        role={u.role}
                        size="sm"
                      />
                      <div className="admin-dashboard-panel-23">
                        <div className="admin-dashboard-panel-24">{u.name}</div>
                        <div className="admin-dashboard-panel-25">{u.email}</div>
                      </div>
                    </div>
                    <Distintivo
                      size="sm"
                      variant={
                        u.role === 'ADMIN'
                          ? 'error'
                          : u.role === 'CREATOR'
                            ? 'primary'
                            : 'secondary'
                      }
                      className="admin-dashboard-badge"
                    >
                      {u.role === 'ADMIN'
                        ? u.eFormador
                          ? 'Administrador e formador'
                          : 'Administrador'
                        : u.role === 'CREATOR'
                          ? 'Formador'
                          : 'Aluno'}
                    </Distintivo>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursos Recentes */}
            <div className="admin-dashboard-panel-18">
              <div className="admin-dashboard-panel-19">
                <h3 className="admin-dashboard-subheading-2">Cursos recentes</h3>
                <button
                  type="button"
                  onClick={() => definirAtivoSeparador('courses')}
                  className="admin-dashboard-button-6"
                >
                  Ver todos
                </button>
              </div>
              <div className="admin-dashboard-panel-20">
                {cursos.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="admin-dashboard-panel-21"
                  >
                    <div className="admin-dashboard-panel-22">
                      <div className="admin-dashboard-panel-26">
                        <img
                          src={c.urlMiniatura}
                          alt={c.title}
                          className="admin-dashboard-image"
                        />
                      </div>
                      <div className="admin-dashboard-panel-23">
                        <div className="admin-dashboard-panel-24">{c.title}</div>
                        <div className="admin-dashboard-panel-16">
                          {c.creator?.name || 'Formador'} • {formatarCursoPreco(c)}
                        </div>
                      </div>
                    </div>
                    <Distintivo
                      size="sm"
                      variant={
                        c.estadoAprovacao === 'APPROVED'
                          ? 'success'
                          : c.estadoAprovacao === 'REJECTED'
                            ? 'error'
                            : 'warning'
                      }
                      className="admin-dashboard-badge"
                    >
                      {c.estadoAprovacao === 'APPROVED'
                        ? 'Aprovado'
                        : c.estadoAprovacao === 'REJECTED'
                          ? 'Rejeitado'
                          : 'Pendente'}
                    </Distintivo>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. CANDIDATURAS A FORMADOR ── */}
      {ativoSeparador === 'applications' && (
        <div className="admin-dashboard-panel-27">
          {/* Barra de Filtros */}
          <div className="admin-dashboard-panel-28">
            <div className="admin-dashboard-panel-29">
              {[
                ['PENDING', `Pendentes (${pendenteApps.length})`],
                ['APPROVED', 'Aprovadas'],
                ['REJECTED', 'Rejeitadas'],
                ['ALL', 'Todas'],
              ].map(([estado, label]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => definirAplicacaoFiltrar(estado)}
                  className={`admin-dashboard-button-7 ${aplicacaoFiltrar === estado ? 'admin-dashboard-button-8' : 'admin-dashboard-button-9'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={aplicacaoPesquisar}
                onChange={(evento) => definirAplicacaoPesquisar(evento.target.value)}
                placeholder="Pesquisar candidato..."
                className="admin-dashboard-field admin-user-search"
              />
            </div>
          </div>

          {filteredCandidaturas.length === 0 ? (
            <div className="admin-dashboard-panel-31">
              Nenhuma candidatura encontrada neste filtro.
            </div>
          ) : (
            <div className="admin-dashboard-panel-32">
              {filteredCandidaturas.map((aplicacao) => (
                <div
                  key={aplicacao.id}
                  className="admin-dashboard-panel-33"
                >
                  <div className="admin-dashboard-panel-34">
                    <div className="admin-dashboard-panel-35">
                      <Avatar
                        src={aplicacao.user?.urlAvatar}
                        name={aplicacao.nomeCompleto}
                        role="STUDENT"
                        size="md"
                      />
                      <div>
                        <div className="admin-dashboard-panel-3">
                          <h3 className="admin-dashboard-subheading-3">{aplicacao.nomeCompleto}</h3>
                          <Distintivo
                            size="sm"
                            variant={
                              aplicacao.status === 'APPROVED'
                                ? 'success'
                                : aplicacao.status === 'REJECTED'
                                  ? 'error'
                                  : 'warning'
                            }
                            className="admin-dashboard-badge-2"
                          >
                            {aplicacao.status === 'APPROVED'
                              ? 'Aprovada'
                              : aplicacao.status === 'REJECTED'
                                ? 'Rejeitada'
                                : 'Pendente'}
                          </Distintivo>
                        </div>
                        <div className="admin-dashboard-panel-36">
                          @{aplicacao.user?.username || aplicacao.idUtilizador} • Submetido em{' '}
                          {new Date(aplicacao.criadoEm).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>

                    {aplicacao.status === 'PENDING' && (
                      <div className="admin-dashboard-panel-37">
                        <Botao
                          variant="secondary"
                          size="sm"
                          disabled={acaoCarregamento}
                          onClick={() => {
                            definirSelecionadoAplicacao(aplicacao);
                            definirRejeitarType('app');
                            definirMostrarRejeitarJanela(true);
                          }}
                          className="admin-dashboard-button-10"
                        >
                          Recusar
                        </Botao>
                        <Botao
                          variant="primary"
                          size="sm"
                          disabled={acaoCarregamento}
                          onClick={() => tratarAprovarCandidatura(aplicacao.id)}
                          className="admin-dashboard-button-11"
                        >
                          Aprovar Formador
                        </Botao>
                      </div>
                    )}
                  </div>

                  {/* Informações detalhadas da candidatura */}
                  <div className="admin-dashboard-panel-38">
                    <div>
                      <span className="admin-dashboard-label-5">Área: </span>
                      <strong className="admin-dashboard-strong">
                        {aplicacao.expertise || 'Geral'}
                      </strong>
                    </div>
                    <div>
                      <span className="admin-dashboard-label-5">Experiência: </span>
                      <strong className="admin-dashboard-strong">
                        {aplicacao.anosExperiencia} ano(s)
                      </strong>
                    </div>
                    <div className="admin-dashboard-panel-39">
                      <span className="admin-dashboard-label-5">Motivação: </span>
                      <span className="admin-dashboard-label-6">{aplicacao.motivation}</span>
                    </div>
                    <div className="admin-dashboard-panel-39">
                      <span className="admin-dashboard-label-5">Cursos Propostos: </span>
                      <span className="admin-dashboard-label-7">{aplicacao.cursosPropostos}</span>
                    </div>

                    {(aplicacao.urlPortefolio || aplicacao.urlVideoExemplo) && (
                      <div className="admin-dashboard-panel-40">
                        {aplicacao.urlPortefolio &&
                          /^https?:\/\//i.test(aplicacao.urlPortefolio) && (
                            <a
                              href={seguroExternoUrl(aplicacao.urlPortefolio) || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-dashboard-link"
                            >
                              Portfólio / LinkedIn{' '}
                              <ExternalLink className="admin-dashboard-external-link" />
                            </a>
                          )}
                        {aplicacao.urlVideoExemplo &&
                          /^https?:\/\//i.test(aplicacao.urlVideoExemplo) && (
                            <a
                              href={seguroExternoUrl(aplicacao.urlVideoExemplo) || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-dashboard-link"
                            >
                              Vídeo Exemplo{' '}
                              <ExternalLink className="admin-dashboard-external-link" />
                            </a>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. MODERAÇÃO DE CURSOS ── */}
      {ativoSeparador === 'courses' && (
        <div className="admin-dashboard-panel-27">
          <div className="admin-dashboard-panel-28">
            <div className="admin-dashboard-panel-29">
              {[
                ['PENDING', `Pendentes (${pendenteCursos.length})`],
                ['APPROVED', 'Aprovados'],
                ['REJECTED', 'Rejeitados'],
                ['ALL', 'Todos'],
              ].map(([estado, label]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => definirCursoFiltrar(estado)}
                  className={`admin-dashboard-button-7 ${cursoFiltrar === estado ? 'admin-dashboard-button-8' : 'admin-dashboard-button-9'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={cursoPesquisar}
                onChange={(evento) => definirCursoPesquisar(evento.target.value)}
                placeholder="Pesquisar por título ou formador..."
                className="admin-dashboard-field admin-user-search"
              />
            </div>
          </div>

          {filteredCursos.length === 0 ? (
            <div className="admin-dashboard-panel-31">Nenhum curso encontrado neste filtro.</div>
          ) : (
            <div className="admin-dashboard-panel-32">
              {filteredCursos.map((curso) => (
                <div
                  key={curso.id}
                  className="admin-dashboard-panel-41"
                >
                  <div className="admin-dashboard-panel-42">
                    <div className="admin-dashboard-panel-43">
                      <img
                        src={curso.urlMiniatura}
                        alt={curso.title}
                        className="admin-dashboard-image"
                      />
                    </div>
                    <div className="admin-dashboard-panel-23">
                      <div className="admin-dashboard-panel-3">
                        <h3 className="admin-dashboard-subheading-4">{curso.title}</h3>
                        <Distintivo
                          size="sm"
                          variant={
                            curso.estadoAprovacao === 'APPROVED'
                              ? 'success'
                              : curso.estadoAprovacao === 'REJECTED'
                                ? 'error'
                                : 'warning'
                          }
                          className="admin-dashboard-badge-2"
                        >
                          {curso.estadoAprovacao === 'APPROVED'
                            ? 'Aprovado'
                            : curso.estadoAprovacao === 'REJECTED'
                              ? 'Rejeitado'
                              : 'Pendente'}
                        </Distintivo>
                      </div>
                      <div className="admin-dashboard-panel-44">{curso.description}</div>
                      <div className="admin-dashboard-panel-45">
                        {curso.creator?.name || 'Formador'} • {formatarCategoria(curso.category)} •{' '}
                        {formatarCursoPreco(curso)}
                      </div>
                    </div>
                  </div>

                  <div className="admin-dashboard-panel-46">
                    <Botao
                      variant="secondary"
                      size="sm"
                      leftIcon={<Eye className="admin-dashboard-refresh-cw" />}
                      onClick={() => tratarAbrirCursoRever(curso)}
                      className="admin-dashboard-button"
                    >
                      Rever curso
                    </Botao>
                    {curso.estadoAprovacao === 'APPROVED' && (
                      <Link to={`/cursos/${curso.id}`}>
                        <Botao
                          as="span"
                          variant="secondary"
                          size="sm"
                          className="admin-dashboard-button-5"
                        >
                          Ver Público
                        </Botao>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. GESTÃO DE UTILIZADORES ── */}
      {ativoSeparador === 'users' && (
        <div className="admin-dashboard-panel-18">
          {/* Barra de Filtros e Pesquisa */}
          <div className="admin-dashboard-panel-47">
            <div className="admin-dashboard-panel-48">
              <span className="admin-dashboard-label-8">Cargo:</span>
              {[
                ['ALL', 'Todos'],
                ['ADMIN', 'Admins'],
                ['CREATOR', 'Formadores'],
                ['STUDENT', 'Alunos'],
              ].map(([cargo, label]) => (
                <button
                  key={cargo}
                  type="button"
                  onClick={() => definirUtilizadorCargoFiltrar(cargo)}
                  className={`admin-dashboard-button-12 ${utilizadorCargoFiltrar === cargo ? 'admin-dashboard-button-8' : 'admin-dashboard-button-13'}`}
                >
                  {label}
                </button>
              ))}

              <span className="admin-dashboard-label-9">Estado:</span>
              {[
                ['ALL', 'Todos'],
                ['ACTIVE', 'Ativos'],
                ['SUSPENDED', 'Suspensos'],
              ].map(([estado, label]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => definirUtilizadorEstadoFiltrar(estado)}
                  className={`admin-dashboard-button-12 ${utilizadorEstadoFiltrar === estado ? 'admin-dashboard-button-8' : 'admin-dashboard-button-13'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-panel-30">
              <Search className="admin-dashboard-search" />
              <input
                type="text"
                value={utilizadorPesquisar}
                onChange={(evento) => definirUtilizadorPesquisar(evento.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="admin-dashboard-field admin-user-search"
              />
            </div>
          </div>

          {/* Tabela de Utilizadores */}
          <div className="admin-dashboard-panel-49">
            <table className="admin-dashboard-table admin-users-table">
              <thead className="admin-dashboard-table-head">
                <tr>
                  <th className="admin-dashboard-table-heading">Utilizador</th>
                  <th className="admin-dashboard-table-heading">Email</th>
                  <th className="admin-dashboard-table-heading">Cargo</th>
                  <th className="admin-dashboard-table-heading">Estado</th>
                  <th className="admin-dashboard-table-heading-2">Ação</th>
                </tr>
              </thead>
              <tbody className="admin-dashboard-panel-20">
                {filteredUtilizadores.map((u) => (
                  <tr
                    key={u.id}
                    className="admin-dashboard-table-row"
                  >
                    <td className="admin-dashboard-table-cell">
                      <Avatar
                        src={u.urlAvatar}
                        name={u.name}
                        username={u.username}
                        role={u.role}
                        size="sm"
                      />
                      <div>
                        <Link
                          to={`/perfil/${encodeURIComponent(u.username)}`}
                          className="admin-dashboard-panel-15"
                        >
                          {u.name}
                        </Link>
                        <div className="admin-dashboard-panel-50">@{u.username}</div>
                      </div>
                    </td>
                    <td
                      className="admin-dashboard-table-cell-2"
                      data-label="Email"
                    >
                      {u.email}
                    </td>
                    <td
                      className="admin-dashboard-table-heading"
                      data-label="Cargo"
                    >
                      <Distintivo
                        size="sm"
                        variant={
                          u.role === 'ADMIN'
                            ? 'error'
                            : u.role === 'CREATOR'
                              ? 'primary'
                              : 'secondary'
                        }
                        className="admin-dashboard-badge-2"
                      >
                        {u.role === 'ADMIN'
                          ? u.eFormador
                            ? 'Administracao · Formador'
                            : 'Administracao'
                          : u.role === 'CREATOR'
                            ? 'Formador'
                            : 'Aluno'}
                      </Distintivo>
                    </td>
                    <td
                      className="admin-dashboard-table-heading"
                      data-label="Estado"
                    >
                      <Distintivo
                        size="sm"
                        variant={u.estaSuspenso ? 'error' : 'success'}
                        className="admin-dashboard-badge-2"
                      >
                        {u.estaSuspenso ? 'Suspenso' : 'Ativo'}
                      </Distintivo>
                    </td>
                    <td
                      className="admin-dashboard-table-heading-2"
                      data-label="Ações"
                    >
                      <div className="admin-user-actions">
                        <UtilizadorCargoEditor
                          key={`${u.id}:${u.role}:${u.eFormador}`}
                          user={u}
                          onChanged={() => carregarAdministracaoDados()}
                        />
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => tratarAlternarSuspender(u.id)}
                            className={`admin-dashboard-button-14 ${u.estaSuspenso ? 'admin-dashboard-button-15' : 'admin-dashboard-button-16'}`}
                          >
                            {u.estaSuspenso ? 'Reativar' : 'Suspender'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selecionadoCursoDetail && (
        <RevisaoCurso
          key={`${selecionadoCursoDetail.id}:${selecionadoCursoDetail.atualizadoEm}`}
          course={selecionadoCursoDetail}
          loading={cursoDetailCarregamento}
          error={cursoReverErro}
          busy={acaoCarregamento}
          onClose={() => {
            cursoReverRequest.current += 1;
            definirSelecionadoCursoDetail(null);
          }}
          onRetry={() => tratarAbrirCursoRever(selecionadoCursoDetail)}
          onApprove={() => tratarAprovarCurso(selecionadoCursoDetail.id)}
          onRequestChanges={() => {
            definirSelecionadoCurso(selecionadoCursoDetail);
            definirRejeitarParecer('');
            definirRejeitarType('course');
            definirSelecionadoCursoDetail(null);
            definirMostrarRejeitarJanela(true);
          }}
        />
      )}

      <Janela
        isOpen={mostrarRejeitarJanela}
        maxWidth="md"
        title={rejeitarType === 'app' ? 'Rejeitar candidatura' : 'Pedir alterações ao curso'}
        onClose={() => {
          if (!acaoCarregamento) {
            definirMostrarRejeitarJanela(false);
            definirRejeitarParecer('');
          }
        }}
      >
        <p>O feedback fica guardado e será enviado ao utilizador nas notificações.</p>
        <label htmlFor="review-feedback">Alterações necessárias</label>
        <textarea
          id="review-feedback"
          rows={5}
          maxLength={2000}
          required
          value={rejeitarParecer}
          onChange={(evento) => definirRejeitarParecer(evento.target.value)}
          placeholder="Explique o que deve ser corrigido antes da aprovação…"
          className="admin-dashboard-textarea"
        />
        <div className="admin-dashboard-panel-64">
          <Botao
            variant="secondary"
            disabled={acaoCarregamento}
            onClick={() => definirMostrarRejeitarJanela(false)}
          >
            Cancelar
          </Botao>
          <Botao
            disabled={acaoCarregamento || !rejeitarParecer.trim()}
            isLoading={acaoCarregamento}
            onClick={
              rejeitarType === 'course'
                ? tratarConfirmarRejeitarCurso
                : tratarConfirmarRejeitarCandidatura
            }
          >
            Enviar feedback
          </Botao>
        </div>
      </Janela>
    </div>
  );
};

export default AdministracaoPainelPagina;
