import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../Button';
import { Select } from '../Select';
import { safeExternalUrl } from '../../utils/safeUrl';
import './CreatorTools.css';

export function ReviewQueue() {
  const [kind, setKind] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [quizzes, projects, catalog] = await Promise.all([
        api.get('/quizzes/reviews').then(({ data }) => data),
        api.get('/projects/reviews').then(({ data }) => data),
        api
          .get('/creator/courses')
          .then(({ data }) => data)
          .catch(() => []),
      ]);

      setCourseCatalog((previous) => (catalog.length ? catalog : previous));
      setItems([
        ...quizzes.map((q) => ({
          ...q,
          kind: 'quiz',
        })),
        ...projects.map((p) => ({
          ...p,
          kind: 'project',
        })),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (item, status) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (item.kind === 'quiz') {
        const score = Number(scores[item.id]);
        if (
          String(scores[item.id] ?? '').trim() === '' ||
          !Number.isInteger(score) ||
          score < 0 ||
          score > 100
        )
          throw new Error('Introduza uma nota entre 0 e 100.');
        await api
          .put(`/quizzes/reviews/${item.id}`, {
            score,
          })
          .then(({ data }) => data);
      } else {
        if (status === 'CHANGES_REQUESTED' && !feedback[item.id]?.trim())
          throw new Error('Escreva o feedback com as alterações necessárias.');
        await api
          .put(`/projects/reviews/${item.id}`, {
            status,
            feedback: feedback[item.id] || '',
          })
          .then(({ data }) => data);
      }

      await load();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const normalize = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filtered = items.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      (courseFilter === 'all' || item.courseId === courseFilter) &&
      normalize(`${item.studentName} ${item.lessonTitle} ${item.courseTitle}`).includes(
        normalize(search),
      ),
  );
  const courses = [
    ...new Map([
      ...items.map((item) => [item.courseId, item.courseTitle || 'Curso']),
      ...courseCatalog.map((course) => [course.id, course.title]),
    ]).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], 'pt'));
  const courseOptions =
    courses.some(([id]) => id === courseFilter) || courseFilter === 'all'
      ? courses
      : [...courses, [courseFilter, 'Curso selecionado']];

  return (
    <section className="creator-tool">
      <header>
        <div>
          <span>AVALIAÇÃO</span>
          <h2>Trabalhos para rever</h2>
          <p>Respostas de desenvolvimento e projetos dos seus alunos.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={busy}
        >
          Atualizar
        </Button>
      </header>
      <div className="creator-review-filters">
        <label
          htmlFor="review-course"
          className="creator-review-course-filter"
        >
          Curso a avaliar
          <Select
            id="review-course"
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="all">Todos os cursos</option>
            {courseOptions.map(([id, title]) => (
              <option
                key={id}
                value={id}
              >
                {title}
              </option>
            ))}
          </Select>
        </label>
        <label htmlFor="review-search">
          Pesquisar aluno ou trabalho
          <input
            id="review-search"
            type="search"
            maxLength={120}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label htmlFor="review-kind">
          Tipo de trabalho
          <Select
            id="review-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="project">Projetos</option>
            <option value="quiz">Questionários</option>
          </Select>
        </label>
      </div>
      {!busy && !error && (
        <p role="status">
          {filtered.length} {filtered.length === 1 ? 'trabalho pendente' : 'trabalhos pendentes'}{' '}
          {courseFilter === 'all' ? 'em todos os cursos' : 'no curso selecionado'}.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="creator-tool-error"
        >
          {error}
        </p>
      )}
      {!filtered.length && !error && (
        <p role="status">
          {busy ? 'A carregar…' : 'Não existem trabalhos pendentes para os filtros selecionados.'}
        </p>
      )}
      {filtered.map((item) => (
        <article
          key={`${item.kind}:${item.id}`}
          className="creator-review"
        >
          <h3>{item.lessonTitle}</h3>
          <p>
            {item.studentName} · {item.kind === 'quiz' ? 'Questionário' : 'Projeto'}
          </p>
          <p>
            {item.courseTitle}
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
                onChange={(e) =>
                  setScores((s) => ({
                    ...s,
                    [item.id]: e.target.value,
                  }))
                }
              />
              <Button
                size="sm"
                onClick={() => review(item)}
                disabled={busy}
              >
                Guardar avaliação
              </Button>
            </>
          ) : (
            <>
              <a
                href={safeExternalUrl(item.url)}
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
                value={feedback[item.id] || ''}
                onChange={(e) =>
                  setFeedback((s) => ({
                    ...s,
                    [item.id]: e.target.value,
                  }))
                }
              />
              <div className="creator-tool-actions">
                <Button
                  size="sm"
                  onClick={() => review(item, 'APPROVED')}
                  disabled={busy}
                >
                  Aprovar projeto
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(item, 'CHANGES_REQUESTED')}
                  disabled={busy}
                >
                  Pedir alterações
                </Button>
              </div>
            </>
          )}
        </article>
      ))}
    </section>
  );
}

export function CourseAccessManager() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get('/creator/courses')
      .then(({ data }) => data)
      .then((data) => {
        if (active) {
          setCourses(data || []);
          setCourseId(data?.[0]?.id || '');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api
        .post(`/creator/courses/${courseId}/enrollments`, {
          identifier: identifier.trim(),
        })
        .then(({ data }) => data);
      setMessage('Acesso concedido. O aluno já pode encontrar o curso na biblioteca.');
      setIdentifier('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="creator-tool">
      <header>
        <div>
          <span>INSCRIÇÕES</span>
          <h2>Conceder acesso a um aluno</h2>
          <p>
            Confirme uma inscrição acordada diretamente com o aluno. Esta ação não cobra qualquer
            pagamento.
          </p>
        </div>
      </header>
      {error && (
        <p
          className="creator-tool-error"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {courses.length > 0 ? (
        <form
          className="creator-access-form"
          onSubmit={submit}
        >
          <label htmlFor="access-course">
            Curso
            <Select
              id="access-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={busy}
            >
              {courses.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.title}
                </option>
              ))}
            </Select>
          </label>
          <label htmlFor="access-student">
            Email ou nome de utilizador
            <input
              id="access-student"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              maxLength={254}
              disabled={busy}
            />
          </label>
          <Button
            type="submit"
            isLoading={busy}
          >
            Conceder acesso
          </Button>
        </form>
      ) : (
        <p>Crie um curso para gerir inscrições.</p>
      )}
    </section>
  );
}
