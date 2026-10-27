import { CartaoCurso } from '../../componentes/CartaoCurso/CartaoCurso';
import { Seletor } from '../../componentes/Seletor';

import './DescobrirEspacosPagina.css';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LuUsers as Users,
  LuBookOpen as BookOpen,
  LuMessageSquare as MessageSquare,
  LuPlus as Plus,
  LuSearch as Search,
  LuArrowRight as ArrowRight,
  LuCheck as Check,
  LuStar as Star,
  LuGraduationCap as GraduationCap,
} from 'react-icons/lu';
import { Botao } from '../../componentes/Botao';
import { Avatar } from '../../componentes/Avatar';

import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { CursoInscreverJanela } from '../../componentes/CursoInscreverJanela';
import { api } from '../../servicos/api';

export const DescobrirEspacosPagina = () => {
  const { user: utilizador } = useAutenticacao();
  const [espacos, definirEspacos] = useState([]);
  const [carregamento, definirCarregamento] = useState(true);
  const [enrollingCurso, definirEnrollingCurso] = useState(null);
  const [selecionadoCategoria, definirSelecionadoCategoria] = useState('all');
  const [precoFiltrar, definirPrecoFiltrar] = useState('all');
  const [formatarFiltrar, definirFormatarFiltrar] = useState('all');
  const [pesquisar, definirPesquisar] = useState('');

  const categorias = [
    {
      id: 'all',
      label: 'Todas as Categorias',
    },
    {
      id: 'programming',
      label: 'Programação',
    },
    {
      id: 'design',
      label: 'Design & Criatividade',
    },
    {
      id: 'ai',
      label: 'IA & Dados',
    },
    {
      id: 'cloud',
      label: 'Cloud & DevOps',
    },
    {
      id: 'cybersecurity',
      label: 'Cibersegurança',
    },
  ];
  const carregarEspacos = useCallback(
    async (silent = false) => {
      if (!silent) definirCarregamento(true);
      try {
        const parametros = {};
        if (selecionadoCategoria !== 'all') parametros.category = selecionadoCategoria;
        if (pesquisar) parametros.search = pesquisar;
        const dados = await api
          .get('/cursos', {
            params: parametros,
          })
          .then(({ data: dados2 }) => dados2);

        definirEspacos(dados || []);
      } catch (erro) {
        console.error('Erro ao carregar catálogo de cursos:', erro);
      } finally {
        if (!silent) definirCarregamento(false);
      }
    },
    [selecionadoCategoria, pesquisar],
  );

  useEffect(() => {
    carregarEspacos();
  }, [selecionadoCategoria, utilizador?.id]);
  useEffect(() => {
    const tratarVisibilidadeOrInscricaoAlterar = () => {
      carregarEspacos(true);
    };

    window.addEventListener(
      'nexo_courses_visibility_changed',
      tratarVisibilidadeOrInscricaoAlterar,
    );

    return () => {
      window.removeEventListener(
        'nexo_courses_visibility_changed',
        tratarVisibilidadeOrInscricaoAlterar,
      );
    };
  }, [carregarEspacos]);

  const filteredEspacos = espacos.filter((espaco) => {
    const isGratuito =
      espaco.eGratuito || espaco.price === 0 || espaco.price === null || espaco.price === undefined;
    if (precoFiltrar === 'free' && !isGratuito) return false;
    if (precoFiltrar === 'paid' && isGratuito) return false;
    const temCommunity = Boolean(
      espaco.idEspaco || (espaco.channelsCount && espaco.channelsCount > 0),
    );
    if (formatarFiltrar === 'community' && !temCommunity) return false;
    if (formatarFiltrar === 'self-paced' && temCommunity) return false;

    return true;
  });

  return (
    <div className="discover-spaces-panel">
      <div className="discover-spaces-panel-2">
        <div>
          <h1 className="discover-spaces-title">Catálogo de cursos</h1>
          <p className="discover-spaces-description">
            Cursos estruturados com opção de comunidade interativa ou auto-estudo individual.
          </p>
        </div>

        {utilizador?.role === 'CREATOR' || utilizador?.role === 'ADMIN' ? (
          <Link to="/formador/cursos/novo">
            <Botao
              as="span"
              variant="primary"
              size="md"
              leftIcon={<Plus className="discover-spaces-plus" />}
              className="discover-spaces-button"
            >
              Criar um Curso
            </Botao>
          </Link>
        ) : (
          <Link to="/formador/candidatar">
            <Botao
              as="span"
              variant="secondary"
              size="md"
              leftIcon={<GraduationCap className="discover-spaces-plus" />}
              className="discover-spaces-button"
            >
              Tornar-se Formador
            </Botao>
          </Link>
        )}
      </div>

      <div className="discover-spaces-panel-4">
        <div className="discover-spaces-panel-5">
          <div className="discover-spaces-panel-6">
            <Search className="discover-spaces-search" />
            <input
              type="text"
              placeholder="Pesquisar cursos por nome, tópico ou tecnologia..."
              value={pesquisar}
              onChange={(evento) => definirPesquisar(evento.target.value)}
              onKeyDown={(evento) => evento.key === 'Enter' && carregarEspacos()}
              className="discover-spaces-field"
            />
          </div>

          <div className="discover-spaces-panel-7">
            <label className="catalogo-filtro">
              Formato
              <Seletor
                value={formatarFiltrar}
                onChange={(evento) => definirFormatarFiltrar(evento.target.value)}
              >
                <option value="all">Todos os formatos</option>
                <option value="community">Com comunidade</option>
                <option value="self-paced">Estudo individual</option>
              </Seletor>
            </label>
            <label className="catalogo-filtro">
              Preço
              <Seletor
                value={precoFiltrar}
                onChange={(evento) => definirPrecoFiltrar(evento.target.value)}
              >
                <option value="all">Todos os preços</option>
                <option value="free">Gratuitos</option>
                <option value="paid">Pagos</option>
              </Seletor>
            </label>
          </div>
        </div>

        <div className="discover-spaces-panel-9 custom-scrollbar">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => definirSelecionadoCategoria(cat.id)}
              className={`discover-spaces-button-6 ${selecionadoCategoria === cat.id ? 'discover-spaces-button-3' : 'discover-spaces-button-7'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {carregamento ? (
        <div className="discover-spaces-panel-10">
          <div className="discover-spaces-panel-11" />
          <p className="discover-spaces-description-2">A carregar catálogo de cursos...</p>
        </div>
      ) : filteredEspacos.length === 0 ? (
        <div className="discover-spaces-panel-12">
          <div className="discover-spaces-panel-13">
            <BookOpen className="discover-spaces-book-open" />
          </div>
          <h3 className="discover-spaces-subheading">Nenhum curso encontrado</h3>
          <p className="discover-spaces-description-3">
            Tente pesquisar por outros termos ou ajustar os filtros.
          </p>
          <Botao
            variant="secondary"
            onClick={() => {
              definirSelecionadoCategoria('all');
              definirPrecoFiltrar('all');
              definirFormatarFiltrar('all');
              definirPesquisar('');
            }}
          >
            Limpar Filtros
          </Botao>
        </div>
      ) : (
        <div className="discover-spaces-panel-14">
          {filteredEspacos.map((espaco) => (
            <CartaoCurso
              key={espaco.id}
              curso={{
                ...espaco,
                title: espaco.title || espaco.name,
                urlMiniatura: espaco.urlMiniatura || espaco.urlCapa,
              }}
              utilizador={utilizador}
              onEntrar={definirEnrollingCurso}
            />
          ))}
        </div>
      )}

      {/* Janela de confirmação de matrícula / compra */}
      <CursoInscreverJanela
        isOpen={Boolean(enrollingCurso)}
        course={enrollingCurso}
        isSpace={false}
        onClose={() => definirEnrollingCurso(null)}
        onEnrollSuccess={(enrolledCursoId) => {
          if (enrolledCursoId) {
            definirEspacos((anterior) =>
              anterior.map((s) =>
                s.id === enrolledCursoId || s.slug === enrolledCursoId
                  ? {
                      ...s,
                      isMember: true,
                      isEnrolled: true,
                      membersCount: (s.membersCount || 0) + 1,
                    }
                  : s,
              ),
            );
          }

          carregarEspacos(true);
        }}
      />
    </div>
  );
};

export default DescobrirEspacosPagina;
