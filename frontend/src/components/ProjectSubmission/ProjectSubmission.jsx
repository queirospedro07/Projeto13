import { useEffect, useState } from 'react';
import {
  LuExternalLink as ExternalLink,
  LuCircleCheck as CheckCircle2,
  LuFolderGit2 as FolderGit2,
  LuLoaderCircle as Loader2,
} from 'react-icons/lu';
import { api } from '../../services/api';
import { Botao } from '../Button';
import { seguroExternoUrl } from '../../utils/safeUrl';
import './ProjectSubmission.css';

export function ProjetoSubmissao({
  idAula: aulaId,
  title: titulo,
  description: descricao,
  onApproved: onAprovado,
}) {
  const [submissao, definirSubmissao] = useState(null);
  const [url, definirUrl] = useState('');
  const [busy, definirBusy] = useState(true);
  const [erro, definirErro] = useState('');
  const [reload, definirReload] = useState(0);

  useEffect(() => {
    let ativo = true;

    definirBusy(true);
    api
      .get(`/projetos/lesson/${aulaId}`)
      .then(({ data: dados }) => dados)
      .then((dados) => {
        if (ativo) {
          definirSubmissao(dados);
          definirUrl(dados?.url || '');
        }
      })
      .catch((evento) => {
        if (ativo) definirErro(evento.message);
      })
      .finally(() => {
        if (ativo) definirBusy(false);
      });

    return () => {
      ativo = false;
    };
  }, [aulaId, reload]);

  const submeter = async (evento) => {
    evento.preventDefault();
    definirErro('');

    const seguro = seguroExternoUrl(url);
    if (!seguro || seguro.startsWith('/'))
      return definirErro('Introduza um link completo http ou https.');
    definirBusy(true);
    try {
      definirSubmissao(
        await api
          .post(`/projetos/lesson/${aulaId}`, {
            url: seguro,
          })
          .then(({ data: dados }) => dados),
      );
    } catch (evento2) {
      definirErro(evento2.message);
    } finally {
      definirBusy(false);
    }
  };

  return (
    <section className="project-submission">
      <FolderGit2 />
      <span>PROJETO DA AULA</span>
      <h2>{titulo}</h2>
      <p>
        {descricao ||
          'Partilhe o link para o seu projeto. O formador vai avaliar o trabalho e enviar-lhe um parecer.'}
      </p>
      {erro && (
        <p
          role="alert"
          className="project-error"
        >
          {erro}
        </p>
      )}
      {busy && (
        <p role="status">
          <Loader2 />A carregar…
        </p>
      )}
      {submissao && (
        <div
          className="project-status"
          role="status"
        >
          <strong>
            {submissao.status === 'APPROVED'
              ? 'Projeto aprovado'
              : submissao.status === 'CHANGES_REQUESTED'
                ? 'O formador pediu alterações'
                : 'Projeto enviado para avaliação'}
          </strong>
          <a
            href={seguroExternoUrl(submissao.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver projeto
            <ExternalLink />
          </a>
          {submissao.feedback && <p>{submissao.feedback}</p>}
          <Botao
            variant="outline"
            size="sm"
            onClick={() => definirReload((n) => n + 1)}
            disabled={busy}
          >
            Atualizar estado
          </Botao>
        </div>
      )}
      {submissao?.status === 'APPROVED' ? (
        <Botao
          onClick={onAprovado}
          leftIcon={<CheckCircle2 />}
        >
          Concluir aula
        </Botao>
      ) : (
        <form onSubmit={submeter}>
          <label htmlFor="project-url">Link do repositório ou da aplicação</label>
          <input
            id="project-url"
            type="url"
            required
            maxLength={2000}
            placeholder="https://github.com/utilizador/projeto"
            value={url}
            onChange={(evento) => definirUrl(evento.target.value)}
            disabled={busy}
          />
          <Botao
            type="submit"
            isLoading={busy}
          >
            {submissao ? 'Enviar nova versão' : 'Submeter projeto'}
          </Botao>
        </form>
      )}
    </section>
  );
}
