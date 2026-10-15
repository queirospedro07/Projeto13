import './HelpSupportPage.css';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, LifeBuoy, BookOpen, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { SEO } from '../../components/common/SEO';
import { SupportTickets } from '../../features/support/SupportTickets';

const manual = [
  [
    'Começar a estudar',
    'Explore o catálogo, abra um curso e inscreva-se. Os cursos gratuitos têm inscrição direta; os cursos pagos precisam de acesso concedido pelo formador. Encontra os seus cursos na biblioteca.',
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
  [
    'Pedir ajuda',
    'Abra um pedido com um assunto claro, descreva o problema e indique a página ou o curso. Consulte a resposta no histórico abaixo. Se for administrador, pode responder e resolver os pedidos nessa mesma lista.',
  ],
];
export function HelpSupportPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'manual' ? 'manual' : 'faq';
  const [categories, setCategories] = useState([]),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('all'),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [open, setOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await api.getSupportFaq());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const matches = (text) =>
    text.toLocaleLowerCase('pt-PT').includes(query.toLocaleLowerCase('pt-PT').trim());
  const visible = categories
    .filter((item) => category === 'all' || category === item.category)
    .map((item) => ({
      ...item,
      items: item.items.filter((item) => matches(item.q + ' ' + item.a)),
    }))
    .filter((item) => item.items.length);
  return (
    <>
      <SEO
        title="Ajuda e suporte — NEXO"
        description="Respostas sobre a conta, cursos, avaliações e comunidade. Consulte os seus pedidos de suporte."
      />
      <div className="help-center">
        <header className="help-center-heading">
          <span>
            <LifeBuoy /> CENTRO DE AJUDA
          </span>
          <h1>Como podemos ajudar?</h1>
          <p>Encontre uma resposta ou fale com a equipa através de um pedido de suporte.</p>
          <div className="help-center-actions">
            {user ? (
              <Button onClick={() => setOpen(true)}>Abrir pedido de suporte</Button>
            ) : (
              <Link to="/login">
                Iniciar sessão para pedir ajuda <ArrowUpRight />
              </Link>
            )}
            <Link to="/explore">
              Explorar cursos <ArrowUpRight />
            </Link>
          </div>
        </header>
        <div className="help-center-tabs" role="tablist" aria-label="Conteúdo de ajuda">
          <button
            role="tab"
            aria-selected={tab === 'faq'}
            id="help-faq-tab"
            aria-controls="help-content"
            onClick={() => setParams({ tab: 'faq' })}
          >
            Perguntas frequentes
          </button>
          <button
            role="tab"
            aria-selected={tab === 'manual'}
            id="help-manual-tab"
            aria-controls="help-content"
            onClick={() => setParams({ tab: 'manual' })}
          >
            <BookOpen />
            Guia de utilização
          </button>
        </div>
        <section
          id="help-content"
          role="tabpanel"
          aria-labelledby={tab === 'faq' ? 'help-faq-tab' : 'help-manual-tab'}
        >
          {tab === 'faq' ? (
            <>
              <label className="help-center-search">
                <Search />
                <span className="sr-only">Pesquisar na ajuda</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar por conta, curso, avaliação…"
                />
              </label>
              <div className="help-center-filters">
                <button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
                  Todos os temas
                </button>
                {categories.map((item) => (
                  <button
                    key={item.category}
                    aria-pressed={category === item.category}
                    onClick={() => setCategory(item.category)}
                  >
                    {item.category}
                  </button>
                ))}
              </div>
              {loading ? (
                <p role="status">A carregar as respostas…</p>
              ) : error ? (
                <div role="alert">
                  <p>Não foi possível carregar as perguntas frequentes.</p>
                  <Button variant="outline" onClick={load}>
                    Tentar novamente
                  </Button>
                </div>
              ) : !visible.length ? (
                <p>
                  Não encontrámos uma resposta para esta pesquisa. Experimente outros termos ou abra
                  um pedido de suporte.
                </p>
              ) : (
                visible.map((item) => (
                  <section className="help-center-group" key={item.category}>
                    <h2>{item.category}</h2>
                    <p>{item.description}</p>
                    {item.items.map((item) => (
                      <details key={item.q}>
                        <summary>{item.q}</summary>
                        <p>{item.a}</p>
                      </details>
                    ))}
                  </section>
                ))
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
        <SupportTickets user={user} open={open} onClose={() => setOpen(false)} />
      </div>
    </>
  );
}
export default HelpSupportPage;
