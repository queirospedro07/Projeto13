import './SpaceMembersSidebar.css';
import { Link } from 'react-router-dom';
import { Avatar } from '../Avatar';

export const SpaceMembersSidebar = ({ space }) => {
  const members = (space?.members || [])
    .map((m) => ({
      id: m.id || m.user?.id,
      name: m.user?.name || m.name || 'Membro',
      username: m.user?.username || m.username || 'utilizador',
      avatarUrl: m.user?.avatarUrl || m.avatarUrl,
      role: m.role || m.user?.role || 'MEMBER',
    }))
    .filter((m) => m.id !== space?.owner?.id);

  return (
    <aside className="space-members-sidebar-sidebar custom-scrollbar">
      {/* Criador & Instrutor */}
      <div className="space-members-sidebar-panel">
        <div className="space-members-sidebar-panel-2">Criador & Instrutor</div>
        <Link
          to={`/profile/${space?.owner?.username || space?.owner?.id || ''}`}
          className="space-members-sidebar-link subtle-shadow ui-group"
          title={
            space?.owner?.name ? `Ver perfil de ${space?.owner?.name}` : 'Ver perfil do instrutor'
          }
        >
          <Avatar
            src={space?.owner?.avatarUrl}
            name={space?.owner?.name || 'Instrutor'}
            size="sm"
            status="online"
          />
          <div className="space-members-sidebar-panel-3">
            <p className="space-members-sidebar-description">{space?.owner?.name || 'Instrutor'}</p>
            <p className="space-members-sidebar-description-2">Proprietário</p>
          </div>
        </Link>
      </div>

      {/* Membros da Comunidade */}
      <div>
        <div className="space-members-sidebar-panel-2">
          Membros da Comunidade {members.length > 0 && `(${members.length})`}
        </div>
        <div className="space-members-sidebar-panel-4">
          {members.length > 0 ? (
            members.map((m) => (
              <Link
                key={m.id}
                to={`/profile/${m.username || m.id || ''}`}
                className="space-members-sidebar-link-2 ui-group"
                title={`Ver perfil de ${m.name}`}
              >
                <Avatar
                  src={m.avatarUrl}
                  name={m.name}
                  size="sm"
                  status="online"
                />
                <div className="space-members-sidebar-panel-3">
                  <p className="space-members-sidebar-description-3">{m.name}</p>
                  <p className="space-members-sidebar-description-4">@{m.username}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="space-members-sidebar-panel-5">
              <p className="space-members-sidebar-description-5">
                Ainda não há outros membros registados nesta comunidade.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
