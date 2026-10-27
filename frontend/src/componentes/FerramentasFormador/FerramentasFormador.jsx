import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../servicos/api';
import { Botao } from '../Botao';
import { Seletor } from '../Seletor';
import { seguroExternoUrl } from '../../utilitarios/urlSegura';
import './FerramentasFormador.css';

export function ReverFila() {
  const [kind, definirKind] = useState('all');
  const [cursoFiltrar, definirCursoFiltrar] = useState('all');
  const [pesquisar, definirPesquisar] = useState('');
  const [itens, definirItens] = useState([]);
  const [cursoCatalog, definirCursoCatalog] = useState([]);
  const [erro, definirErro] = useState('');
  const [busy, definirBusy] = useState(true);
  const [scores, definirScores] = useState({});
  const [parecer, definirParecer] = useState({});
  const carregar = async () => {
    definirBusy(true);
    definirErro('');
    try {
      const [questionarios, projetos, catalog] = await Promise.all([
        api.get('/questionarios/avaliacoes').then(({ data: dados }) => dados),
        api.get('/projetos/avaliacoes').then(({ data: dados }) => dados),
        api
          .get('/formador/cursos')
          .then(({ data: dados }) => dados)
          .catch(() => []),
      ]);

      definirCursoCatalog((anterior) => (catalog.length ? catalog : anterior));
      definirItens([
        ...questionarios.map((q) => ({
          ...q,
          kind: 'quiz',
        })),
        ...projetos.map((p) => ({
          ...p,
          kind: 'project',
        })),
      ]);
    } catch (evento) {
      definirErro(evento.message);
    } finally {
      definirBusy(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const rever = async (item, estado) => {
    if (busy) return;
    definirBusy(true);
    definirErro('');
    try {
      if (item.kind === 'quiz') {
        const pontuacao = Number(scores[item.id]);
        if (
          String(scores[item.id] ?? '').trim() === '' ||
          !Number.isInteger(pontuacao) ||
          pontuacao < 0 ||
          pontuacao > 100
        )
          throw new Error('Introduza uma nota entre 0 e 100.');
        await api
          .put(`/questionarios/avaliacoes/${item.id}`, {
            score: pontuacao,
          })
          .then(({ data: dados }) => dados);
      } else {
        if (estado === 'CHANGES_REQUESTED' && !parecer[item.id]?.trim())
          throw new Error('Escreva o feedback com as alterações necessárias.');
        await api
          .put(`/projetos/avaliacoes/${item.id}`, {
            status: estado,
            feedback: parecer[item.id] || '',
          })
          .then(({ data: dados }) => dados);
      }

      await carregar();
    } catch (evento) {
      definirErro(evento.message);
      definirBusy(false);
    }
  };

  const normalizar = (valor) =>
    String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filtered = itens.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      (cursoFiltrar === 'all' || item.idCurso === cursoFiltrar) &&
      normalizar(`${item.studentName} ${item.lessonTitle} ${item.tituloCurso}`).includes(
        normalizar(pesquisar),
      ),
  );
  const cursos = [
    ...new Map([
      ...itens.map((item) => [item.idCurso, item.tituloCurso || 'Curso']),
      ...cursoCatalog.map((curso) => [curso.id, curso.title]),
    ]).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], 'pt'));
  const cursoOpcoes =
    cursos.some(([id]) => id === cursoFiltrar) || cursoFiltrar === 'all'
      ? cursos
      : [...cursos, [cursoFiltrar, 'Curso selecionado']];

  return (
    <section className="creator-tool fila-avaliacoes">
      <header>
        <div>
          <h2>Trabalhos para rever</h2>
          <p>Respostas de desenvolvimento e projetos dos seus alunos.</p>
        </div>
        <Botao
          variant="outline"
          size="sm"
          onClick={carregar}
          disabled={busy}
        >
          Atualizar
        </Botao>
      </header>
      <div className="creator-review-filters">
        <label
          htmlFor="review-course"
          className="creator-review-course-filter"
        >
          Curso a avaliar
          <Seletor
            id="review-course"
            value={cursoFiltrar}
            onChange={(evento) => definirCursoFiltrar(evento.target.value)}
          >
            <option value="all">Todos os cursos</option>
            {cursoOpcoes.map(([id, titulo]) => (
              <option
                key={id}
                value={id}
              >
                {titulo}
              </option>
            ))}
          </Seletor>
        </label>
        <label htmlFor="review-search">
          Pesquisar aluno ou trabalho
          <input
            id="review-search"
            type="search"
            maxLength={120}
            value={pesquisar}
            onChange={(evento) => definirPesquisar(evento.target.value)}
          />
        </label>
        <label htmlFor="review-kind">
          Tipo de trabalho
          <Seletor
            id="review-kind"
            value={kind}
            onChange={(evento) => definirKind(evento.target.value)}
          >
            <option value="all">Todos</option>
            <option value="project">Projetos</option>
            <option value="quiz">Questionários</option>
          </Seletor>
        </label>
      </div>
      {!busy && !erro && (
        <p role="status">
          {filtered.length} {filtered.length === 1 ? 'trabalho pendente' : 'trabalhos pendentes'}{' '}
          {cursoFiltrar === 'all' ? 'em todos os cursos' : 'no curso selecionado'}.
        </p>
      )}
      {erro && (
        <p
          role="alert"
          className="creator-tool-error"
        >
          {erro}
        </p>
      )}
      {!filtered.length && !erro && (
        <p role="status">
          {busy ? 'A carregar…' : 'Não existem trabalhos pendentes para os filtros selecionados.'}
        </p>
      )}
      {filtered.map((item) => (
        <article
          key={`${item.kind}:${item.id}`}
          className="creator-review"
        >
          <header className="avaliacao-cabecalho">
            <h3>{item.lessonTitle}</h3>
            <span>{item.kind === 'quiz' ? 'Questionário' : 'Projeto'}</span>
          </header>
          <p>
            {item.studentUsername ? (
              <Link to={`/perfil/${encodeURIComponent(item.studentUsername)}`}>
                {item.studentName}
              </Link>
            ) : (
              item.studentName
            )}
          </p>
          <p>
            {item.tituloCurso}
            {(item.submittedAt || item.criado_em) &&
              ` · Entregue em ${new Date(item.submittedAt || item.criado_em).toLocaleString('pt-PT')}`}
          </p>
          {item.kind === 'quiz' ? (
            <>
              <dl>
                {item.quiz?.questions.map((q) => (
                  <div key={q.id}>
                    <dt>{q.question}</dt>
                    <dd>
                      {q.type === 'open-ended'
                        ? item.answers[q.id]
                        : q.options
                            .filter((o) =>
                              (Array.isArray(item.answers[q.id])
                                ? item.answers[q.id]
                                : [item.answers[q.id]]
                              ).includes(o.id),
                            )
                            .map((o) => o.text)
                            .join(', ')}
                    </dd>
                  </div>
                ))}
              </dl>
              <label htmlFor={`grade-${item.id}`}>Nota final (0–100)</label>
              <input
                id={`grade-${item.id}`}
                type="number"
                min="0"
                max="100"
                value={scores[item.id] ?? ''}
                onChange={(evento) =>
                  definirScores((s) => ({
                    ...s,
                    [item.id]: evento.target.value,
                  }))
                }
              />
              <Botao
                size="sm"
                onClick={() => rever(item)}
                disabled={busy}
              >
                Guardar avaliação
              </Botao>
            </>
          ) : (
            <>
              <a
                href={seguroExternoUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir projeto
              </a>
              <label htmlFor={`feedback-${item.id}`}>Parecer para o aluno</label>
              <textarea
                id={`feedback-${item.id}`}
                maxLength={2000}
                rows={3}
                value={parecer[item.id] || ''}
                onChange={(evento) =>
                  definirParecer((s) => ({
                    ...s,
                    [item.id]: evento.target.value,
                  }))
                }
              />
              <div className="creator-tool-actions">
                <Botao
                  size="sm"
                  onClick={() => rever(item, 'APPROVED')}
                  disabled={busy}
                >
                  Aprovar projeto
                </Botao>
                <Botao
                  size="sm"
                  variant="outline"
                  onClick={() => rever(item, 'CHANGES_REQUESTED')}
                  disabled={busy}
                >
                  Pedir alterações
                </Botao>
              </div>
            </>
          )}
        </article>
      ))}
    </section>
  );
}

export function CursoAcessoGestor() {
  const [cursos, definirCursos] = useState([]);
  const [cursoId, definirCursoId] = useState('');
  const [identificador, definirIdentificador] = useState('');
  const [busy, definirBusy] = useState(false);
  const [mensagem, definirMensagem] = useState('');
  const [erro, definirErro] = useState('');

  useEffect(() => {
    let ativo = true;

    api
      .get('/formador/cursos')
      .then(({ data: dados }) => dados)
      .then((dados) => {
        if (ativo) {
          definirCursos(dados || []);
          definirCursoId(dados?.[0]?.id || '');
        }
      })
      .catch((evento) => {
        if (ativo) definirErro(evento.message);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const submeter = async (evento) => {
    evento.preventDefault();
    definirBusy(true);
    definirErro('');
    definirMensagem('');
    try {
      await api
        .post(`/formador/cursos/${cursoId}/inscricoes`, {
          identifier: identificador.trim(),
        })
        .then(({ data: dados }) => dados);
      definirMensagem('Acesso concedido. O aluno já pode encontrar o curso na biblioteca.');
      definirIdentificador('');
    } catch (erro2) {
      definirErro(erro2.message);
    } finally {
      definirBusy(false);
    }
  };

  return (
    <section className="creator-tool">
      <header>
        <div>
          <h2>Conceder acesso a um aluno</h2>
          <p>
            Confirme uma inscrição acordada diretamente com o aluno. Esta ação não cobra qualquer
            pagamento.
          </p>
        </div>
      </header>
      {erro && (
        <p
          className="creator-tool-error"
          role="alert"
        >
          {erro}
        </p>
      )}
      {mensagem && <p role="status">{mensagem}</p>}
      {cursos.length > 0 ? (
        <form
          className="creator-access-form"
          onSubmit={submeter}
        >
          <label htmlFor="access-course">
            Curso
            <Seletor
              id="access-course"
              value={cursoId}
              onChange={(evento) => definirCursoId(evento.target.value)}
              disabled={busy}
            >
              {cursos.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.title}
                </option>
              ))}
            </Seletor>
          </label>
          <label htmlFor="access-student">
            Email ou nome de utilizador
            <input
              id="access-student"
              value={identificador}
              onChange={(evento) => definirIdentificador(evento.target.value)}
              required
              maxLength={254}
              disabled={busy}
            />
          </label>
          <Botao
            type="submit"
            isLoading={busy}
          >
            Conceder acesso
          </Botao>
        </form>
      ) : (
        <p>Crie um curso para gerir inscrições.</p>
      )}
    </section>
  );
}
