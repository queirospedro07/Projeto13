import './FaqPage.css';
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
import { Button } from '../../components/Button';
import { SEO } from '../../components/SEO';
import { filterFaq } from '../../utils/searchFaq';
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
export function FaqPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'manual' ? 'manual' : 'faq';
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api
      .get('/help/faq')
      .then(({ data }) => data)
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const visible = filterFaq(categories, query, category);
  const resultCount = visible.reduce((count, group) => count + group.items.length, 0);
  const totalQuestions = categories.reduce((count, group) => count + group.items.length, 0);
  const reset = () => {
    setQuery('');
    setCategory('all');
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
            <Link to="/explore">
              Explorar cursos <ArrowUpRight aria-hidden="true" />
            </Link>
            {!loading && !error && (
              <span>
                {totalQuestions} respostas · {categories.length} temas
              </span>
            )}
          </div>
        </header>
        <nav className="help-center-tabs" aria-label="Conteúdo de ajuda">
          <button
            type="button"
            aria-current={tab === 'faq' ? 'page' : undefined}
            onClick={() =>
              setParams({
                tab: 'faq',
              })
            }
          >
            <LifeBuoy aria-hidden="true" />
            Perguntas frequentes
          </button>
          <button
            type="button"
            aria-current={tab === 'manual' ? 'page' : undefined}
            onClick={() =>
              setParams({
                tab: 'manual',
              })
            }
          >
            <BookOpen aria-hidden="true" />
            Guia de utilização
          </button>
        </nav>
        <section aria-label={tab === 'faq' ? 'Perguntas frequentes' : 'Guia de utilização'}>
          {tab === 'faq' ? (
            <>
              <div className="help-center-search" role="search">
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="help-search">
                  Pesquisar nas perguntas e respostas
                </label>
                <input
                  id="help-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pesquise, por exemplo, certificados ou pagamentos"
                  maxLength={160}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Limpar pesquisa">
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="help-center-filters" aria-label="Filtrar por tema">
                <button
                  type="button"
                  aria-pressed={category === 'all'}
                  onClick={() => setCategory('all')}
                >
                  Todos os temas
                </button>
                {categories.map((group) => (
                  <button
                    type="button"
                    key={group.category}
                    aria-pressed={category === group.category}
                    onClick={() => setCategory(group.category)}
                  >
                    {group.category}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="help-center-state" role="status">
                  <BookOpen aria-hidden="true" />
                  <p>A preparar as respostas…</p>
                </div>
              ) : error ? (
                <div className="help-center-state" role="alert">
                  <h2>Não foi possível carregar a ajuda</h2>
                  <p>Verifique a ligação e tente novamente.</p>
                  <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <p className="help-center-count" role="status" aria-live="polite">
                    {resultCount}{' '}
                    {resultCount === 1 ? 'resposta encontrada' : 'respostas encontradas'}
                  </p>
                  {!visible.length ? (
                    <div className="help-center-state">
                      <SearchX aria-hidden="true" />
                      <h2>Ainda não encontrámos essa resposta</h2>
                      <p>Experimente palavras mais curtas ou consulte todos os temas.</p>
                      <Button variant="outline" onClick={reset}>
                        Limpar filtros
                      </Button>
                    </div>
                  ) : (
                    <div className="help-center-groups">
                      {visible.map((group) => (
                        <section className="help-center-group" key={group.category}>
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
              {manual.map(([title, body], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h2>{title}</h2>
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
          <Link to="/explore">
            Ver cursos <ArrowUpRight aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </>
  );
}
export default FaqPage;
