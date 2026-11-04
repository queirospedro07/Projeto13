import { lerJsonCompativel } from '../../utils/fieldCompatibility.js';
import './LibraryPage.css';
import { PaginaEstado } from '../../components/StatusPage';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuBookOpen as BookOpen,
  LuPlay as Play,
  LuCircleCheck as CheckCircle2,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuPin as Pin,
} from 'react-icons/lu';
import { Botao } from '../../components/Button';
import { useAvisos } from '../../components/Alerts';
import { useAutenticacao } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { formatarCategoria } from '../../utils/formatting';

export const BibliotecaPagina = () => {
  const { user: utilizador } = useAutenticacao();
  const [inscricoes, definirInscricoes] = useState([]);
  const [pesquisarParametros, definirPesquisarParametros] = useSearchParams();
  const inicialFiltrar = pesquisarParametros.get('filter') || 'all';
  const [filtrar, definirFiltrar] = useState(inicialFiltrar);
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState('');
  const [revision, definirRevision] = useState(0);
  const { toast: aviso } = useAvisos();
  const [ocultarConcluido, definirOcultarConcluido] = useState(() => {
    return (
      (localStorage.getItem('nexo_hide_completed') ??
        localStorage.getItem('learnspace_hide_completed')) === 'true'
    );
  });
  const [ocultoCursoIds, definirOcultoCursoIds] = useState(() => {
    try {
      return lerJsonCompativel(
        localStorage.getItem('nexo_hidden_courses') ||
          localStorage.getItem('learnspace_hidden_courses') ||
          '[]',
      );
    } catch {
      return [];
    }
  });
  const [afixadoCursoIds, definirAfixadoCursoIds] = useState(() => {
    try {
      return lerJsonCompativel(
        localStorage.getItem(`nexo_pinned_courses_${utilizador?.id}`) || '[]',
      );
    } catch {
      return [];
    }
  });
  const alternarAfixarCurso = (cursoId, titulo = 'Curso', evento) => {
    if (evento) {
      evento.preventDefault();
      evento.stopPropagation();
    }

    definirAfixadoCursoIds((anterior) => {
      const isAfixado = anterior.includes(cursoId);
      const seguinte = isAfixado ? anterior.filter((id) => id !== cursoId) : [cursoId, ...anterior];
      if (utilizador?.id) {
        localStorage.setItem(`nexo_pinned_courses_${utilizador.id}`, JSON.stringify(seguinte));
        window.dispatchEvent(new Event('nexo_pins_changed'));
      }

      aviso({
        title: isAfixado ? 'Curso Desafixado' : 'Curso Afixado',
        message: isAfixado
          ? `"${titulo}" foi removido dos seus cursos afixados.`
          : `"${titulo}" foi afixado no topo da sua biblioteca.`,
        type: 'info',
      });

      return seguinte;
    });
  };

  useEffect(() => {
    const qFiltrar = pesquisarParametros.get('filter');
    if (qFiltrar && ['all', 'in-progress', 'completed', 'created', 'hidden'].includes(qFiltrar)) {
      definirFiltrar(qFiltrar);
    }
  }, [pesquisarParametros]);

  const alternarOcultarCurso = (cursoId, titulo = 'Curso') => {
    definirOcultoCursoIds((anterior) => {
      let seguinte;
      if (anterior.includes(cursoId)) {
        seguinte = anterior.filter((id) => id !== cursoId);
        aviso({
          title: 'Curso Reexibido',
          message: `"${titulo}" está novamente visível na biblioteca e na barra lateral.`,
          type: 'success',
        });
      } else {
        seguinte = [...anterior, cursoId];
        aviso({
          title: 'Curso Ocultado',
          message: `"${titulo}" foi ocultado da lista principal e da barra lateral.`,
          type: 'info',
        });
      }

      localStorage.setItem('nexo_hidden_courses', JSON.stringify(seguinte));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));

      return seguinte;
    });
  };

  const alternarOcultarTodosConcluido = () => {
    definirOcultarConcluido((anterior) => {
      const seguinte = !anterior;

      localStorage.setItem('nexo_hide_completed', String(seguinte));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      aviso({
        title: seguinte ? 'Cursos Concluídos Ocultados' : 'Cursos Concluídos Visíveis',
        message: seguinte
          ? 'Os cursos finalizados foram ocultados da lista principal e barra lateral.'
          : 'Todos os cursos concluídos estão agora visíveis.',
        type: 'info',
      });

      return seguinte;
    });
  };

  useEffect(() => {
    let ativo = true;

    definirCarregamento(true);
    definirErro('');
    api
      .get('/cursos/minha-aprendizagem')
      .then(({ data: dados }) => {
        if (ativo) definirInscricoes(dados || []);
      })
      .catch((erro2) => {
        if (ativo) definirErro(erro2.message || 'Não foi possível carregar os seus cursos.');
      })
      .finally(() => {
        if (ativo) definirCarregamento(false);
      });

    return () => {
      ativo = false;
    };
  }, [utilizador?.id, revision]);

  const isCursoOculto = (evento) => {
    const isFinished = evento.isCompleted || (evento.percentagemProgresso || 0) >= 100;
    const isManuallyOculto = ocultoCursoIds.includes(evento.course?.id);

    return isManuallyOculto || (ocultarConcluido && isFinished);
  };

  const ocultoInscricoes = inscricoes.filter(isCursoOculto);
  const visibleInscricoes = inscricoes.filter((evento) => !isCursoOculto(evento));
  const criadoContar = inscricoes.filter((evento) => evento.isCreator).length;
  const tratarSelecionarFiltrar = (novoFiltrar) => {
    definirFiltrar(novoFiltrar);
    if (novoFiltrar === 'all') {
      pesquisarParametros.delete('filter');
      definirPesquisarParametros(pesquisarParametros);
    } else {
      definirPesquisarParametros({
        filter: novoFiltrar,
      });
    }
  };

  const baseFiltered =
    filtrar === 'hidden'
      ? ocultoInscricoes
      : visibleInscricoes.filter((evento) => {
          if (filtrar === 'in-progress')
            return (
              !evento.isCompleted && !evento.isCreator && (evento.percentagemProgresso || 0) < 100
            );
          if (filtrar === 'completed')
            return (
              (evento.isCompleted || (evento.percentagemProgresso || 0) >= 100) && !evento.isCreator
            );
          if (filtrar === 'created') return evento.isCreator;

          return true;
        });
  const filtered = [...baseFiltered].sort((a, b) => {
    const aId = a.course?.id || a.idCurso;
    const bId = b.course?.id || b.idCurso;
    const aAfixado = afixadoCursoIds.includes(aId);
    const bAfixado = afixadoCursoIds.includes(bId);
    if (aAfixado && !bAfixado) return -1;
    if (!aAfixado && bAfixado) return 1;

    return 0;
  });
  if (erro)
    return (
      <PaginaEstado
        title="Não foi possível carregar a biblioteca"
        message={erro}
        onRetry={() => definirRevision((valor) => valor + 1)}
      />
    );

  return (
    <div className="library-page-panel">
      <div className="library-page-panel-2">
        <div>
          <h1 className="library-page-title">Os Meus Cursos</h1>
          <p className="library-page-description">
            Aceda aos seus cursos ativos, continue de onde parou e interaja com os colegas de turma.
          </p>
        </div>

        <div className="library-page-panel-4 no-scrollbar">
          <button
            onClick={() => tratarSelecionarFiltrar('all')}
            className={`library-page-button ${filtrar === 'all' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Todos ({visibleInscricoes.length})
          </button>
          <button
            onClick={() => tratarSelecionarFiltrar('in-progress')}
            className={`library-page-button ${filtrar === 'in-progress' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Em Progresso
          </button>
          <button
            onClick={() => tratarSelecionarFiltrar('completed')}
            className={`library-page-button ${filtrar === 'completed' ? 'library-page-button-2' : 'library-page-button-3'}`}
          >
            Concluídos
          </button>
          {criadoContar > 0 && (
            <button
              onClick={() => tratarSelecionarFiltrar('created')}
              className={`library-page-button-4 ${filtrar === 'created' ? 'library-page-button-2' : 'library-page-button-3'}`}
            >
              Criados ({criadoContar})
            </button>
          )}
          <button
            onClick={() => tratarSelecionarFiltrar('hidden')}
            className={`library-page-button-5 ${filtrar === 'hidden' ? 'library-page-button-7' : 'library-page-button-8'}`}
            title="Ver cursos ocultados"
          >
            <EyeOff className="library-page-book-open" />
            <span>Ver Ocultos ({ocultoInscricoes.length})</span>
          </button>
          <button
            onClick={alternarOcultarTodosConcluido}
            className={`library-page-button-9 ${ocultarConcluido ? 'library-page-button-10' : 'library-page-button-11'}`}
            title="Ocultar ou mostrar cursos já finalizados"
          >
            {ocultarConcluido ? (
              <EyeOff className="library-page-book-open" />
            ) : (
              <Eye className="library-page-book-open" />
            )}
            <span className="library-page-label">
              {ocultarConcluido ? 'Concluídos Ocultos' : 'Ocultar Concluídos'}
            </span>
          </button>
        </div>
      </div>

      {carregamento ? (
        <div className="library-page-panel-5">
          <div className="library-page-panel-6" />
          <p className="library-page-description-2">A carregar os seus cursos...</p>
        </div>
      ) : filtered.length === 0 ? (
        filtrar === 'hidden' ? (
          <div className="library-page-panel-7">
            <div className="library-page-panel-8">
              <Eye className="library-page-eye" />
            </div>
            <h3 className="library-page-subheading">Nenhum curso oculto</h3>
            <p className="library-page-description-3">
              Todos os seus cursos estão visíveis na biblioteca principal. Para ocultar um curso,
              clique no ícone de ocultar no cartão respetivo.
            </p>
            <Botao
              variant="secondary"
              size="md"
              onClick={() => definirFiltrar('all')}
              className="library-page-button-12"
            >
              Ver Todos os Cursos
            </Botao>
          </div>
        ) : (
          <div className="library-page-panel-9">
            <div className="library-page-panel-10">
              <BookOpen className="library-page-eye" />
            </div>
            <h3 className="library-page-subheading">Ainda não está inscrito em nenhum curso</h3>
            <p className="library-page-description-3">
              Explore o nosso catálogo e inscreva-se em cursos com aulas práticas, comunidade e
              salas de dúvidas.
            </p>
            <Link to="/explorar">
              <Botao
                as="span"
                variant="primary"
                size="lg"
                className="library-page-button-12"
              >
                Explorar Catálogo de Cursos
              </Botao>
            </Link>
          </div>
        )
      ) : (
        <div className="library-page-panel-11">
          {filtered.map((inscricao) => {
            const curso = inscricao.course;
            if (!curso) return null;
            const progresso = inscricao.percentagemProgresso || inscricao.progressPercentage || 0;
            const isFinished = inscricao.isCompleted || progresso >= 100;

            return (
              <div
                key={inscricao.id}
                className="library-page-panel-12 ui-group"
              >
                <Link
                  to={`/cursos/${curso.id}`}
                  className="library-page-link group/thumb"
                >
                  <img
                    src={curso.urlMiniatura || '/images/curso-sem-capa.svg'}
                    alt={curso.title}
                    className="library-page-image"
                  />
                  <div className="library-page-panel-13" />

                  <div className="library-page-panel-14">
                    <span className="library-page-label-2">
                      {formatarCategoria(curso.category)}
                    </span>
                    {inscricao.isCreator && <span className="library-page-label-3">Criador</span>}
                    {afixadoCursoIds.includes(curso.id) && (
                      <span className="library-page-label-4">
                        <Pin className="library-page-pin" />
                        <span>Afixado</span>
                      </span>
                    )}
                  </div>

                  <div className="library-page-panel-15">
                    <button
                      onClick={(evento) => alternarAfixarCurso(curso.id, curso.title, evento)}
                      className={`library-page-button-13 ${afixadoCursoIds.includes(curso.id) ? 'library-page-button-14' : 'library-page-button-15'}`}
                      title={
                        afixadoCursoIds.includes(curso.id) ? 'Desafixar curso' : 'Afixar curso'
                      }
                    >
                      <Pin
                        className={`library-page-book-open ${afixadoCursoIds.includes(curso.id) ? 'library-page-pin-2' : ''}`}
                      />
                    </button>
                    {filtrar === 'hidden' ? (
                      <>
                        <span className="library-page-label-5">
                          <EyeOff className="library-page-book-open" />
                          <span>Oculto</span>
                        </span>
                        <button
                          onClick={(evento) => {
                            evento.preventDefault();
                            evento.stopPropagation();
                            alternarOcultarCurso(curso.id, curso.title);
                          }}
                          className="library-page-button-16"
                          title="Voltar a mostrar curso na biblioteca"
                        >
                          <Eye className="library-page-eye-2" />
                          <span>Mostrar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {isFinished ? (
                          <span className="library-page-label-6">
                            <CheckCircle2 className="library-page-book-open" />
                            <span>Concluído</span>
                          </span>
                        ) : (
                          <span className="library-page-label-7">{progresso}%</span>
                        )}
                        <button
                          onClick={(evento) => {
                            evento.preventDefault();
                            evento.stopPropagation();
                            alternarOcultarCurso(curso.id, curso.title);
                          }}
                          className="library-page-button-17"
                          title="Ocultar curso"
                        >
                          <EyeOff className="library-page-eye-off" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="library-page-panel-16">
                    <span className="library-page-label-8">
                      {curso.creator?.name
                        ? `Prof. ${curso.creator.name}`
                        : 'Formador Especialista'}
                    </span>
                    <span className="library-page-label-9">
                      {curso.duracaoHoras || 12}h conteúdo
                    </span>
                  </div>
                </Link>

                <div className="library-page-panel-17">
                  <div>
                    <Link
                      to={`/cursos/${curso.id}`}
                      className="library-page-link-2"
                    >
                      <h3 className="library-page-subheading-2">{curso.title}</h3>
                    </Link>

                    <div className="library-page-panel-18">
                      <div className="library-page-panel-19">
                        <span className="library-page-label-10">Progresso do Curso</span>
                        <span
                          className={isFinished ? 'library-page-label-11' : 'library-page-label-12'}
                        >
                          {progresso}% Concluído
                        </span>
                      </div>
                      <div className="library-page-panel-20">
                        <div
                          className={[
                            `library-page-panel-21 ${isFinished ? 'library-page-panel-22' : 'library-page-panel-23'}`,
                            'library-page-dynamic-1',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{
                            '--library-page-width': `${Math.max(5, progresso)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="library-page-panel-24">
                    <div className="library-page-panel-25">
                      <Link
                        to={`/cursos/${curso.id}`}
                        className="library-page-link-3 library-page-button-18"
                        title="Ver detalhes do curso, currículo e formador"
                      >
                        <BookOpen className="library-page-book-open-2" />
                        <span>Ver Detalhes</span>
                      </Link>
                      <Link
                        to={`/aprender/${curso.id}`}
                        className="library-page-link-3 library-page-button-19"
                        title="Aceder à sala de aulas"
                      >
                        <Play className="library-page-play" />
                        <span>{isFinished ? 'Rever' : 'Aulas'}</span>
                      </Link>
                    </div>

                    {filtrar === 'hidden' && (
                      <button
                        onClick={() => alternarOcultarCurso(curso.id, curso.title)}
                        className="library-page-button-20"
                      >
                        <Eye className="library-page-book-open-2" />
                        <span>Reexibir na Biblioteca</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BibliotecaPagina;
