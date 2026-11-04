import { LuArrowRight as ArrowRight } from 'react-icons/lu';
import { CartaoCurso } from '../../components/CourseCard/CourseCard';
import './SearchResultsPage.css';
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { LuSearch as Search, LuBookOpen as BookOpen, LuUser as Utilizador } from 'react-icons/lu';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';
import { formatarCargo } from '../../utils/formatting';
import { useAutenticacao } from '../../contexts/AuthContext';

export const PesquisarResultadosPagina = () => {
  const { user: utilizador, isLoading: isCarregamento } = useAutenticacao();
  const localizacao = useLocation();
  const [pesquisarParametros, definirPesquisarParametros] = useSearchParams();
  const rawConsultar = (pesquisarParametros.get('q') || '').trim();
  const [consultar, definirConsultar] = useState(rawConsultar);
  const [cursos, definirCursos] = useState([]);
  const [utilizadores, definirUtilizadores] = useState([]);
  const [carregamento, definirCarregamento] = useState(false);

  useEffect(() => {
    definirConsultar(rawConsultar);
  }, [rawConsultar]);
  useEffect(() => {
    if (!rawConsultar) {
      definirCursos([]);
      definirUtilizadores([]);

      return;
    }

    let isMounted = true;

    definirCarregamento(true);
    Promise.allSettled([
      api
        .get('/cursos', {
          params: {
            search: rawConsultar,
          },
        })
        .then(({ data: dados }) => dados),
      api
        .get(
          `/social/utilizadores/pesquisar?query=${encodeURIComponent(rawConsultar === undefined ? '' : rawConsultar)}`,
        )
        .then(({ data: dados }) => dados),
    ])
      .then(([cursosResultado, utilizadoresResultado]) => {
        if (!isMounted) return;
        const seguinteCursos =
          cursosResultado.status === 'fulfilled' && Array.isArray(cursosResultado.value)
            ? cursosResultado.value
            : [];
        const seguinteUtilizadores =
          utilizadoresResultado.status === 'fulfilled' && Array.isArray(utilizadoresResultado.value)
            ? utilizadoresResultado.value
            : [];

        definirCursos(seguinteCursos);
        definirUtilizadores(seguinteUtilizadores);
      })
      .catch(() => {
        if (isMounted) {
          definirCursos([]);
          definirUtilizadores([]);
        }
      })
      .finally(() => {
        if (isMounted) definirCarregamento(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawConsultar]);

  const tratarSubmeter = (evento) => {
    evento.preventDefault();

    const trimmed = consultar.trim();
    if (!trimmed) return;
    definirPesquisarParametros({
      q: trimmed,
    });
  };

  if (isCarregamento) {
    return (
      <div className="search-results-page-panel">
        <div className="search-results-page-panel-2" />
        <p className="search-results-page-description">A verificar sessão...</p>
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

  return (
    <div className="search-results-page-panel-3">
      <div className="search-results-page-panel-4">
        <form
          onSubmit={tratarSubmeter}
          className="search-results-page-form"
        >
          <div className="search-results-page-panel-5">
            <Search className="search-results-page-search" />
            <input
              type="text"
              value={consultar}
              onChange={(evento) => definirConsultar(evento.target.value)}
              placeholder="Pesquisar cursos e utilizadores..."
              className="search-results-page-field"
            />
          </div>
          <button
            type="submit"
            disabled={!consultar.trim()}
            className="search-results-page-button"
          >
            Pesquisar
          </button>
        </form>
      </div>

      {!rawConsultar ? (
        <div className="search-results-page-panel-6">
          <Search className="search-results-page-search-2" />
          <h2 className="search-results-page-heading">Procure cursos ou pessoas</h2>
          <p className="search-results-page-description-2">
            Introduza um termo na pesquisa para ver todos os resultados.
          </p>
        </div>
      ) : carregamento ? (
        <div className="search-results-page-panel-7">
          <div className="search-results-page-panel-8">
            <div className="search-results-page-panel-9" />
            <div className="search-results-page-panel-10">
              {Array.from({
                length: 4,
              }).map((_, indice) => (
                <div
                  key={indice}
                  className="search-results-page-panel-11"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="search-results-page-panel-12">
            <div>
              <h1 className="search-results-page-title">Resultados da pesquisa</h1>
              <p className="search-results-page-description-3">
                Procurou por <span className="search-results-page-label">"{rawConsultar}"</span>
              </p>
            </div>
            <span className="search-results-page-label-2">
              {cursos.length + utilizadores.length} resultados
            </span>
          </div>

          <div className="search-results-page-panel-13">
            <section>
              <div className="search-results-page-panel-14">
                <BookOpen className="search-results-page-book-open" />
                <h2 className="search-results-page-heading-2">Cursos</h2>
                <span className="search-results-page-label-3">({cursos.length})</span>
              </div>

              {cursos.length === 0 ? (
                <div className="search-results-page-panel-15">
                  Nenhum curso encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="search-results-page-panel-16">
                  {cursos.map((curso) => (
                    <CartaoCurso
                      key={curso.id || curso.slug}
                      curso={curso}
                      utilizador={utilizador}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="search-results-page-panel-14">
                <Utilizador className="search-results-page-user" />
                <h2 className="search-results-page-heading-2">Utilizadores</h2>
                <span className="search-results-page-label-3">({utilizadores.length})</span>
              </div>

              {utilizadores.length === 0 ? (
                <div className="search-results-page-panel-15">
                  Nenhum utilizador encontrado para esta pesquisa.
                </div>
              ) : (
                <div className="search-results-page-panel-23">
                  {utilizadores.map((utilizador2) => (
                    <div
                      key={utilizador2.id || utilizador2.username}
                      className="search-results-page-panel-24"
                    >
                      <div className="search-results-page-panel-25">
                        <Avatar
                          src={utilizador2.urlAvatar}
                          name={utilizador2.name}
                          role={utilizador2.role}
                          size="md"
                        />
                        <div className="search-results-page-panel-26">
                          <p className="search-results-page-description-5">{utilizador2.name}</p>
                          <p className="search-results-page-description-6">
                            @{utilizador2.username}
                          </p>
                          <span className="search-results-page-label-6">
                            {formatarCargo(utilizador2.role)}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/perfil/${utilizador2.username}`}
                        className="search-results-page-link-6"
                      >
                        Ver perfil
                        <ArrowRight className="search-results-page-graduation-cap" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default PesquisarResultadosPagina;
