import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuCheck, LuCheckCheck, LuArrowUpRight } from 'react-icons/lu';
import { api } from '../../services/api';
import { Janela } from '../Dialog';
import { Botao } from '../Button';
import { EsqueletoLinhas } from '../Skeleton';
import './Notifications.css';

function formatarData(valor) {
  const data = new Date(valor);
  if (!valor || Number.isNaN(data.getTime())) return '';

  return data.toLocaleString('pt-PT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Notificacoes() {
  const [abrir, definirAbrir] = useState(false);
  const [itens, definirItens] = useState([]);
  const [carregamento, definirCarregamento] = useState(true);
  const [erro, definirErro] = useState('');
  const [busy, definirBusy] = useState(false);
  const [filtro, definirFiltro] = useState('todas');
  const navigate = useNavigate();
  const carregar = useCallback(async (signal) => {
    try {
      const { data: dados } = await api.get('/notificacoes', { signal });
      if (!signal?.aborted) {
        definirItens(
          Array.isArray(dados) ? [...new Map(dados.map((item) => [item.id, item])).values()] : [],
        );
        definirErro('');
      }
    } catch (falha) {
      if (!signal?.aborted)
        definirErro(falha.message || 'Não foi possível carregar as notificações.');
    } finally {
      if (!signal?.aborted) definirCarregamento(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const atualizar = () => {
      if (!document.hidden) carregar(controlador.signal);
    };

    atualizar();

    const temporizador = setInterval(atualizar, 60000);

    window.addEventListener('focus', atualizar);

    return () => {
      controlador.abort();
      clearInterval(temporizador);
      window.removeEventListener('focus', atualizar);
    };
  }, [carregar]);

  const naoLidas = itens.filter((item) => !item.estaLida).length;
  const visiveis = itens
    .filter((item) => filtro === 'todas' || !item.estaLida)
    .toSorted((a, b) => (Date.parse(b.criadoEm) || 0) - (Date.parse(a.criadoEm) || 0));

  async function marcarLida(item) {
    if (item.estaLida) return;
    await api.put(`/notificacoes/${item.id}/ler`);
    definirItens((atual) =>
      atual.map((valor) => (valor.id === item.id ? { ...valor, estaLida: true } : valor)),
    );
  }

  async function tratarItem(item, abrirDestino) {
    if (busy) return;
    definirBusy(true);
    definirErro('');
    try {
      await marcarLida(item);
      if (abrirDestino) {
        const destino =
          typeof item.link === 'string' &&
          /^\/(?!\/)/.test(item.link) &&
          !item.link.includes('\\') &&
          !Array.from(item.link).some((carater) => carater.charCodeAt(0) < 32)
            ? item.link
            : '/painel';

        definirAbrir(false);
        navigate(destino);
      }
    } catch (falha) {
      definirErro(falha.message || 'Não foi possível atualizar a notificação.');
    } finally {
      definirBusy(false);
    }
  }

  async function marcarTodas() {
    if (busy || !naoLidas) return;
    definirBusy(true);
    definirErro('');
    try {
      await api.put('/notificacoes/ler-todas');
      definirItens((atual) => atual.map((item) => ({ ...item, estaLida: true })));
    } catch (falha) {
      definirErro(falha.message || 'Não foi possível atualizar as notificações.');
    } finally {
      definirBusy(false);
    }
  }

  return (
    <>
      <button
        className="notifications-trigger"
        type="button"
        aria-label={`Notificações (${naoLidas} por ler)`}
        aria-haspopup="dialog"
        aria-expanded={abrir}
        onClick={() => {
          definirAbrir(true);
          carregar();
        }}
      >
        <LuBell aria-hidden="true" />
        {naoLidas > 0 && <span aria-hidden="true">{naoLidas > 99 ? '99+' : naoLidas}</span>}
      </button>
      <Janela
        isOpen={abrir}
        title="Notificações"
        maxWidth="lg"
        onClose={() => definirAbrir(false)}
      >
        <section
          className="notifications-center"
          aria-label="Centro de notificações"
          aria-busy={busy}
        >
          <p
            className="notifications-summary"
            role="status"
          >
            {carregamento
              ? 'A carregar notificações…'
              : naoLidas
                ? `${naoLidas} ${naoLidas === 1 ? 'notificação por ler' : 'notificações por ler'}`
                : 'Está tudo em dia.'}
          </p>
          <div className="notifications-toolbar">
            <div
              className="notifications-filters"
              role="group"
              aria-label="Filtrar notificações"
            >
              <button
                type="button"
                aria-pressed={filtro === 'todas'}
                onClick={() => definirFiltro('todas')}
              >
                Todas
              </button>
              <button
                type="button"
                aria-pressed={filtro === 'por-ler'}
                onClick={() => definirFiltro('por-ler')}
              >
                Por ler
              </button>
            </div>
            <button
              className="notifications-read-all"
              type="button"
              disabled={busy || !naoLidas}
              onClick={marcarTodas}
            >
              <LuCheckCheck aria-hidden="true" /> Marcar todas como lidas
            </button>
          </div>
          {erro && (
            <div
              className="notifications-error"
              role="alert"
            >
              <p>{erro}</p>
              <Botao
                variant="secondary"
                size="sm"
                onClick={() => carregar()}
              >
                Tentar novamente
              </Botao>
            </div>
          )}
          {carregamento && (
            <EsqueletoLinhas count={4} withAvatar label="A carregar notificações" />
          )}
          {!carregamento && !erro && !visiveis.length && (
            <div className="notifications-empty">
              <LuBell aria-hidden="true" />
              <h4>
                {filtro === 'por-ler'
                  ? 'Nenhuma notificação por ler'
                  : 'Ainda não tem notificações'}
              </h4>
              <p>
                {filtro === 'por-ler'
                  ? 'Pode consultar as anteriores no separador Todas.'
                  : 'Os avisos sobre os seus cursos e a sua conta aparecem aqui.'}
              </p>
            </div>
          )}
          <ul className="notifications-list">
            {visiveis.map((item) => (
              <li
                key={item.id}
                className={
                  item.estaLida ? 'notifications-row' : 'notifications-row notifications-unread'
                }
              >
                <button
                  className="notifications-open"
                  type="button"
                  disabled={busy}
                  onClick={() => tratarItem(item, true)}
                >
                  <span className="notifications-item-heading">
                    <strong>{item.title}</strong>
                    <LuArrowUpRight aria-hidden="true" />
                  </span>
                  <p>{item.content}</p>
                  <span className="notifications-meta">
                    <time
                      dateTime={
                        Number.isNaN(Date.parse(item.criadoEm))
                          ? undefined
                          : new Date(item.criadoEm).toISOString()
                      }
                    >
                      {formatarData(item.criadoEm)}
                    </time>
                    {!item.estaLida && <span>Por ler</span>}
                  </span>
                </button>
                {!item.estaLida && (
                  <button
                    className="notifications-mark"
                    type="button"
                    disabled={busy}
                    aria-label="Marcar como lida"
                    title="Marcar como lida"
                    onClick={() => tratarItem(item, false)}
                  >
                    <LuCheck aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </Janela>
    </>
  );
}
