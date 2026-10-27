import '../../estilos/gestao-editor.css';
import { PaginaEstado } from '../../componentes/PaginaEstado';
import './FormadorMembrosPagina.css';
import '../../estilos/gestao.css';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  LuSearch as Search,
  LuUsers as Users,
  LuUserPlus as UserPlus,
  LuTrash2 as Trash2,
  LuMessageSquare as MessageSquare,
  LuBookOpen as BookOpen,
  LuShield as Shield,
} from 'react-icons/lu';
import { Botao } from '../../componentes/Botao';
import { Avatar } from '../../componentes/Avatar';
import { Seletor } from '../../componentes/Seletor';
import { useAvisos } from '../../componentes/Avisos';
import { api } from '../../servicos/api';

export const FormadorMembrosPagina = () => {
  const [ativoSeparador, definirAtivoSeparador] = useState('members'); // 'members' | 'collaborators'
  const [membros, definirMembros] = useState([]);
  const [cursos, definirCursos] = useState([]);
  const [pesquisar, definirPesquisar] = useState('');
  const [selecionadoCursoFiltrar, definirSelecionadoCursoFiltrar] = useState('ALL');
  const [carregamento, definirCarregamento] = useState(true);

  // Collaborators management state
  const [selecionadoCollabCursoId, definirSelecionadoCollabCursoId] = useState('');
  const [colaboradores, definirColaboradores] = useState([]);
  const [carregamentoCollabs, definirCarregamentoCollabs] = useState(false);
  const [isAdicionarCollabJanelaAbrir, definirIsAdicionarCollabJanelaAbrir] = useState(false);
  const [collabIdentificador, definirCollabIdentificador] = useState('');
  const [addingCollab, definirAddingCollab] = useState(false);
  const [removingCollabId, definirRemovingCollabId] = useState(null);

  // Student details modal
  const [carregarErro, definirCarregarErro] = useState(false);
  const [deletingMembroId, definirDeletingMembroId] = useState(null);
  const { toast: aviso } = useAvisos();

  useEffect(() => {
    if (isAdicionarCollabJanelaAbrir) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAdicionarCollabJanelaAbrir]);

  const carregarDados = async () => {
    definirCarregamento(true);
    definirCarregarErro(false);
    try {
      const [membrosDados, cursosDados] = await Promise.all([
        api.get('/formador/membros').then(({ data: dados }) => dados),
        api.get('/formador/cursos').then(({ data: dados }) => dados),
      ]);

      definirMembros(membrosDados || []);
      definirCursos(cursosDados || []);
      if (cursosDados && cursosDados.length > 0 && !selecionadoCollabCursoId) {
        definirSelecionadoCollabCursoId(cursosDados[0].id);
      }
    } catch {
      definirCarregarErro(true);
    } finally {
      definirCarregamento(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarColaboradores = async (cursoId) => {
    if (!cursoId) return;
    definirCarregamentoCollabs(true);
    try {
      const dados = await api
        .get(`/formador/cursos/${cursoId}/colaboradores`)
        .then(({ data: dados2 }) => dados2);

      definirColaboradores(dados || []);
    } catch {
      definirColaboradores([]);
    } finally {
      definirCarregamentoCollabs(false);
    }
  };

  useEffect(() => {
    if (selecionadoCollabCursoId) {
      carregarColaboradores(selecionadoCollabCursoId);
    }
  }, [selecionadoCollabCursoId]);

  const cursoOpcoes = useMemo(() => {
    if (cursos && cursos.length > 0) {
      return cursos.map((c) => ({
        id: c.id,
        title: c.title,
      }));
    }

    const map = new Map();

    membros.forEach((m) => {
      if (m.course?.id && m.course?.title) {
        map.set(m.course.id, m.course.title);
      }
    });

    return Array.from(map.entries()).map(([id, titulo]) => ({
      id,
      title: titulo,
    }));
  }, [cursos, membros]);
  const filteredMembros = membros.filter((m) => {
    const matchesPesquisar =
      m.user?.name?.toLowerCase().includes(pesquisar.toLowerCase()) ||
      m.user?.username?.toLowerCase().includes(pesquisar.toLowerCase()) ||
      m.course?.title?.toLowerCase().includes(pesquisar.toLowerCase());
    const matchesCurso =
      selecionadoCursoFiltrar === 'ALL' || m.course?.id === selecionadoCursoFiltrar;

    return matchesPesquisar && matchesCurso;
  });
  const tratarAdicionarColaborador = async (evento) => {
    evento.preventDefault();
    if (!collabIdentificador.trim() || !selecionadoCollabCursoId) return;
    definirAddingCollab(true);
    try {
      const novoCollab = await api
        .post(`/formador/cursos/${selecionadoCollabCursoId}/colaboradores`, {
          identifier: collabIdentificador.trim(),
        })
        .then(({ data: dados }) => dados);

      definirColaboradores((anterior) => [...anterior, novoCollab]);
      aviso({
        title: 'Colaborador Adicionado!',
        message: `${novoCollab.name || collabIdentificador} agora é colaborador deste curso.`,
        type: 'success',
      });
      definirCollabIdentificador('');
      definirIsAdicionarCollabJanelaAbrir(false);
      // Refresh members list as collaborator was also enrolled
      api
        .get('/formador/membros')
        .then(({ data: dados }) => dados)
        .then((dados) => definirMembros(dados || []))
        .catch(() => {});
    } catch (erro) {
      aviso({
        title: 'Erro ao Adicionar',
        message: erro.message || 'Não foi possível encontrar ou associar o colaborador.',
        type: 'error',
      });
    } finally {
      definirAddingCollab(false);
    }
  };

  const tratarRemoverColaborador = async (collab) => {
    if (
      !window.confirm(
        `Tem a certeza que deseja remover ${collab.name || collab.username} dos colaboradores?`,
      )
    ) {
      return;
    }

    definirRemovingCollabId(collab.idUtilizador);
    try {
      await api
        .delete(`/formador/cursos/${selecionadoCollabCursoId}/colaboradores/${collab.idUtilizador}`)
        .then(({ data: dados }) => dados);
      definirColaboradores((anterior) =>
        anterior.filter((c) => c.idUtilizador !== collab.idUtilizador),
      );
      aviso({
        title: 'Colaborador Removido',
        message: 'O colaborador foi desassociado do curso.',
        type: 'success',
      });
      // Refresh members
      api
        .get('/formador/membros')
        .then(({ data: dados }) => dados)
        .then((dados) => definirMembros(dados || []))
        .catch(() => {});
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Falha ao remover colaborador.',
        type: 'error',
      });
    } finally {
      definirRemovingCollabId(null);
    }
  };

  const tratarRemoverMembro = async (membro) => {
    if (
      !window.confirm(
        `Tem a certeza que deseja remover ${membro.user?.name} do curso "${membro.course?.title}"?`,
      )
    ) {
      return;
    }

    definirDeletingMembroId(membro.id);
    try {
      await api
        .delete(`/formador/cursos/${membro.course.id}/membros/${membro.user.id}`)
        .then(({ data: dados }) => dados);
      definirMembros((anterior) => anterior.filter((m) => m.id !== membro.id));
      aviso({
        title: 'Membro Removido',
        message: `${membro.user?.name} foi removido do curso.`,
        type: 'success',
      });
    } catch (erro) {
      aviso({
        title: 'Erro',
        message: erro.message || 'Não foi possível remover o membro.',
        type: 'error',
      });
    } finally {
      definirDeletingMembroId(null);
    }
  };

  if (carregarErro)
    return (
      <PaginaEstado
        title="Não foi possível carregar os alunos"
        message="Os dados continuam guardados. Tente novamente."
        onRetry={carregarDados}
      />
    );

  return (
    <div className="creator-members-panel area-gestao area-alunos">
      {/* Header */}
      <div className="creator-members-panel-2">
        <div className="creator-members-panel-3">
          <div>
            <h1 className="creator-members-title">Alunos e colaboradores</h1>
            <p className="creator-members-description">
              Consulte as inscrições e faça a gestão dos colaboradores dos seus cursos.
            </p>
          </div>

          {ativoSeparador === 'collaborators' && (
            <Botao
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="creator-members-user-plus" />}
              onClick={() => definirIsAdicionarCollabJanelaAbrir(true)}
              className="creator-members-button"
            >
              Adicionar colaborador
            </Botao>
          )}
        </div>

        {/* Tab switcher */}
        <div className="creator-members-panel-5">
          <button
            aria-pressed={ativoSeparador === 'members'}
            onClick={() => definirAtivoSeparador('members')}
            className={`creator-members-button-2 ${ativoSeparador === 'members' ? 'creator-members-button-3' : 'creator-members-button-4'}`}
          >
            <Users className="creator-members-user-plus" />
            <span>Alunos ({membros.length})</span>
          </button>
          <button
            aria-pressed={ativoSeparador === 'collaborators'}
            onClick={() => definirAtivoSeparador('collaborators')}
            className={`creator-members-button-2 ${ativoSeparador === 'collaborators' ? 'creator-members-button-3' : 'creator-members-button-4'}`}
          >
            <Shield className="creator-members-user-plus" />
            <span>Colaboradores</span>
          </button>
        </div>

        {/* Filtros dos membros. */}
        {ativoSeparador === 'members' && (
          <div className="creator-members-panel-6">
            <div className="creator-members-panel-7">
              <Search className="creator-members-search" />
              <input
                type="text"
                aria-label="Pesquisar alunos ou cursos"
                placeholder="Pesquisar alunos ou cursos..."
                value={pesquisar}
                onChange={(evento) => definirPesquisar(evento.target.value)}
                className="creator-members-field"
              />
            </div>

            <div className="creator-members-panel-8">
              <Seletor
                value={selecionadoCursoFiltrar}
                onChange={(evento) => definirSelecionadoCursoFiltrar(evento.target.value)}
                className="creator-members-select subtle-shadow"
              >
                <option value="ALL">Todos os Cursos ({membros.length})</option>
                {cursoOpcoes.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.title}
                  </option>
                ))}
              </Seletor>
            </div>
          </div>
        )}

        {/* Seleção do curso no separador de colaboradores. */}
        {ativoSeparador === 'collaborators' && (
          <div className="creator-members-panel-9">
            <div className="creator-members-panel-10">
              <BookOpen className="creator-members-book-open" />
              <span>Curso Selecionado:</span>
              <Seletor
                value={selecionadoCollabCursoId}
                onChange={(evento) => definirSelecionadoCollabCursoId(evento.target.value)}
                className="creator-members-select-2"
              >
                {cursoOpcoes.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.title}
                  </option>
                ))}
              </Seletor>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: MEMBERS */}
      {ativoSeparador === 'members' && (
        <>
          {carregamento ? (
            <div className="creator-members-panel-11">A carregar lista de membros...</div>
          ) : filteredMembros.length === 0 ? (
            <div className="creator-members-panel-11">
              Nenhum membro encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="creator-members-panel-12">
              <table className="creator-members-table">
                <thead>
                  <tr className="creator-members-table-row">
                    <th className="creator-members-table-heading">Aluno</th>
                    <th className="creator-members-table-heading-2">Curso</th>
                    <th className="creator-members-table-heading-3">Tipo</th>
                    <th className="creator-members-table-heading-3">Progresso</th>
                    <th className="creator-members-table-heading-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="creator-members-table-body">
                  {filteredMembros.map((m) => (
                    <tr
                      key={m.id}
                      className="creator-members-table-row-2"
                    >
                      <td className="creator-members-table-heading">
                        <div className="creator-members-panel-13">
                          <Avatar
                            src={m.user?.urlAvatar}
                            name={m.user?.name}
                            username={m.user?.username}
                            size="md"
                            status="online"
                          />
                          <div className="creator-members-panel-14">
                            <Link
                              to={`/perfil/${encodeURIComponent(m.user?.username || m.user?.id)}`}
                              className="creator-members-label-2"
                            >
                              {m.user?.name}
                            </Link>
                            <span className="creator-members-label-3">@{m.user?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="creator-members-table-heading-2">
                        <span className="creator-members-label-4">
                          {m.course?.title || 'Geral'}
                        </span>
                      </td>
                      <td className="creator-members-table-heading-3">
                        <span
                          className={`creator-members-label-5 ${m.role === 'COLABORADOR' ? 'creator-members-label-6' : 'creator-members-label-7'}`}
                        >
                          {m.role || 'ALUNO'}
                        </span>
                      </td>
                      <td className="creator-members-table-heading-3">
                        <span className="creator-members-label-8">
                          {Math.round(Number(m.percentagemProgresso ?? 0))}%
                        </span>
                      </td>
                      <td className="creator-members-table-heading-4">
                        <div className="creator-members-panel-15">
                          <Link to="/mensagens">
                            <Botao
                              as="span"
                              variant="secondary"
                              size="sm"
                              leftIcon={
                                <MessageSquare className="creator-members-message-square" />
                              }
                              className="creator-members-button-5"
                            >
                              Conversa
                            </Botao>
                          </Link>
                          <button
                            disabled={deletingMembroId === m.id}
                            onClick={() => tratarRemoverMembro(m)}
                            className="creator-members-button-6"
                            title="Remover membro do curso"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: COLLABORATORS */}
      {ativoSeparador === 'collaborators' && (
        <div className="creator-members-panel-16">
          {carregamentoCollabs ? (
            <div className="creator-members-panel-19">A carregar colaboradores...</div>
          ) : colaboradores.length === 0 ? (
            <div className="creator-members-panel-20">
              <div className="creator-members-panel-21">
                <Users className="creator-members-users" />
              </div>
              <h3 className="creator-members-subheading">Nenhum colaborador adicionado</h3>
              <p className="creator-members-description-2">
                Ainda não adicionou colaboradores a este curso. Convide outros formadores ou colegas
                para o ajudar na gestão.
              </p>
              <Botao
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="creator-members-user-plus" />}
                onClick={() => definirIsAdicionarCollabJanelaAbrir(true)}
                className="creator-members-button-7"
              >
                Adicionar Colaborador
              </Botao>
            </div>
          ) : (
            <div className="creator-members-panel-22">
              {colaboradores.map((c) => (
                <div
                  key={c.id || c.idUtilizador}
                  className="creator-members-panel-23"
                >
                  <div className="creator-members-panel-24">
                    <Avatar
                      src={c.urlAvatar}
                      name={c.name}
                      username={c.username}
                      size="md"
                      status="online"
                    />
                    <div className="creator-members-panel-14">
                      <h4 className="creator-members-caption">{c.name}</h4>
                      <p className="creator-members-description-3">
                        @{c.username} • {c.email}
                      </p>
                      <span className="creator-members-label-9">COLABORADOR</span>
                    </div>
                  </div>

                  <button
                    disabled={removingCollabId === c.idUtilizador}
                    onClick={() => tratarRemoverColaborador(c)}
                    className="creator-members-button-8"
                    title="Remover colaborador"
                  >
                    <Trash2 className="creator-members-user-plus" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Janela Adicionar Colaborador */}
      {isAdicionarCollabJanelaAbrir &&
        createPortal(
          <div className="creator-members-panel-25">
            <div
              className="creator-members-panel-26"
              onClick={() => definirIsAdicionarCollabJanelaAbrir(false)}
            />
            <div
              className="creator-members-panel-27"
              onClick={(evento) => evento.stopPropagation()}
            >
              <div className="creator-members-panel-28">
                <div className="creator-members-panel-29">
                  <UserPlus className="creator-members-user-plus-2" />
                </div>
                <div>
                  <h3 className="creator-members-subheading-2">Adicionar Colaborador</h3>
                  <p className="creator-members-description-4">Ao curso selecionado</p>
                </div>
              </div>

              <form
                onSubmit={tratarAdicionarColaborador}
                className="creator-members-panel-16"
              >
                <div>
                  <label className="creator-members-field-label">Curso</label>
                  <Seletor
                    value={selecionadoCollabCursoId}
                    onChange={(evento) => definirSelecionadoCollabCursoId(evento.target.value)}
                    className="creator-members-select-3"
                  >
                    {cursoOpcoes.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.title}
                      </option>
                    ))}
                  </Seletor>
                </div>

                <div>
                  <label className="creator-members-field-label">Nome de Utilizador ou Email</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: joao_silva ou joao@exemplo.com"
                    value={collabIdentificador}
                    onChange={(evento) => definirCollabIdentificador(evento.target.value)}
                    className="creator-members-field-2"
                  />
                  <p className="creator-members-description-5">
                    O utilizador precisa de ter uma conta registada na plataforma.
                  </p>
                </div>

                <div className="creator-members-panel-30">
                  <Botao
                    variant="secondary"
                    size="sm"
                    onClick={() => definirIsAdicionarCollabJanelaAbrir(false)}
                  >
                    Cancelar
                  </Botao>
                  <Botao
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={addingCollab}
                    className="creator-members-button-9"
                  >
                    {addingCollab ? 'A adicionar...' : 'Adicionar'}
                  </Botao>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default FormadorMembrosPagina;
