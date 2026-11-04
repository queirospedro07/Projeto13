import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Janela } from '../Dialog';
import { Botao } from '../Button';
import { obterYouTubeIncorporadoUrl } from '../LessonVideoPlayer/LessonVideoPlayer';
import { seguroExternoUrl, seguroDescarregarUrl } from '../../utils/safeUrl';
import {
  formatarCursoPreco,
  formatarCategoria,
  formatarAulaType,
} from '../../utils/formatting';
import './CourseReviewPanel.css';

function AulaPrevisualizar({ lesson: aula }) {
  if (!aula) return <p>O curso ainda não tem aulas para rever.</p>;
  const video = seguroExternoUrl(aula.urlVideo);
  const YouTube = video ? obterYouTubeIncorporadoUrl(video) : null;
  const article = aula.richArticle;
  const questionario = aula.quiz;
  const conteudo =
    article?.markdown || article?.content || (questionario ? '' : aula.content) || '';

  return (
    <article className="course-review__lesson">
      <span>
        {formatarAulaType(aula.type)} · {aula.duracaoMinutos || 0} minutos
      </span>
      <h3>{aula.title}</h3>
      {video &&
        (YouTube ? (
          <iframe
            title={`Vídeo: ${aula.title}`}
            src={YouTube}
            allowFullScreen
          />
        ) : (
          <video
            controls
            preload="metadata"
            src={video}
            aria-label={aula.title}
          />
        ))}
      {conteudo && typeof conteudo === 'string' && (
        <div className="course-review__content">{conteudo}</div>
      )}
      {questionario && (
        <section>
          <h4>Questionário</h4>
          <p>{questionario.description}</p>
          <ol>
            {questionario.questions?.map((pergunta, indice) => (
              <li key={pergunta.id || indice}>
                <strong>{pergunta.question || pergunta.text}</strong>
                <ul>
                  {pergunta.options?.map((opcao, opcaoIndice) => (
                    <li key={opcaoIndice}>
                      {typeof opcao === 'string' ? opcao : opcao.text || opcao.label}
                      {(opcao?.isCorrect || pergunta.indiceOpcaoCorreta === opcaoIndice) &&
                        ' · Resposta correta'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
      {!video && !conteudo && !questionario && <p>Esta aula ainda não tem conteúdo disponível.</p>}
    </article>
  );
}

export default function RevisaoCurso({
  course: curso,
  loading: carregamento,
  error: erro,
  busy,
  onClose: onFechar,
  onApprove: onAprovar,
  onRequestChanges,
  onRetry,
}) {
  const [aulaId, definirAulaId] = useState(null);
  const [revisto, definirRevisto] = useState(false);
  const aulas = curso.modules?.flatMap((modulo) => modulo.lessons || []) || [];
  const aula = aulas.find((item) => item.id === aulaId) || aulas[0];

  return (
    <Janela
      isOpen
      title="Revisão para publicação"
      maxWidth="4xl"
      onClose={() => !busy && onFechar()}
    >
      {carregamento ? (
        <p role="status">A carregar o conteúdo do curso…</p>
      ) : erro ? (
        <div role="alert">
          <p>Não foi possível carregar o curso para revisão.</p>
          <Botao onClick={onRetry}>Tentar novamente</Botao>
        </div>
      ) : (
        <div className="course-review">
          <header className="course-review__header">
            {curso.urlMiniatura && (
              <img
                src={curso.urlMiniatura}
                alt="Capa do curso"
              />
            )}
            <div>
              <span>
                {formatarCategoria(curso.category)} · {curso.difficulty} · {curso.language}
              </span>
              <h2>{curso.title}</h2>
              <p>Formador: {curso.creator?.name || 'Não indicado'}</p>
              <p>
                {formatarCursoPreco(curso)} · {curso.modules?.length || 0} módulos · {aulas.length}{' '}
                aulas · {curso.hasCommunity ? 'Com comunidade' : 'Sem comunidade'}
              </p>
            </div>
          </header>
          <section>
            <h3>Apresentação do curso</h3>
            <p className="course-review__content">{curso.description}</p>
            <div className="course-review__summary">
              {[
                ['O que o aluno vai aprender', curso.learningOutcomes],
                ['Requisitos', curso.requirements],
              ].map(([titulo, values]) => (
                <div key={titulo}>
                  <h4>{titulo}</h4>
                  {values?.length ? (
                    <ul>
                      {values.map((valor, indice) => (
                        <li key={indice}>{valor}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Não indicado.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <div className="course-review__curriculum">
            <nav aria-label="Aulas para revisão">
              <h3>Currículo</h3>
              {curso.modules?.map((modulo, indice) => (
                <section key={modulo.id || indice}>
                  <h4>
                    {indice + 1}. {modulo.title}
                  </h4>
                  {modulo.lessons?.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={item.id === aula?.id}
                      onClick={() => definirAulaId(item.id)}
                    >
                      {item.title}
                      <small>{formatarAulaType(item.type)}</small>
                    </button>
                  ))}
                </section>
              ))}
            </nav>
            <AulaPrevisualizar
              key={aula?.id}
              lesson={aula}
            />
          </div>
          <section>
            <h3>Recursos e comunidade</h3>
            {curso.documents?.length ? (
              <ul>
                {curso.documents.map((documento, indice) => {
                  const url = seguroDescarregarUrl(documento.url || documento.data);

                  return (
                    <li key={documento.id || indice}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {documento.name || documento.title || 'Abrir recurso'}
                        </a>
                      ) : (
                        documento.name || 'Recurso sem ligação válida'
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Sem recursos adicionais.</p>
            )}
            <p>{curso.space?.channels?.length || 0} canais de chat e chamadas.</p>
            {curso.space?.channels?.map((canal) => (
              <p key={canal.id}>
                #{canal.name} · {canal.type === 'voice' ? 'Chamada ao vivo' : 'Conversa'}
              </p>
            ))}
            <Link
              to={`/aprender/${curso.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir sala de aula numa nova página
            </Link>
          </section>
          {curso.notasAdministracao && (
            <section>
              <h3>Feedback anterior</h3>
              <p>{curso.notasAdministracao}</p>
            </section>
          )}
          {!aulas.length && <p role="status">Atenção: este curso ainda não tem aulas.</p>}
          {curso.estadoAprovacao !== 'APPROVED' && (
            <label className="course-review__confirmation">
              <input
                type="checkbox"
                checked={revisto}
                onChange={(evento) => definirRevisto(evento.target.checked)}
              />{' '}
              Revi a apresentação, as aulas e os recursos deste curso.
            </label>
          )}
          <footer className="course-review__actions">
            <Botao
              variant="secondary"
              disabled={busy}
              onClick={onFechar}
            >
              Fechar
            </Botao>
            <Botao
              variant="secondary"
              disabled={busy}
              onClick={onRequestChanges}
            >
              Pedir alterações
            </Botao>
            {curso.estadoAprovacao !== 'APPROVED' && (
              <Botao
                disabled={busy || !revisto || !aulas.length}
                isLoading={busy}
                onClick={onAprovar}
              >
                Aprovar e publicar
              </Botao>
            )}
          </footer>
        </div>
      )}
    </Janela>
  );
}
