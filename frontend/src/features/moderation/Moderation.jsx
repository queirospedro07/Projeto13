import React, { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import './Moderation.css';
export function ReportButton({ targetType, targetId }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [sent, setSent] = useState(false);
  if (!user || !targetId || (targetType === 'user' && targetId === user.id)) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.reportContent({ targetType, targetId, reason });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        className="report-content-button"
        onClick={() => {
          setOpen(true);
          setSent(false);
          setError('');
        }}
      >
        <Flag />
        Denunciar
      </button>
      <Modal isOpen={open} onClose={() => !busy && setOpen(false)} title="Denunciar conteúdo">
        {sent ? (
          <div role="status">
            <p>A denúncia foi registada. A administração vai analisar o conteúdo.</p>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        ) : (
          <form className="report-form" onSubmit={submit}>
            <label htmlFor="report-reason">O que aconteceu?</label>
            <p>Descreva o problema para ajudar a equipa a analisar o conteúdo.</p>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={2000}
              rows={5}
              required
            />
            {error && <p role="alert">{error}</p>}
            <Button type="submit" isLoading={busy}>
              Enviar denúncia
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
export function ReportQueue() {
  const [items, setItems] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      setItems(await api.getAdminReports());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const update = async (id, status) => {
    setBusy(true);
    try {
      await api.reviewReport(id, status, '');
      await load();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  return (
    <section className="moderation-queue">
      <header>
        <h2>Denúncias da comunidade</h2>
        <Button size="sm" variant="outline" onClick={load} disabled={busy}>
          Atualizar
        </Button>
      </header>
      {error && <p role="alert">{error}</p>}
      {!items.length && !error && (
        <p>{busy ? 'A carregar…' : 'Não existem denúncias registadas.'}</p>
      )}
      {items.map((item) => (
        <article key={item.id}>
          <strong>{item.reporterName}</strong>
          <span>
            {item.tipo_alvo} · {item.estado}
          </span>
          <p>{item.motivo}</p>
          {item.estado === 'OPEN' && (
            <div>
              <Button size="sm" onClick={() => update(item.id, 'RESOLVED')} disabled={busy}>
                Marcar como resolvida
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => update(item.id, 'DISMISSED')}
                disabled={busy}
              >
                Arquivar sem ação
              </Button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
