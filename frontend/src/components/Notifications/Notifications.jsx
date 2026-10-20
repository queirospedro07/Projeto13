import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell } from 'react-icons/lu';
import { api } from '../../services/api';
import { Modal } from '../Modal';
import { Button } from '../Button';
import './Notifications.css';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const load = useCallback(async (signal) => {
    try {
      const { data } = await api.get('/notifications', { signal });
      if (!signal?.aborted) {
        setItems(data);
        setError('');
      }
    } catch (error) {
      if (!signal?.aborted) setError(error.message || 'Não foi possível carregar as notificações.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (!document.hidden) load(controller.signal);
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [load]);
  const unread = items.filter((item) => !item.isRead).length;
  async function read(item) {
    if (busy) return;
    setBusy(true);
    try {
      await api.put(`/notifications/${item.id}/read`);
      setItems((current) =>
        current.map((value) => (value.id === item.id ? { ...value, isRead: true } : value)),
      );
      setOpen(false);
      const target =
        typeof item.link === 'string' &&
        /^\/(?!\/)/.test(item.link) &&
        !item.link.includes('\\') &&
        !Array.from(item.link).some((character) => character.charCodeAt(0) < 32)
          ? item.link
          : '/dashboard';
      navigate(target);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function readAll() {
    setBusy(true);
    try {
      await api.put('/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="notifications-trigger"
        type="button"
        aria-label={`Notificações (${unread} por ler)`}
        onClick={() => {
          setOpen(true);
          load();
        }}
      >
        <LuBell aria-hidden="true" />
        {unread > 0 && <span>{unread}</span>}
      </button>
      <Modal isOpen={open} title="Notificações" maxWidth="lg" onClose={() => setOpen(false)}>
        {loading && <p role="status">A carregar notificações…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button variant="secondary" onClick={() => load()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {unread > 0 && (
          <Button variant="secondary" disabled={busy} onClick={readAll}>
            Marcar todas como lidas
          </Button>
        )}
        {!loading && !error && !items.length && <p>Ainda não tem notificações.</p>}
        <ul className="notifications-list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => read(item)}
                className={item.isRead ? '' : 'notifications-unread'}
              >
                <strong>
                  {!item.isRead && '● '}
                  {item.title}
                </strong>
                <p>{item.content}</p>
                <small>{new Date(item.createdAt).toLocaleString('pt-PT')}</small>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
