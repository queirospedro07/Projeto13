import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../components/ui/Avatar';

export const SpaceMembersSidebar = ({
  space
}) => {
  const members = (space?.members || []).map(m => ({
    id: m.id || m.user?.id,
    name: m.user?.name || m.name || 'Membro',
    username: m.user?.username || m.username || 'utilizador',
    avatarUrl: m.user?.avatarUrl || m.avatarUrl,
    role: m.role || m.user?.role || 'MEMBER'
  })).filter(m => m.id !== space?.owner?.id);

  return (
    <aside className="hidden lg:flex w-64 bg-slate-50 dark:bg-[#12141c] border-l border-slate-200 dark:border-[#222636] flex-col p-4 overflow-y-auto custom-scrollbar select-none shrink-0 transition-colors">
      {/* Criador & Instrutor */}
      <div className="mb-5">
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Criador & Instrutor
        </div>
        <Link
          to={`/profile/${space?.owner?.username || space?.owner?.id || ''}`}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-[#222636] shadow-2xs hover:border-slate-300 dark:hover:border-neutral-700 transition-colors cursor-pointer group"
          title={space?.owner?.name ? `Ver perfil de ${space?.owner?.name}` : 'Ver perfil do instrutor'}
        >
          <Avatar src={space?.owner?.avatarUrl} name={space?.owner?.name || 'Instrutor'} size="sm" status="online" />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:underline">
              {space?.owner?.name || 'Instrutor'}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Proprietário</p>
          </div>
        </Link>
      </div>

      {/* Membros da Comunidade */}
      <div>
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Membros da Comunidade {members.length > 0 && `(${members.length})`}
        </div>
        <div className="flex flex-col gap-1">
          {members.length > 0 ? (
            members.map(m => (
              <Link
                key={m.id}
                to={`/profile/${m.username || m.id || ''}`}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-[#171a24] transition-colors cursor-pointer group"
                title={`Ver perfil de ${m.name}`}
              >
                <Avatar src={m.avatarUrl} name={m.name} size="sm" status="online" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm truncate group-hover:underline">
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">@{m.username}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-[#222636] text-center">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Ainda não há outros membros registados nesta comunidade.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};