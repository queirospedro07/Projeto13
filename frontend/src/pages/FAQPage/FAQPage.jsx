import './FAQPage.css';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuSearch as Search,
  LuLifeBuoy as LifeBuoy,
  LuBookOpen as BookOpen,
  LuArrowUpRight as ArrowUpRight,
  LuChevronDown as ChevronDown,
  LuX as X,
  LuSearchX as SearchX,
} from 'react-icons/lu';
import { api } from '../../services/api';
import { Botao } from '../../components/Button';
import { SEO } from '../../components/SEO';
import { filtrarPerguntasFrequentes } from '../../utils/helpSearch';

const manual = [
  [
    'Começar a estudar',
    'Explore o catálogo, abra um curso e inscreva-se. Os cursos gratuitos têm inscrição direta; os cursos pagos permitem simular um pagamento sem cobrança real ou obter acesso concedido pelo formador. Encontra os seus cursos na biblioteca.',
  ],
  [
    'Aulas e avaliações',
    'Siga as aulas pela ordem do programa. Envie as respostas aos questionários e, nos projetos, partilhe uma ligação para o trabalho. As respostas abertas e os projetos podem precisar de revisão do formador.',
  ],
  [
    'O seu perfil',
    'Abra Perfil → Editar perfil. Preencha os dados, personalize as imagens e adicione as redes sociais. Consulte a pré-visualização antes de guardar. As opções de privacidade encontram-se nas definições da conta.',
  ],
  [
    'Criar e gerir cursos',
    'As contas de formador podem organizar módulos, aulas, avaliações e canais. A publicação exige aprovação administrativa. No painel do formador, reveja avaliações e projetos ou conceda acesso a alunos por email ou nome de utilizador.',
  ],
];

export function PerguntasFrequentesPagina() {
  const [parametros, definirParametros] = useSearchParams();
  const separador = parametros.get('tab') === 'manual' ? 'manual' : 'faq';
  const [categorias, definirCategorias] = useState([]);
  const [consultar, definirConsultar] = useState('');
  const [categoria, definirCategoria] = useState('all');
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState(false);
  const [revision, definirRevision] = useState(0);

  useEffect(() => {
    let ativo = true;

    definirCarregamento(true);
    definirErro(false);
    api
      .get('/ajuda/faq')
      .then(({ data: dados }) => dados)
      .then((dados) => {
        if (ativo) definirCategorias(dados);
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

  const visible = filtrarPerguntasFrequentes(categorias, consultar, categoria);
  const resultadoContar = visible.reduce((contar, group) => contar + group.items.length, 0);
  const totalPerguntas = categorias.reduce((contar, group) => contar + group.items.length, 0);
  const repor = () => {
    definirConsultar('');
    definirCategoria('all');
  };

  return (
    <>
      <SEO
        title="Perguntas frequentes — NEXO"
        description="Encontre respostas sobre a sua conta, cursos, pagamentos de demonstração, avaliações, certificados e comunidade."
      />
      <div className="help-center">
        <header className="help-center-heading">
          <span className="help-center-eyebrow">
            <LifeBuoy aria-hidden="true" /> CENTRO DE AJUDA
          </span>
          <h1>
            Uma dúvida?
            <br />
            <span>Encontre a resposta.</span>
          </h1>
          <p>
            Da primeira aula ao próximo curso. Tudo o que precisa de saber para aproveitar a NEXO.
          </p>
          <div className="help-center-actions">
            <Link to="/explorar">
              Explorar cursos <ArrowUpRight aria-hidden="true" />
            </Link>
            {!carregamento && !erro && (
              <span>
                {totalPerguntas} respostas · {categorias.length} temas
              </span>
            )}
          </div>
        </header>
        <nav
          className="help-center-tabs"
          aria-label="Conteúdo de ajuda"
        >
          <button
            type="button"
            aria-current={separador === 'faq' ? 'page' : undefined}
            onClick={() =>
              definirParametros({
                tab: 'faq',
              })
            }
          >
            <LifeBuoy aria-hidden="true" />
            Perguntas frequentes
          </button>
          <button
            type="button"
            aria-current={separador === 'manual' ? 'page' : undefined}
            onClick={() =>
              definirParametros({
                tab: 'manual',
              })
            }
          >
            <BookOpen aria-hidden="true" />
            Guia de utilização
          </button>
        </nav>
        <section aria-label={separador === 'faq' ? 'Perguntas frequentes' : 'Guia de utilização'}>
          {separador === 'faq' ? (
            <>
              <div
                className="help-center-search"
                role="search"
              >
                <Search aria-hidden="true" />
                <label
                  className="sr-only"
                  htmlFor="help-search"
                >
                  Pesquisar nas perguntas e respostas
                </label>
                <input
                  id="help-search"
                  type="search"
                  value={consultar}
                  onChange={(evento) => definirConsultar(evento.target.value)}
                  placeholder="Pesquise, por exemplo, certificados ou pagamentos"
                  maxLength={160}
                />
                {consultar && (
                  <button
                    type="button"
                    onClick={() => definirConsultar('')}
                    aria-label="Limpar pesquisa"
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>
              <div
                className="help-center-filters"
                aria-label="Filtrar por tema"
              >
                <button
                  type="button"
                  aria-pressed={categoria === 'all'}
                  onClick={() => definirCategoria('all')}
                >
                  Todos os temas
                </button>
                {categorias.map((group) => (
                  <button
                    type="button"
                    key={group.category}
                    aria-pressed={categoria === group.category}
                    onClick={() => definirCategoria(group.category)}
                  >
                    {group.category}
                  </button>
                ))}
              </div>
              {carregamento ? (
                <div
                  className="help-center-state"
                  role="status"
                >
                  <BookOpen aria-hidden="true" />
                  <p>A preparar as respostas…</p>
                </div>
              ) : erro ? (
                <div
                  className="help-center-state"
                  role="alert"
                >
                  <h2>Não foi possível carregar a ajuda</h2>
                  <p>Verifique a ligação e tente novamente.</p>
                  <Botao
                    variant="outline"
                    onClick={() => definirRevision((valor) => valor + 1)}
                  >
                    Tentar novamente
                  </Botao>
                </div>
              ) : (
                <>
                  <p
                    className="help-center-count"
                    role="status"
                    aria-live="polite"
                  >
                    {resultadoContar}{' '}
                    {resultadoContar === 1 ? 'resposta encontrada' : 'respostas encontradas'}
                  </p>
                  {!visible.length ? (
                    <div className="help-center-state">
                      <SearchX aria-hidden="true" />
                      <h2>Ainda não encontrámos essa resposta</h2>
                      <p>Experimente palavras mais curtas ou consulte todos os temas.</p>
                      <Botao
                        variant="outline"
                        onClick={repor}
                      >
                        Limpar filtros
                      </Botao>
                    </div>
                  ) : (
                    <div className="help-center-groups">
                      {visible.map((group) => (
                        <section
                          className="help-center-group"
                          key={group.category}
                        >
                          <header>
                            <h2>{group.category}</h2>
                            <p>{group.description}</p>
                          </header>
                          <div className="help-center-questions">
                            {group.items.map((item) => (
                              <details key={item.q}>
                                <summary>
                                  <span>{item.q}</span>
                                  <ChevronDown aria-hidden="true" />
                                </summary>
                                <div className="help-center-answer">
                                  <p>{item.a}</p>
                                </div>
                              </details>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="help-center-guide">
              {manual.map(([titulo, body], indice) => (
                <article key={titulo}>
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  <div>
                    <h2>{titulo}</h2>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <footer className="help-center-footer">
          <BookOpen aria-hidden="true" />
          <div>
            <h2>O próximo passo é seu.</h2>
            <p>Explore o catálogo e encontre algo novo para aprender.</p>
          </div>
          <Link to="/explorar">
            Ver cursos <ArrowUpRight aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </>
  );
}

export default PerguntasFrequentesPagina;
