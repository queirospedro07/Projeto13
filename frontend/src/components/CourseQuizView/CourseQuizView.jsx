import './CourseQuizView.css';
import { useEffect, useState } from 'react';
import {
  LuCircleCheck as CheckCircle2,
  LuCircleX as XCircle,
  LuClock as Clock,
  LuRotateCcw as RotateCcw,
  LuBookOpen as BookOpen,
  LuLoaderCircle as Loader2,
} from 'react-icons/lu';
import { api } from '../../services/api';
import { Button } from '../Button';
import { Select } from '../Select';
export function CourseQuizView({ lessonId, lessons = [], onCompleteQuiz, onNextLesson }) {
  const [quiz, setQuiz] = useState(null),
    [answers, setAnswers] = useState({}),
    [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(lessonId)),
    [submitting, setSubmitting] = useState(false),
    [error, setError] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id || '');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    setLoading(true);
    setError('');
    setAnswers({});
    setResult(null);
    api
      .get(`/quizzes/lesson/${lessonId}`)
      .then(({ data }) => data)
      .then((data) => {
        if (active) {
          setQuiz(data);
          setResult(data.latestAttempt);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lessonId, reload]);
  if (!lessonId)
    return (
      <section className="assessment-view">
        <h2>
          <BookOpen />
          Questionários do curso
        </h2>
        {lessons.length ? (
          <>
            <label htmlFor="assessment-lesson">Escolha uma aula</label>
            <Select
              id="assessment-lesson"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </Select>
            <CourseQuizView key={selectedLessonId} lessonId={selectedLessonId} />
          </>
        ) : (
          <p>Este curso ainda não tem questionários publicados.</p>
        )}
      </section>
    );
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api
        .post(`/quizzes/${lessonId}/submit`, {
          answers,
        })
        .then(({ data }) => data);
      setResult(response);
      if (response.passed && onCompleteQuiz) await onCompleteQuiz();
    } catch (err) {
      setError(err.message || 'Não foi possível submeter as respostas. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };
  const toggle = (question, id) =>
    setAnswers((prev) => {
      const list = prev[question.id] || [];
      return {
        ...prev,
        [question.id]:
          question.type === 'multiple'
            ? list.includes(id)
              ? list.filter((value) => value !== id)
              : [...list, id]
            : id,
      };
    });
  if (loading)
    return (
      <div className="assessment-loading" role="status">
        <Loader2 />A carregar o questionário…
      </div>
    );
  if (!quiz)
    return (
      <div className="assessment-empty">
        <p role="alert">{error || 'Questionário indisponível.'}</p>
        <Button onClick={() => setReload((n) => n + 1)}>Tentar novamente</Button>
      </div>
    );
  return (
    <section className="assessment-view">
      <header className="assessment-heading">
        <span>QUESTIONÁRIO DA AULA</span>
        <h2>{quiz.title}</h2>
        {quiz.description && <p>{quiz.description}</p>}
        <small>
          Nota mínima: {quiz.passingScore}% · {quiz.questions.length} perguntas
        </small>
      </header>
      {result && (
        <div
          className={`assessment-result ${result.pendingTeacherReviewCount ? 'is-pending' : result.passed ? 'is-passed' : 'is-failed'}`}
          role="status"
        >
          {result.pendingTeacherReviewCount ? (
            <Clock />
          ) : result.passed ? (
            <CheckCircle2 />
          ) : (
            <XCircle />
          )}
          <div>
            <strong>
              {result.pendingTeacherReviewCount
                ? 'Respostas enviadas para avaliação'
                : result.passed
                  ? `Aprovado · ${result.score}%`
                  : `Resultado · ${result.score}%`}
            </strong>
            <p>
              {result.pendingTeacherReviewCount
                ? 'O formador vai avaliar as respostas de desenvolvimento. Volte a esta aula para consultar a nota.'
                : result.passed
                  ? 'Concluiu a avaliação desta aula.'
                  : 'Reveja as respostas e volte a tentar quando estiver preparado.'}
            </p>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="assessment-error">
          {error}
        </p>
      )}
      {!quiz.questions.length ? (
        <p>O formador ainda não adicionou perguntas.</p>
      ) : (
        <form onSubmit={submit}>
          {quiz.questions.map((q, index) => {
            const feedback = result?.results?.find((item) => item.questionId === q.id);
            return (
              <fieldset
                className="assessment-question"
                key={q.id}
                disabled={submitting || Boolean(result)}
              >
                <legend>
                  <span>{index + 1}</span>
                  {q.question}
                </legend>
                {q.type === 'open-ended' ? (
                  <>
                    <label className="assessment-answer-label" htmlFor={`answer-${q.id}`}>
                      A sua resposta
                    </label>
                    <textarea
                      id={`answer-${q.id}`}
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      maxLength={5000}
                      rows={5}
                      required
                    />
                    <small>
                      {q.gradingMode === 'teacher'
                        ? 'Avaliação pelo formador.'
                        : 'A resposta será avaliada no servidor.'}
                    </small>
                  </>
                ) : (
                  <>
                    <small>
                      {q.type === 'multiple'
                        ? 'Selecione todas as opções corretas.'
                        : q.type === 'find-incorrect'
                          ? 'Selecione a afirmação incorreta.'
                          : 'Selecione uma opção.'}
                    </small>
                    <div className="assessment-options">
                      {q.options.map((option) => (
                        <label
                          key={option.id}
                          className={
                            feedback?.correctOptionIds?.includes(option.id) ? 'is-correct' : ''
                          }
                        >
                          <input
                            type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                            name={`question-${q.id}`}
                            checked={
                              q.type === 'multiple'
                                ? (answers[q.id] || []).includes(option.id)
                                : answers[q.id] === option.id
                            }
                            onChange={() => toggle(q, option.id)}
                          />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {feedback?.explanation && (
                  <p className="assessment-explanation">{feedback.explanation}</p>
                )}
              </fieldset>
            );
          })}
          <footer className="assessment-actions">
            {!result ? (
              <Button type="submit" isLoading={submitting}>
                Submeter respostas
              </Button>
            ) : (
              <>
                {!result.pendingTeacherReviewCount && (
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<RotateCcw />}
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                      setError('');
                    }}
                  >
                    Tentar novamente
                  </Button>
                )}
                {result.passed && onCompleteQuiz && (
                  <Button type="button" onClick={onCompleteQuiz}>
                    Concluir aula
                  </Button>
                )}
                {result.passed && onNextLesson && (
                  <Button type="button" variant="outline" onClick={onNextLesson}>
                    Próxima aula
                  </Button>
                )}
                {Boolean(result.pendingTeacherReviewCount) && (
                  <Button type="button" variant="outline" onClick={() => setReload((n) => n + 1)}>
                    Atualizar avaliação
                  </Button>
                )}
              </>
            )}
          </footer>
        </form>
      )}
    </section>
  );
}
