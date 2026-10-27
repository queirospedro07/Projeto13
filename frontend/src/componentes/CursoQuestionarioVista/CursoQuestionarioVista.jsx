import './CursoQuestionarioVista.css';
import { useEffect, useState } from 'react';
import {
  LuCircleCheck as CheckCircle2,
  LuCircleX as XCircle,
  LuClock as Clock,
  LuRotateCcw as RotateCcw,
  LuBookOpen as BookOpen,
  LuLoaderCircle as Loader2,
} from 'react-icons/lu';
import { api } from '../../servicos/api';
import { Botao } from '../Botao';
import { Seletor } from '../Seletor';

export function CursoQuestionarioVista({
  idAula: aulaId,
  lessons: aulas = [],
  onCompleteQuiz: onConcluirQuestionario,
  onNextLesson: onSeguinteAula,
}) {
  const [questionario, definirQuestionario] = useState(null);
  const [answers, definirAnswers] = useState({});
  const [resultado, definirResultado] = useState(null);
  const [carregamento, definirCarregamento] = useState(Boolean(aulaId));
  const [submitting, definirSubmitting] = useState(false);
  const [erro, definirErro] = useState('');
  const [selecionadoAulaId, definirSelecionadoAulaId] = useState(aulas[0]?.id || '');
  const [reload, definirReload] = useState(0);

  useEffect(() => {
    if (!aulaId) return;
    let ativo = true;

    definirCarregamento(true);
    definirErro('');
    definirAnswers({});
    definirResultado(null);
    api
      .get(`/questionarios/lesson/${aulaId}`)
      .then(({ data: dados }) => dados)
      .then((dados) => {
        if (ativo) {
          definirQuestionario(dados);
          definirResultado(dados.latestAttempt);
        }
      })
      .catch((erro2) => {
        if (ativo) definirErro(erro2.message);
      })
      .finally(() => {
        if (ativo) definirCarregamento(false);
      });

    return () => {
      ativo = false;
    };
  }, [aulaId, reload]);
  if (!aulaId)
    return (
      <section className="assessment-view">
        <h2>
          <BookOpen />
          Questionários do curso
        </h2>
        {aulas.length ? (
          <>
            <label htmlFor="assessment-lesson">Escolha uma aula</label>
            <Seletor
              id="assessment-lesson"
              value={selecionadoAulaId}
              onChange={(evento) => definirSelecionadoAulaId(evento.target.value)}
            >
              {aulas.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.title}
                </option>
              ))}
            </Seletor>
            <CursoQuestionarioVista
              key={selecionadoAulaId}
              idAula={selecionadoAulaId}
            />
          </>
        ) : (
          <p>Este curso ainda não tem questionários publicados.</p>
        )}
      </section>
    );
  const submeter = async (evento) => {
    evento.preventDefault();
    definirErro('');
    definirSubmitting(true);
    try {
      const response = await api
        .post(`/questionarios/${aulaId}/submeter`, {
          answers,
        })
        .then(({ data: dados }) => dados);

      definirResultado(response);
      if (response.passed && onConcluirQuestionario) await onConcluirQuestionario();
    } catch (erro2) {
      definirErro(erro2.message || 'Não foi possível submeter as respostas. Tente novamente.');
    } finally {
      definirSubmitting(false);
    }
  };

  const alternar = (pergunta, id) =>
    definirAnswers((anterior) => {
      const listar = anterior[pergunta.id] || [];

      return {
        ...anterior,
        [pergunta.id]:
          pergunta.type === 'multiple'
            ? listar.includes(id)
              ? listar.filter((valor) => valor !== id)
              : [...listar, id]
            : id,
      };
    });
  if (carregamento)
    return (
      <div
        className="assessment-loading"
        role="status"
      >
        <Loader2 />A carregar o questionário…
      </div>
    );
  if (!questionario)
    return (
      <div className="assessment-empty">
        <p role="alert">{erro || 'Questionário indisponível.'}</p>
        <Botao onClick={() => definirReload((n) => n + 1)}>Tentar novamente</Botao>
      </div>
    );

  return (
    <section className="assessment-view">
      <header className="assessment-heading">
        <span>QUESTIONÁRIO DA AULA</span>
        <h2>{questionario.title}</h2>
        {questionario.description && <p>{questionario.description}</p>}
        <small>
          Nota mínima: {questionario.pontuacaoAprovacao}% · {questionario.questions.length}{' '}
          perguntas
        </small>
      </header>
      {resultado && (
        <div
          className={`assessment-result ${resultado.pendingTeacherReviewCount ? 'is-pending' : resultado.passed ? 'is-passed' : 'is-failed'}`}
          role="status"
        >
          {resultado.pendingTeacherReviewCount ? (
            <Clock />
          ) : resultado.passed ? (
            <CheckCircle2 />
          ) : (
            <XCircle />
          )}
          <div>
            <strong>
              {resultado.pendingTeacherReviewCount
                ? 'Respostas enviadas para avaliação'
                : resultado.passed
                  ? `Aprovado · ${resultado.score}%`
                  : `Resultado · ${resultado.score}%`}
            </strong>
            <p>
              {resultado.pendingTeacherReviewCount
                ? 'O formador vai avaliar as respostas de desenvolvimento. Volte a esta aula para consultar a nota.'
                : resultado.passed
                  ? 'Concluiu a avaliação desta aula.'
                  : 'Reveja as respostas e volte a tentar quando estiver preparado.'}
            </p>
          </div>
        </div>
      )}
      {erro && (
        <p
          role="alert"
          className="assessment-error"
        >
          {erro}
        </p>
      )}
      {!questionario.questions.length ? (
        <p>O formador ainda não adicionou perguntas.</p>
      ) : (
        <form onSubmit={submeter}>
          {questionario.questions.map((q, indice) => {
            const parecer = resultado?.results?.find((item) => item.questionId === q.id);

            return (
              <fieldset
                className="assessment-question"
                key={q.id}
                disabled={submitting || Boolean(resultado)}
              >
                <legend>
                  <span>{indice + 1}</span>
                  {q.question}
                </legend>
                {q.type === 'open-ended' ? (
                  <>
                    <label
                      className="assessment-answer-label"
                      htmlFor={`answer-${q.id}`}
                    >
                      A sua resposta
                    </label>
                    <textarea
                      id={`answer-${q.id}`}
                      value={answers[q.id] || ''}
                      onChange={(evento) =>
                        definirAnswers((anterior) => ({
                          ...anterior,
                          [q.id]: evento.target.value,
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
                      {q.options.map((opcao) => (
                        <label
                          key={opcao.id}
                          className={
                            parecer?.correctOptionIds?.includes(opcao.id) ? 'is-correct' : ''
                          }
                        >
                          <input
                            type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                            name={`question-${q.id}`}
                            checked={
                              q.type === 'multiple'
                                ? (answers[q.id] || []).includes(opcao.id)
                                : answers[q.id] === opcao.id
                            }
                            onChange={() => alternar(q, opcao.id)}
                          />
                          <span>{opcao.text}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {parecer?.explanation && (
                  <p className="assessment-explanation">{parecer.explanation}</p>
                )}
              </fieldset>
            );
          })}
          <footer className="assessment-actions">
            {!resultado ? (
              <Botao
                type="submit"
                isLoading={submitting}
              >
                Submeter respostas
              </Botao>
            ) : (
              <>
                {!resultado.pendingTeacherReviewCount && (
                  <Botao
                    type="button"
                    variant="outline"
                    leftIcon={<RotateCcw />}
                    onClick={() => {
                      definirResultado(null);
                      definirAnswers({});
                      definirErro('');
                    }}
                  >
                    Tentar novamente
                  </Botao>
                )}
                {resultado.passed && onConcluirQuestionario && (
                  <Botao
                    type="button"
                    onClick={onConcluirQuestionario}
                  >
                    Concluir aula
                  </Botao>
                )}
                {resultado.passed && onSeguinteAula && (
                  <Botao
                    type="button"
                    variant="outline"
                    onClick={onSeguinteAula}
                  >
                    Próxima aula
                  </Botao>
                )}
                {Boolean(resultado.pendingTeacherReviewCount) && (
                  <Botao
                    type="button"
                    variant="outline"
                    onClick={() => definirReload((n) => n + 1)}
                  >
                    Atualizar avaliação
                  </Botao>
                )}
              </>
            )}
          </footer>
        </form>
      )}
    </section>
  );
}
