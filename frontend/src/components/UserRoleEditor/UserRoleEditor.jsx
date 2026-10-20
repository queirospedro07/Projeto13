import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Select } from '../Select';

const labels = {
  STUDENT: 'Aluno',
  CREATOR: 'Formador',
  ADMIN: 'Administrador',
  ADMIN_CREATOR: 'Administrador e formador',
};
export default function UserRoleEditor({ user, onChanged }) {
  const { user: actor } = useAuth();
  const current = user.role === 'ADMIN' && user.isTeacher !== false ? 'ADMIN_CREATOR' : user.role;
  const [choice, setChoice] = useState(current);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.put(`/admin/users/${user.id}/role`, {
        role: choice === 'ADMIN_CREATOR' ? 'ADMIN' : choice,
        isTeacher: choice === 'CREATOR' || choice === 'ADMIN_CREATOR',
      });
      setConfirm(false);
      await onChanged();
    } catch (error) {
      setError(error.message || 'Não foi possível alterar o cargo.');
    } finally {
      setBusy(false);
    }
  }
  if (actor?.id === user.id) return <small>A sua conta</small>;
  return (
    <>
      <Select
        aria-label={`Cargo de ${user.name}`}
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        disabled={busy}
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy || choice === current}
        onClick={() => setConfirm(true)}
      >
        Alterar cargo
      </Button>
      <Modal
        isOpen={confirm}
        title="Confirmar alteração de cargo"
        maxWidth="md"
        onClose={() => !busy && setConfirm(false)}
      >
        <p>
          O cargo de <strong>{user.name}</strong> passa de <strong>{labels[current]}</strong> para{' '}
          <strong>{labels[choice]}</strong>.
        </p>
        <p>As sessões atuais serão encerradas. O utilizador terá de iniciar sessão novamente.</p>
        {error && <p role="alert">{error}</p>}
        <div className="admin-dashboard-panel-64">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
          <Button isLoading={busy} disabled={busy} onClick={save}>
            Confirmar cargo
          </Button>
        </div>
      </Modal>
    </>
  );
}
