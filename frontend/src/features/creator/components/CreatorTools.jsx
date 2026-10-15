import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { safeExternalUrl } from '../../../utils/safeUrl';
import './CreatorTools.css';
export function ReviewQueue() {
  const [items, setItems] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [scores, setScores] = useState({}),
    [feedback, setFeedback] = useState({});
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [quizzes, projects] = await Promise.all([
        api.getQuizReviews(),
        api.getProjectReviews(),
      ]);
      setItems([
        ...quizzes.map((q) => ({ ...q, kind: 'quiz' })),
        ...projects.map((p) => ({ ...p, kind: 'project' })),
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
    setBusy(true);
    setError('');
    try {
      if (item.kind === 'quiz') {
        const score = Number(scores[item.id]);
        if (scores[item.id] === undefined || !Number.isInteger(score) || score < 0 || score > 100)
          throw new Error('Introduza uma nota entre 0 e 100.');
        await api.reviewQuiz(item.id, score);
      } else await api.reviewProject(item.id, status, feedback[item.id] || '');
      await load();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  return (
    <section className="creator-tool">
      <header>
        <div>
          <span>AVALIAÇÃO</span>
          <h2>Trabalhos para rever</h2>
          <p>Respostas de desenvolvimento e projetos dos seus alunos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={busy}>
          Atualizar
        </Button>
      </header>
      {error && (
        <p role="alert" className="creator-tool-error">
          {error}
        </p>
      )}
      {!items.length && !error && (
        <p role="status">
          {busy ? 'A carregar…' : 'Não existem trabalhos pendentes de avaliação.'}
        </p>
      )}
      {items.map((item) => (
        <article key={item.id} className="creator-review">
          <h3>{item.lessonTitle}</h3>
          <p>
            {item.studentName} · {item.kind === 'quiz' ? 'Questionário' : 'Projeto'}
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
                onChange={(e) => setScores((s) => ({ ...s, [item.id]: e.target.value }))}
              />
              <Button size="sm" onClick={() => review(item)} disabled={busy}>
                Guardar avaliação
              </Button>
            </>
          ) : (
            <>
              <a href={safeExternalUrl(item.url)} target="_blank" rel="noopener noreferrer">
                Abrir projeto
              </a>
              <label htmlFor={`feedback-${item.id}`}>Parecer para o aluno</label>
              <textarea
                id={`feedback-${item.id}`}
                maxLength={2000}
                rows={3}
                value={feedback[item.id] || ''}
                onChange={(e) => setFeedback((s) => ({ ...s, [item.id]: e.target.value }))}
              />
              <div className="creator-tool-actions">
                <Button size="sm" onClick={() => review(item, 'APPROVED')} disabled={busy}>
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
  const [courses, setCourses] = useState([]),
    [courseId, setCourseId] = useState(''),
    [identifier, setIdentifier] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api
      .getCreatorCourses()
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
      await api.grantCourseAccess(courseId, identifier.trim());
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
        <p className="creator-tool-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {courses.length > 0 ? (
        <form className="creator-access-form" onSubmit={submit}>
          <label htmlFor="access-course">
            Curso
            <Select
              id="access-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={busy}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
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
          <Button type="submit" isLoading={busy}>
            Conceder acesso
          </Button>
        </form>
      ) : (
        <p>Crie um curso para gerir inscrições.</p>
      )}
    </section>
  );
}
