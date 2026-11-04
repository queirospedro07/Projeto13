import '../../styles/editor-management.css';
import { publicationLabels } from '../../constants/coursePublishing';
import { PaginaEstado } from '../../components/StatusPage';
import { CursoParecer } from '../../components/CourseReview/CourseReview';
import { CursoAcessoGestor } from '../../components/InstructorTools';
import './InstructorDashboardPage.css';
import '../../styles/management.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuUsers as Users,
  LuBookOpen as BookOpen,
  LuCirclePlus as PlusCircle,
  LuEye as Eye,
  LuTrash2 as Trash2,
} from 'react-icons/lu';
import { api } from '../../services/api';
import { formatarCursoPreco, formatarCategoria } from '../../utils/formatting';

export const FormadorPainelPagina = () => {
  const [estatisticas, definirEstatisticas] = useState(null);
  const [cursos, definirCursos] = useState([]);
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState(false);
  const [revision, definirRevision] = useState(0);
  const [deletingCursoId, definirDeletingCursoId] = useState(null);

  useEffect(() => {
    let ativo = true;

    definirCarregamento(true);
    definirErro(false);
    Promise.all([
      api.get('/formador/estatisticas').then(({ data: dados }) => dados),
      api.get('/formador/cursos').then(({ data: dados }) => dados),
    ])
      .then(([estatisticasDados, cursosDados]) => {
        if (ativo) {
          definirEstatisticas(estatisticasDados);
          definirCursos(cursosDados || []);
        }
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
  }, [revision]);

  const totalAlunos =
    estatisticas?.totalStudents || cursos.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);
  const tratarEliminarCurso = async (curso) => {
    const confirmed = window.confirm(
      `Tem a certeza de que pretende eliminar "${curso.title}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    definirDeletingCursoId(curso.id);
    try {
      await api.delete(`/formador/cursos/${curso.id}`).then(({ data: dados }) => dados);
      definirCursos((atualCursos) => atualCursos.filter((item) => item.id !== curso.id));
    } catch (erro2) {
      window.alert(`Não foi possível eliminar o curso: ${erro2.message}`);
    } finally {
      definirDeletingCursoId(null);
    }
  };

  if (carregamento)
    return (
      <PaginaEstado
        loading
        title="A preparar o seu estúdio…"
      />
    );
  if (erro)
    return (
      <PaginaEstado
        title="Não foi possível carregar os cursos"
        message="Verifique a ligação e tente novamente. Os seus cursos continuam guardados."
        onRetry={() => definirRevision((valor) => valor + 1)}
      />
    );

  return (
    <div className="creator-dashboard-panel area-gestao area-formador">
      <div className="creator-dashboard-panel-2">
        <div>
          <h1 className="creator-dashboard-title">Os meus cursos</h1>
          <p className="creator-dashboard-description">
            Consulte os cursos e acompanhe as inscrições.
          </p>
        </div>

        <div className="creator-dashboard-panel-3">
          <Link
            to="/formador/avaliacoes"
            className="creator-dashboard-button"
          >
            <BookOpen className="creator-dashboard-users" />
            <span>Avaliar trabalhos</span>
          </Link>
          <Link
            to="/formador/membros"
            className="creator-dashboard-button"
          >
            <Users className="creator-dashboard-users" />
            <span>Alunos</span>
          </Link>
          <Link
            to="/formador/cursos/novo"
            className="creator-dashboard-button-2"
          >
            <PlusCircle className="creator-dashboard-plus-circle" />
            <span>Criar curso</span>
          </Link>
        </div>
      </div>

      <dl
        className="gestao-metricas"
        aria-label="Resumo dos cursos"
      >
        <div>
          <dt>Cursos</dt>
          <dd>{cursos.length}</dd>
        </div>
        <div>
          <dt>Alunos inscritos</dt>
          <dd>{totalAlunos}</dd>
        </div>
        <div>
          <dt>Receita simulada</dt>
          <dd>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
              (estatisticas?.totalRevenueCents ?? 0) / 100,
            )}
          </dd>
        </div>
      </dl>

      <div className="creator-dashboard-panel-9">
        <div className="creator-dashboard-panel-10">
          <div>
            <h2 className="creator-dashboard-heading">Cursos ({cursos.length})</h2>
            <p className="creator-dashboard-description-5">
              Consulte o estado de publicação e edite os conteúdos.
            </p>
          </div>
        </div>

        <div className="creator-dashboard-panel-11">
          {cursos.length === 0 ? (
            <div className="creator-dashboard-panel-12">
              <div className="creator-dashboard-panel-13">
                <BookOpen className="creator-dashboard-dollar-sign" />
              </div>
              <h4 className="creator-dashboard-caption">Ainda não tem cursos criados</h4>
              <p className="creator-dashboard-description-6">
                Crie um curso e organize os conteúdos por módulos e aulas.
              </p>
              <Link
                to="/formador/cursos/novo"
                className="creator-dashboard-button-4"
              >
                Criar curso
              </Link>
            </div>
          ) : (
            <div className="creator-dashboard-panel-14">
              {cursos.map((curso) => (
                <div
                  key={curso.id}
                  className="creator-dashboard-panel-15"
                >
                  <div className="creator-dashboard-panel-16">
                    {curso.urlMiniatura ? (
                      <img
                        src={curso.urlMiniatura}
                        alt=""
                        className="creator-dashboard-image"
                      />
                    ) : (
                      <div
                        className="creator-dashboard-image course-cover-empty"
                        aria-hidden="true"
                      >
                        <BookOpen />
                      </div>
                    )}
                    <div className="creator-dashboard-panel-17">
                      <h4 className="creator-dashboard-caption-2">{curso.title}</h4>
                      <div className="creator-dashboard-panel-18">
                        <span className="creator-dashboard-label-2">
                          {formatarCategoria(curso.category)}
                        </span>
                        <span
                          className={`creator-dashboard-label-3 ${curso.estaPublicado ? 'creator-dashboard-label-4' : 'creator-dashboard-label-5'}`}
                        >
                          {publicationLabels[curso.estadoAprovacao] || 'Rascunho'}
                        </span>
                        <span>•</span>
                        <span>{curso._count?.enrollments || 0} alunos inscritos</span>
                        <span>•</span>
                        <span className="creator-dashboard-label-6">
                          {formatarCursoPreco(curso)}
                        </span>
                      </div>
                      {(curso.notasAdministracao || curso.estadoAprovacao === 'REJECTED') && (
                        <CursoParecer course={curso} />
                      )}
                    </div>
                  </div>

                  <div className="creator-dashboard-panel-19">
                    <Link
                      to={`/aprender/${curso.id}`}
                      className="creator-dashboard-button-5"
                    >
                      <Eye className="creator-dashboard-eye" />
                      <span>Ver</span>
                    </Link>
                    <Link
                      to={`/formador/cursos/${curso.id}/editar`}
                      className="creator-dashboard-button-6"
                    >
                      <BookOpen className="creator-dashboard-eye" />
                      <span>Editar</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => tratarEliminarCurso(curso)}
                      disabled={deletingCursoId === curso.id}
                      aria-label={`Eliminar curso ${curso.title}`}
                      title="Eliminar curso"
                      className="creator-dashboard-button-7"
                    >
                      <Trash2 className="creator-dashboard-trash2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CursoAcessoGestor />
    </div>
  );
};

export default FormadorPainelPagina;
