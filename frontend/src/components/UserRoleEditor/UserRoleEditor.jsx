import { useState } from 'react';
import { useAutenticacao } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Janela } from '../Dialog';
import { Botao } from '../Button';
import { Seletor } from '../Select';
import './UserRoleEditor.css';

const labels = {
  STUDENT: 'Aluno',
  CREATOR: 'Formador',
  ADMIN: 'Administrador',
  ADMIN_CREATOR: 'Administrador e formador',
};

export default function UtilizadorCargoEditor({ user: utilizador, onChanged }) {
  const { user: actor } = useAutenticacao();
  const atual =
    utilizador.role === 'ADMIN' && utilizador.eFormador === true
      ? 'ADMIN_CREATOR'
      : utilizador.role;
  const [choice, definirChoice] = useState(atual);
  const [confirmar, definirConfirmar] = useState(false);
  const [busy, definirBusy] = useState(false);
  const [erro, definirErro] = useState('');

  async function save() {
    if (busy) return;
    definirBusy(true);
    definirErro('');
    try {
      await api.put(`/administracao/utilizadores/${utilizador.id}/cargo`, {
        role: choice === 'ADMIN_CREATOR' ? 'ADMIN' : choice,
        eFormador: choice === 'CREATOR' || choice === 'ADMIN_CREATOR',
      });
      definirConfirmar(false);
      await onChanged();
    } catch (erro2) {
      definirErro(erro2.message || 'Não foi possível alterar o cargo.');
    } finally {
      definirBusy(false);
    }
  }

  if (actor?.id === utilizador.id) return <small>A sua conta</small>;

  return (
    <>
      <Botao
        size="sm"
        variant="secondary"
        disabled={busy}
        aria-label={`Alterar cargo de ${utilizador.name}`}
        onClick={() => {
          definirChoice(atual);
          definirErro('');
          definirConfirmar(true);
        }}
      >
        Alterar cargo
      </Botao>
      <Janela
        isOpen={confirmar}
        title="Alterar cargo"
        maxWidth="md"
        onClose={() => !busy && definirConfirmar(false)}
      >
        <div className="user-role-editor">
          <div className="user-role-editor-account">
            <strong>{utilizador.name}</strong>
            <span>Cargo atual: {labels[atual]}</span>
          </div>
          <label>
            Novo cargo
            <Seletor
              aria-label={`Cargo de ${utilizador.name}`}
              value={choice}
              onChange={(evento) => definirChoice(evento.target.value)}
              disabled={busy}
            >
              {Object.entries(labels).map(([valor, label]) => (
                <option
                  key={valor}
                  value={valor}
                >
                  {label}
                </option>
              ))}
            </Seletor>
          </label>
          <p>
            Ao confirmar, as sessões deste utilizador serão encerradas para aplicar as novas
            permissões.
          </p>
          {erro && <p role="alert">{erro}</p>}
          <div className="user-role-editor-actions">
            <Botao
              variant="secondary"
              disabled={busy}
              onClick={() => definirConfirmar(false)}
            >
              Cancelar
            </Botao>
            <Botao
              isLoading={busy}
              disabled={busy || choice === atual}
              onClick={save}
            >
              Confirmar cargo
            </Botao>
          </div>
        </div>
      </Janela>
    </>
  );
}
