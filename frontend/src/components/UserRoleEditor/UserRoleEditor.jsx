import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Select } from '../Select';
import './UserRoleEditor.css';

const labels = {
  STUDENT: 'Aluno',
  CREATOR: 'Formador',
  ADMIN: 'Administrador',
  ADMIN_CREATOR: 'Administrador e formador',
};

export default function UserRoleEditor({ user, onChanged }) {
  const { user: actor } = useAuth();
  const current = user.role === 'ADMIN' && user.isTeacher === true ? 'ADMIN_CREATOR' : user.role;
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
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        aria-label={`Alterar cargo de ${user.name}`}
        onClick={() => {
          setChoice(current);
          setError('');
          setConfirm(true);
        }}
      >
        Alterar cargo
      </Button>
      <Modal
        isOpen={confirm}
        title="Alterar cargo"
        maxWidth="md"
        onClose={() => !busy && setConfirm(false)}
      >
        <div className="user-role-editor">
          <div className="user-role-editor-account">
            <strong>{user.name}</strong>
            <span>Cargo atual: {labels[current]}</span>
          </div>
          <label>
            Novo cargo
            <Select
              aria-label={`Cargo de ${user.name}`}
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              disabled={busy}
            >
              {Object.entries(labels).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <p>
            Ao confirmar, as sessões deste utilizador serão encerradas para aplicar as novas
            permissões.
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="user-role-editor-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              isLoading={busy}
              disabled={busy || choice === current}
              onClick={save}
            >
              Confirmar cargo
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
