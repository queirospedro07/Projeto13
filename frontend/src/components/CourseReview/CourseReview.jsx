import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { getYouTubeEmbedUrl } from '../LessonVideoPlayer/LessonVideoPlayer';
import { safeExternalUrl, safeDownloadUrl } from '../../utils/safeUrl';
import { formatCoursePrice, formatCategory, formatLessonType } from '../../utils/formatters';
import './CourseReview.css';

function LessonPreview({ lesson }) {
  if (!lesson) return <p>O curso ainda não tem aulas para rever.</p>;
  const video = safeExternalUrl(lesson.videoUrl);
  const youtube = video ? getYouTubeEmbedUrl(video) : null;
  const article = lesson.richArticle;
  const quiz = lesson.quiz;
  const content = article?.markdown || article?.content || (quiz ? '' : lesson.content) || '';

  return (
    <article className="course-review__lesson">
      <span>
        {formatLessonType(lesson.type)} · {lesson.durationMin || 0} minutos
      </span>
      <h3>{lesson.title}</h3>
      {video &&
        (youtube ? (
          <iframe
            title={`Vídeo: ${lesson.title}`}
            src={youtube}
            allowFullScreen
          />
        ) : (
          <video
            controls
            preload="metadata"
            src={video}
            aria-label={lesson.title}
          />
        ))}
      {content && typeof content === 'string' && (
        <div className="course-review__content">{content}</div>
      )}
      {quiz && (
        <section>
          <h4>Questionário</h4>
          <p>{quiz.description}</p>
          <ol>
            {quiz.questions?.map((question, index) => (
              <li key={question.id || index}>
                <strong>{question.question || question.text}</strong>
                <ul>
                  {question.options?.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      {typeof option === 'string' ? option : option.text || option.label}
                      {(option?.isCorrect || question.correctOptionIndex === optionIndex) &&
                        ' · Resposta correta'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
      {!video && !content && !quiz && <p>Esta aula ainda não tem conteúdo disponível.</p>}
    </article>
  );
}

export default function CourseReview({
  course,
  loading,
  error,
  busy,
  onClose,
  onApprove,
  onRequestChanges,
  onRetry,
}) {
  const [lessonId, setLessonId] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const lessons = course.modules?.flatMap((module) => module.lessons || []) || [];
  const lesson = lessons.find((item) => item.id === lessonId) || lessons[0];

  return (
    <Modal
      isOpen
      title="Revisão para publicação"
      maxWidth="4xl"
      onClose={() => !busy && onClose()}
    >
      {loading ? (
        <p role="status">A carregar o conteúdo do curso…</p>
      ) : error ? (
        <div role="alert">
          <p>Não foi possível carregar o curso para revisão.</p>
          <Button onClick={onRetry}>Tentar novamente</Button>
        </div>
      ) : (
        <div className="course-review">
          <header className="course-review__header">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt="Capa do curso"
              />
            )}
            <div>
              <span>
                {formatCategory(course.category)} · {course.difficulty} · {course.language}
              </span>
              <h2>{course.title}</h2>
              <p>Formador: {course.creator?.name || 'Não indicado'}</p>
              <p>
                {formatCoursePrice(course)} · {course.modules?.length || 0} módulos ·{' '}
                {lessons.length} aulas · {course.hasCommunity ? 'Com comunidade' : 'Sem comunidade'}
              </p>
            </div>
          </header>
          <section>
            <h3>Apresentação do curso</h3>
            <p className="course-review__content">{course.description}</p>
            <div className="course-review__summary">
              {[
                ['O que o aluno vai aprender', course.learningOutcomes],
                ['Requisitos', course.requirements],
              ].map(([title, values]) => (
                <div key={title}>
                  <h4>{title}</h4>
                  {values?.length ? (
                    <ul>
                      {values.map((value, index) => (
                        <li key={index}>{value}</li>
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
              {course.modules?.map((module, index) => (
                <section key={module.id || index}>
                  <h4>
                    {index + 1}. {module.title}
                  </h4>
                  {module.lessons?.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={item.id === lesson?.id}
                      onClick={() => setLessonId(item.id)}
                    >
                      {item.title}
                      <small>{formatLessonType(item.type)}</small>
                    </button>
                  ))}
                </section>
              ))}
            </nav>
            <LessonPreview
              key={lesson?.id}
              lesson={lesson}
            />
          </div>
          <section>
            <h3>Recursos e comunidade</h3>
            {course.documents?.length ? (
              <ul>
                {course.documents.map((document, index) => {
                  const url = safeDownloadUrl(document.url || document.data);

                  return (
                    <li key={document.id || index}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {document.name || document.title || 'Abrir recurso'}
                        </a>
                      ) : (
                        document.name || 'Recurso sem ligação válida'
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Sem recursos adicionais.</p>
            )}
            <p>{course.space?.channels?.length || 0} canais de chat e chamadas.</p>
            {course.space?.channels?.map((channel) => (
              <p key={channel.id}>
                #{channel.name} · {channel.type === 'voice' ? 'Chamada ao vivo' : 'Chat'}
              </p>
            ))}
            <Link
              to={`/learn/${course.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir sala de aula numa nova página
            </Link>
          </section>
          {course.adminNotes && (
            <section>
              <h3>Feedback anterior</h3>
              <p>{course.adminNotes}</p>
            </section>
          )}
          {!lessons.length && <p role="status">Atenção: este curso ainda não tem aulas.</p>}
          {course.approvalStatus !== 'APPROVED' && (
            <label className="course-review__confirmation">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />{' '}
              Revi a apresentação, as aulas e os recursos deste curso.
            </label>
          )}
          <footer className="course-review__actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={onRequestChanges}
            >
              Pedir alterações
            </Button>
            {course.approvalStatus !== 'APPROVED' && (
              <Button
                disabled={busy || !reviewed || !lessons.length}
                isLoading={busy}
                onClick={onApprove}
              >
                Aprovar e publicar
              </Button>
            )}
          </footer>
        </div>
      )}
    </Modal>
  );
}
