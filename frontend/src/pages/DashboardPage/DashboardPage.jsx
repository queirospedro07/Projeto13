import { lerJsonCompativel } from '../../utils/fieldCompatibility.js';
import { PaginaEstado } from '../../components/StatusPage';
import './DashboardPage.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuClock as Clock,
  LuBookOpen as BookOpen,
  LuCompass as Compass,
  LuCircleCheck as CheckCircle2,
  LuCirclePlay as PlayCircle,
  LuGraduationCap as GraduationCap,
  LuEyeOff as EyeOff,
  LuPin as Pin,
} from 'react-icons/lu';
import { useAutenticacao } from '../../contexts/AuthContext';
import { BarraProgresso } from '../../components/ProgressBar';
import { api } from '../../services/api';
import { formatarCursoPreco, formatarCategoria } from '../../utils/formatting';

export const PainelPagina = () => {
  const { user: utilizador } = useAutenticacao();

  const [meusCursos, definirMeusCursos] = useState([]);
  const [recommendedCursos, definirRecommendedCursos] = useState([]);
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState(false);
  const [revision, definirRevision] = useState(0);
  const [ocultarConcluido] = useState(() => {
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

  const alternarAfixarCurso = (cursoId, evento) => {
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

      return seguinte;
    });
  };

  const alternarOcultarCurso = (cursoId) => {
    definirOcultoCursoIds((anterior) => {
      const seguinte = anterior.includes(cursoId)
        ? anterior.filter((id) => id !== cursoId)
        : [...anterior, cursoId];

      localStorage.setItem('nexo_hidden_courses', JSON.stringify(seguinte));
      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));

      return seguinte;
    });
  };

  useEffect(() => {
    let ativo = true;

    definirCarregamento(true);
    definirErro(false);
    Promise.all([
      api.get('/cursos/minha-aprendizagem').then(({ data: dados }) => dados),
      api
        .get('/cursos', {
          params: {
            sort: 'popular',
          },
        })
        .then(({ data: dados }) => dados),
    ])
      .then(([inscricoes, cursos]) => {
        if (!ativo) return;
        definirMeusCursos(inscricoes || []);

        const enrolledIds = new Set((inscricoes || []).map((item) => item.idCurso));

        definirRecommendedCursos(
          (cursos || []).filter((curso) => !enrolledIds.has(curso.id)).slice(0, 3),
        );
      })
      .catch(() => {
        if (ativo) definirErro(true);
      })
      .finally(() => {
        if (ativo) definirCarregamento(false);
      });

    return () => {
      ativo = false;
    };
  }, [utilizador?.id, revision]);

  const concluidoCursosContar = meusCursos.filter(
    (evento) => (evento.percentagemProgresso || 0) >= 100 || evento.isCompleted,
  ).length;
  const obterTempoSaudacao = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';

    return 'Boa noite';
  };

  const visibleCursos = meusCursos
    .filter((evento) => {
      const cursoId = evento.course?.id || evento.idCurso;
      const isFinished = (evento.percentagemProgresso || 0) >= 100 || evento.isCompleted;
      if (cursoId && ocultoCursoIds.includes(cursoId)) return false;
      if (ocultarConcluido && isFinished) return false;

      return true;
    })
    .sort((a, b) => {
      const aId = a.course?.id || a.idCurso;
      const bId = b.course?.id || b.idCurso;
      const aAfixado = afixadoCursoIds.includes(aId);
      const bAfixado = afixadoCursoIds.includes(bId);
      if (aAfixado && !bAfixado) return -1;
      if (!aAfixado && bAfixado) return 1;

      return 0;
    });
  const primaryInscricao = visibleCursos[0] || null;

  if (carregamento)
    return (
      <PaginaEstado
        loading
        title="A preparar os seus cursos…"
        loadingVariant="dashboard"
      />
    );
  if (erro)
    return (
      <PaginaEstado
        title="Não foi possível carregar o painel"
        message="Verifique a ligação e tente novamente. O seu progresso continua guardado."
        onRetry={() => definirRevision((valor) => valor + 1)}
      />
    );

  return (
    <div className="dashboard-panel">
      {/* Cabeçalho */}
      <div className="dashboard-panel-2">
        <div>
          <h1 className="dashboard-title">
            {obterTempoSaudacao()}, {utilizador?.name?.split(' ')[0] || 'Aluno'}!
          </h1>
          <p className="dashboard-description">
            Aceda aos seus cursos em andamento e continue as suas aulas de onde parou.
          </p>
        </div>

        <div className="dashboard-panel-4">
          <Link
            to="/explorar"
            className="dashboard-link dashboard-button"
          >
            <Compass className="dashboard-compass" />
            <span>Explorar Cursos</span>
          </Link>
        </div>
      </div>

      {/* Curso principal e resumo */}
      <div className="dashboard-panel-5">
        <div className="dashboard-panel-6">
          {primaryInscricao ? (
            <>
              <div>
                <div className="dashboard-panel-7">
                  <span className="dashboard-label-3">Curso Ativo</span>
                  <span className="dashboard-label-4">
                    {Math.round(primaryInscricao.percentagemProgresso || 0)}% concluído
                  </span>
                </div>

                <Link
                  to={`/cursos/${primaryInscricao.course?.id || primaryInscricao.idCurso}`}
                  className="dashboard-link-2"
                >
                  <h3 className="dashboard-subheading">
                    {primaryInscricao.course?.title || 'Curso em Andamento'}
                  </h3>
                </Link>
                <p className="dashboard-description-2">
                  {primaryInscricao.course?.description ||
                    'Continue a sua aprendizagem de onde parou.'}
                </p>

                <BarraProgresso
                  value={primaryInscricao.percentagemProgresso || 0}
                  size="lg"
                  className="dashboard-progress-bar"
                />
              </div>

              <div className="dashboard-panel-8">
                <div className="dashboard-panel-9">
                  <Clock className="dashboard-clock" />
                  <span>
                    {primaryInscricao.course?.duracaoHoras
                      ? `${primaryInscricao.course.duracaoHoras}h de carga horária`
                      : 'Pronto para aprender'}
                  </span>
                </div>

                <div className="dashboard-panel-10">
                  <Link
                    to={`/cursos/${primaryInscricao.course?.id || primaryInscricao.idCurso}`}
                    className="dashboard-button-2"
                    title="Ver detalhes do curso e currículo"
                  >
                    <BookOpen className="dashboard-book-open" />
                    <span>Ver Detalhes</span>
                  </Link>

                  <Link
                    to={`/aprender/${primaryInscricao.idCurso}`}
                    className="dashboard-button-3"
                  >
                    <PlayCircle className="dashboard-compass" />
                    <span>Continuar Aula</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-panel-11">
              <div className="dashboard-panel-12">
                <GraduationCap className="dashboard-graduation-cap" />
              </div>
              <h3 className="dashboard-subheading-2">Ainda não está matriculado em nenhum curso</h3>
              <p className="dashboard-description-3">
                Explore o catálogo para encontrar cursos práticos e começar a aprender.
              </p>
              <Link
                to="/explorar"
                className="dashboard-button-4"
              >
                Ver Cursos Disponíveis
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-panel-13">
          <h4 className="dashboard-caption">O Seu Resumo</h4>

          <div className="dashboard-panel-14">
            <div className="dashboard-panel-15">
              <div className="dashboard-panel-4">
                <div className="dashboard-panel-16">
                  <BookOpen className="dashboard-book-open-2" />
                </div>
                <div>
                  <p className="dashboard-description-4">Cursos Inscritos</p>
                  <p className="dashboard-description-5">{meusCursos.length}</p>
                </div>
              </div>
              <Link
                to="/biblioteca"
                className="dashboard-link-3"
              >
                Ver Todos
              </Link>
            </div>

            <div className="dashboard-panel-15">
              <div className="dashboard-panel-4">
                <div className="dashboard-panel-17">
                  <CheckCircle2 className="dashboard-book-open-2" />
                </div>
                <div>
                  <p className="dashboard-description-4">Cursos Concluídos</p>
                  <p className="dashboard-description-5">{concluidoCursosContar}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-panel-18">
            Dica: Conclua 100% das aulas de um curso para desbloquear o seu certificado oficial.
          </div>
        </div>
      </div>

      {/* Cursos em andamento */}
      {meusCursos.length > 0 && (
        <div className="dashboard-panel-19">
          <div className="dashboard-panel-20">
            <div>
              <h2 className="dashboard-heading">Os Meus Cursos em Andamento</h2>
            </div>
            <div className="dashboard-panel-4">
              <Link
                to="/biblioteca"
                className="dashboard-link-4"
              >
                Ver Biblioteca Completa
              </Link>
            </div>
          </div>

          {visibleCursos.length === 0 ? (
            <div className="dashboard-panel-21">
              <p className="dashboard-description-6">Nenhum curso ativo no momento.</p>
              <Link
                to="/biblioteca"
                className="dashboard-link-5"
              >
                Gerir os meus cursos na biblioteca
              </Link>
            </div>
          ) : (
            <div className="dashboard-panel-22">
              {visibleCursos.map((evento) => {
                const curso = evento.course;
                if (!curso) return null;
                const progresso = Math.round(evento.percentagemProgresso || 0);
                const isFinished = progresso >= 100 || evento.isCompleted;

                return (
                  <div
                    key={curso.id}
                    className="dashboard-panel-23"
                  >
                    <div>
                      <Link
                        to={`/cursos/${curso.id}`}
                        className="dashboard-link-6 group/thumb"
                      >
                        {curso.urlMiniatura ? (
                          <img
                            src={curso.urlMiniatura}
                            alt={curso.title}
                            className="dashboard-image"
                          />
                        ) : (
                          <div className="dashboard-panel-24">{curso.title?.charAt(0) || 'C'}</div>
                        )}
                        <div className="dashboard-panel-25">
                          <span className="dashboard-label-5">
                            {formatarCategoria(curso.category)}
                          </span>
                          {afixadoCursoIds.includes(curso.id) && (
                            <span className="dashboard-label-6">
                              <Pin className="dashboard-pin" />
                              <span>Afixado</span>
                            </span>
                          )}
                        </div>

                        <div className="dashboard-panel-26">
                          <button
                            onClick={(ev) => alternarAfixarCurso(curso.id, ev)}
                            className={`dashboard-button-5 ${afixadoCursoIds.includes(curso.id) ? 'dashboard-button-6' : 'dashboard-button-7'}`}
                            title={
                              afixadoCursoIds.includes(curso.id)
                                ? 'Desafixar curso'
                                : 'Afixar curso'
                            }
                          >
                            <Pin
                              className={`dashboard-pin-2 ${afixadoCursoIds.includes(curso.id) ? 'dashboard-pin-3' : ''}`}
                            />
                          </button>
                          {isFinished && (
                            <button
                              onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                alternarOcultarCurso(curso.id);
                              }}
                              className="dashboard-button-8"
                              title="Ocultar curso concluído"
                            >
                              <EyeOff className="dashboard-eye-off" />
                              <span>Ocultar</span>
                            </button>
                          )}
                        </div>
                      </Link>

                      <Link
                        to={`/cursos/${curso.id}`}
                        className="dashboard-link-2"
                      >
                        <h3 className="dashboard-subheading-3">{curso.title}</h3>
                      </Link>
                    </div>

                    <div>
                      <div className="dashboard-panel-27">
                        <span>Progresso</span>
                        <span className="dashboard-label-7">{progresso}%</span>
                      </div>
                      <BarraProgresso
                        value={progresso}
                        size="md"
                        className="dashboard-progress-bar-2"
                      />

                      <div className="dashboard-panel-28">
                        <Link
                          to={`/cursos/${curso.id}`}
                          className="dashboard-link-2 dashboard-button-9"
                          title="Ver detalhes e programa do curso"
                        >
                          <BookOpen className="dashboard-book-open" />
                          <span>Detalhes</span>
                        </Link>
                        <Link
                          to={`/aprender/${curso.id}`}
                          className="dashboard-link-2 dashboard-button-10"
                          title="Aceder às aulas do curso"
                        >
                          <PlayCircle className="dashboard-play-circle" />
                          <span>Aulas</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cursos recomendados */}
      {recommendedCursos.length > 0 && (
        <div className="dashboard-panel-29">
          <div className="dashboard-panel-30">
            <h2 className="dashboard-heading">Cursos Recomendados para Si</h2>
            <Link
              to="/explorar"
              className="dashboard-link-4"
            >
              Explorar Catálogo
            </Link>
          </div>

          <div className="dashboard-panel-22">
            {recommendedCursos.map((c) => (
              <div
                key={c.id}
                className="dashboard-panel-31"
              >
                <div>
                  <Link
                    to={`/cursos/${c.id}`}
                    className="dashboard-link-6 group/thumb"
                  >
                    <img
                      src={c.urlMiniatura || '/images/curso-sem-capa.svg'}
                      alt={c.title}
                      className="dashboard-image"
                    />
                    <span className="dashboard-label-8">{formatarCategoria(c.category)}</span>
                  </Link>

                  <Link
                    to={`/cursos/${c.id}`}
                    className="dashboard-link-2"
                  >
                    <h3 className="dashboard-subheading-3">{c.title}</h3>
                  </Link>
                  <p className="dashboard-description-7">{c.description}</p>
                </div>

                <div className="dashboard-panel-32">
                  <span className="dashboard-label-9">{formatarCursoPreco(c)}</span>
                  <Link
                    to={`/cursos/${c.id}`}
                    className="dashboard-button-11"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelPagina;
