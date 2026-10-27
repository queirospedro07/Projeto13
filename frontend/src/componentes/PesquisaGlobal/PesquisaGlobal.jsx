import './PesquisaGlobal.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuSearch as Search,
  LuBookOpen as BookOpen,
  LuUser as Utilizador,
  LuX as X,
  LuArrowRight as ArrowRight,
  LuLoaderCircle as Loader2,
  LuMessageSquare as MessageSquare,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { api } from '../../servicos/api';
import { formatarCursoPreco } from '../../utilitarios/formatacao';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';

export const PesquisaGlobal = ({ onClose: onFechar } = {}) => {
  const { user: utilizador } = useAutenticacao();
  const [consultar, definirConsultar] = useState('');
  const [isAbrir, definirIsAbrir] = useState(false);
  const [carregamento, definirCarregamento] = useState(false);
  const [cursos, definirCursos] = useState([]);
  const [utilizadores, definirUtilizadores] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tratarClickOutside = (evento) => {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        definirIsAbrir(false);
      }
    };

    document.addEventListener('mousedown', tratarClickOutside);

    return () => document.removeEventListener('mousedown', tratarClickOutside);
  }, []);
  useEffect(() => {
    if (!consultar.trim()) {
      definirCursos([]);
      definirUtilizadores([]);
      definirIsAbrir(false);

      return;
    }

    const timer = setTimeout(async () => {
      definirCarregamento(true);
      try {
        const [cursosResposta, utilizadoresResposta] = await Promise.allSettled([
          api
            .get('/cursos', {
              params: {
                search: consultar.trim(),
              },
            })
            .then(({ data: dados }) => dados),
          api
            .get(
              `/social/utilizadores/pesquisar?query=${encodeURIComponent(consultar.trim() === undefined ? '' : consultar.trim())}`,
            )
            .then(({ data: dados }) => dados),
        ]);
        const foundCursos =
          cursosResposta.status === 'fulfilled' && Array.isArray(cursosResposta.value)
            ? cursosResposta.value.slice(0, 4)
            : [];
        const foundUtilizadores =
          utilizadoresResposta.status === 'fulfilled' && Array.isArray(utilizadoresResposta.value)
            ? utilizadoresResposta.value.slice(0, 4)
            : [];

        definirCursos(foundCursos);
        definirUtilizadores(foundUtilizadores);
        definirIsAbrir(true);
      } catch {
      } finally {
        definirCarregamento(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [consultar]);
  if (!utilizador) return null;
  const tratarSubmeter = (evento) => {
    evento.preventDefault();
    if (!consultar.trim()) return;
    definirIsAbrir(false);
    onFechar?.();
    navigate(`/search?q=${encodeURIComponent(consultar.trim())}`);
  };

  const tratarSelecionarCurso = (curso) => {
    definirIsAbrir(false);
    definirConsultar('');
    onFechar?.();
    navigate(`/cursos/${curso.id || curso.slug}`);
  };

  const tratarSelecionarUtilizador = (utilizador2) => {
    definirIsAbrir(false);
    definirConsultar('');
    onFechar?.();
    navigate(`/perfil/${utilizador2.username}`);
  };

  const temResultados = cursos.length > 0 || utilizadores.length > 0;

  return (
    <div
      ref={containerRef}
      className="global-search-panel"
    >
      <form
        onSubmit={tratarSubmeter}
        className="global-search-form"
      >
        <Search className="global-search-search" />
        <input
          type="text"
          placeholder="Pesquisar cursos e pessoas..."
          value={consultar}
          onFocus={() => {
            if (consultar.trim() && temResultados) definirIsAbrir(true);
          }}
          onChange={(evento) => definirConsultar(evento.target.value)}
          className="global-search-field"
        />
        {consultar && (
          <button
            type="button"
            onClick={() => {
              definirConsultar('');
              definirIsAbrir(false);
            }}
            className="global-search-button"
          >
            {carregamento ? (
              <Loader2 className="global-search-loader2" />
            ) : (
              <X className="global-search-x" />
            )}
          </button>
        )}
      </form>

      {isAbrir && (
        <div className="global-search-panel-2">
          {!temResultados && !carregamento && (
            <div className="global-search-panel-3">
              Nenhum resultado encontrado para "{consultar}"
            </div>
          )}

          {cursos.length > 0 && (
            <div className="global-search-panel-4">
              <div className="global-search-panel-5">
                <BookOpen className="global-search-book-open" />
                <span>Cursos</span>
              </div>
              <div className="global-search-panel-6">
                {cursos.map((curso) => (
                  <button
                    key={curso.id || curso.slug}
                    type="button"
                    onClick={() => tratarSelecionarCurso(curso)}
                    className="global-search-button-2 ui-group"
                  >
                    <div className="global-search-panel-7">
                      {curso.urlMiniatura ? (
                        <img
                          src={curso.urlMiniatura}
                          alt={curso.title}
                          className="global-search-image"
                        />
                      ) : (
                        <div className="global-search-panel-8">
                          <BookOpen className="global-search-book-open-2" />
                        </div>
                      )}
                    </div>
                    <div className="global-search-panel-9">
                      <p className="global-search-description">{curso.title}</p>
                      <p className="global-search-description-2">
                        {curso.category} •{' '}
                        {curso.difficulty === 'Beginner'
                          ? 'Iniciante'
                          : curso.difficulty === 'Intermediate'
                            ? 'Intermédio'
                            : curso.difficulty === 'Advanced'
                              ? 'Avançado'
                              : curso.difficulty || 'Geral'}
                      </p>
                    </div>
                    <span className="global-search-label">{formatarCursoPreco(curso)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {utilizadores.length > 0 && (
            <div className="global-search-panel-10">
              <div className="global-search-panel-5">
                <Utilizador className="global-search-user" />
                <span>Pessoas</span>
              </div>
              <div className="global-search-panel-6">
                {utilizadores.map((u) => (
                  <div
                    key={u.id || u.username}
                    onClick={() => tratarSelecionarUtilizador(u)}
                    className="global-search-panel-11 ui-group"
                  >
                    <div className="global-search-panel-12">
                      <Avatar
                        src={u.urlAvatar}
                        name={u.name}
                        role={u.role}
                        size="sm"
                      />
                      <div className="global-search-panel-9">
                        <p className="global-search-description-3">{u.name}</p>
                        <p className="global-search-description-2">
                          @{u.username} •{' '}
                          {u.role === 'CREATOR'
                            ? 'Formador'
                            : u.role === 'ADMIN'
                              ? 'Administrador'
                              : 'Estudante'}
                        </p>
                      </div>
                    </div>
                    <div className="global-search-panel-13">
                      <button
                        type="button"
                        onClick={(evento) => {
                          evento.stopPropagation();
                          definirIsAbrir(false);
                          definirConsultar('');
                          onFechar?.();
                          navigate(`/messages?idUtilizador=${u.id}`, {
                            state: {
                              peer: u,
                            },
                          });
                        }}
                        className="global-search-button-3"
                        title="Enviar mensagem direta"
                      >
                        <MessageSquare className="global-search-x" />
                      </button>
                      <ArrowRight className="global-search-arrow-right" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {temResultados && (
            <div className="global-search-panel-14">
              <button
                type="button"
                onClick={tratarSubmeter}
                className="global-search-button-4"
              >
                Ver todos os resultados para "{consultar}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PesquisaGlobal;
