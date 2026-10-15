import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import './SupportTickets.css';
export function SupportTickets({ user, open, onClose }) {
  const [items, setItems] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [subject, setSubject] = useState(''),
    [message, setMessage] = useState(''),
    [replies, setReplies] = useState({});
  const load = async () => {
    try {
      setItems(await api.getSupportTickets());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };
  const userId = user?.id;
  useEffect(() => {
    if (userId) load();
  }, [userId]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createSupportTicket({ subject, message });
      setSubject('');
      setMessage('');
      onClose();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reply = async (id) => {
    setBusy(true);
    try {
      await api.replySupportTicket(id, { reply: replies[id], status: 'RESOLVED' });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!user) return null;
  return (
    <section className="support-tickets">
      <header>
        <h2>{user.role === 'ADMIN' ? 'Pedidos de suporte' : 'Os seus pedidos de suporte'}</h2>
        <Button variant="outline" size="sm" onClick={load}>
          Atualizar
        </Button>
      </header>
      {error && <p role="alert">{error}</p>}
      {!items.length && !error && <p>Ainda não existem pedidos.</p>}
      {items.map((item) => (
        <article key={item.id}>
          <span>
            {item.estado === 'OPEN' ? 'Em aberto' : 'Respondido'} ·{' '}
            {new Date(item.criado_em).toLocaleDateString('pt-PT')}
          </span>
          <h3>{item.assunto}</h3>
          {item.studentName && <p>{item.studentName}</p>}
          <p>{item.mensagem}</p>
          {item.resposta && <blockquote>{item.resposta}</blockquote>}
          {user.role === 'ADMIN' && item.estado === 'OPEN' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                reply(item.id);
              }}
            >
              <label htmlFor={`reply-${item.id}`}>Resposta ao utilizador</label>
              <textarea
                id={`reply-${item.id}`}
                value={replies[item.id] || ''}
                onChange={(e) => setReplies({ ...replies, [item.id]: e.target.value })}
                required
                maxLength={5000}
              />
              <Button type="submit" disabled={busy}>
                Responder e resolver
              </Button>
            </form>
          )}
        </article>
      ))}
      <Modal isOpen={open} onClose={onClose} title="Novo pedido de suporte">
        <form className="support-ticket-form" onSubmit={submit}>
          <p>
            Explique o problema e indique a página ou o curso onde aconteceu. Não inclua
            palavras-passe.
          </p>
          <label htmlFor="support-subject">Assunto</label>
          <input
            id="support-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={160}
          />
          <label htmlFor="support-message">Mensagem</label>
          <textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={20}
            maxLength={5000}
            rows={6}
          />
          {error && <p role="alert">{error}</p>}
          <Button type="submit" isLoading={busy}>
            Enviar pedido
          </Button>
        </form>
      </Modal>
    </section>
  );
}
