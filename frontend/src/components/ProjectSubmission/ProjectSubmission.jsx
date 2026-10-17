import { useEffect, useState } from 'react';
import {
  LuExternalLink as ExternalLink,
  LuCircleCheck as CheckCircle2,
  LuFolderGit2 as FolderGit2,
  LuLoaderCircle as Loader2,
} from 'react-icons/lu';
import { api } from '../../services/api';
import { Button } from '../Button';
import { safeExternalUrl } from '../../utils/safeUrl';
import './ProjectSubmission.css';
export function ProjectSubmission({ lessonId, title, description, onApproved }) {
  const [submission, setSubmission] = useState(null),
    [url, setUrl] = useState(''),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    api
      .get(`/projects/lesson/${lessonId}`)
      .then(({ data }) => data)
      .then((data) => {
        if (active) {
          setSubmission(data);
          setUrl(data?.url || '');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [lessonId, reload]);
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const safe = safeExternalUrl(url);
    if (!safe || safe.startsWith('/')) return setError('Introduza um link completo http ou https.');
    setBusy(true);
    try {
      setSubmission(
        await api
          .post(`/projects/lesson/${lessonId}`, {
            url: safe,
          })
          .then(({ data }) => data),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="project-submission">
      <FolderGit2 />
      <span>PROJETO DA AULA</span>
      <h2>{title}</h2>
      <p>
        {description ||
          'Partilhe o link para o seu projeto. O formador vai avaliar o trabalho e enviar-lhe um parecer.'}
      </p>
      {error && (
        <p role="alert" className="project-error">
          {error}
        </p>
      )}
      {busy && (
        <p role="status">
          <Loader2 />A carregar…
        </p>
      )}
      {submission && (
        <div className="project-status" role="status">
          <strong>
            {submission.status === 'APPROVED'
              ? 'Projeto aprovado'
              : submission.status === 'CHANGES_REQUESTED'
                ? 'O formador pediu alterações'
                : 'Projeto enviado para avaliação'}
          </strong>
          <a href={safeExternalUrl(submission.url)} target="_blank" rel="noopener noreferrer">
            Ver projeto
            <ExternalLink />
          </a>
          {submission.feedback && <p>{submission.feedback}</p>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReload((n) => n + 1)}
            disabled={busy}
          >
            Atualizar estado
          </Button>
        </div>
      )}
      {submission?.status === 'APPROVED' ? (
        <Button onClick={onApproved} leftIcon={<CheckCircle2 />}>
          Concluir aula
        </Button>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="project-url">Link do repositório ou da aplicação</label>
          <input
            id="project-url"
            type="url"
            required
            maxLength={2000}
            placeholder="https://github.com/utilizador/projeto"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
          <Button type="submit" isLoading={busy}>
            {submission ? 'Enviar nova versão' : 'Submeter projeto'}
          </Button>
        </form>
      )}
    </section>
  );
}
