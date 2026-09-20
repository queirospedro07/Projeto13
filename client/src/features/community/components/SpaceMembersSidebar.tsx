import React from 'react';
import { Avatar } from '../../../components/ui/Avatar';

interface SpaceMembersSidebarProps {
  space: any;
}

export const SpaceMembersSidebar: React.FC<SpaceMembersSidebarProps> = ({ space }) => {
  const members = (space?.members || []).map((m: any) => ({
    id: m.id || m.user?.id,
    name: m.user?.name || m.name || 'Membro',
    username: m.user?.username || m.username || 'utilizador',
    avatarUrl: m.user?.avatarUrl || m.avatarUrl,
    role: m.role || m.user?.role || 'MEMBER'
  })).filter((m: any) => m.id !== space?.owner?.id);

  return (
    <aside className="hidden lg:flex w-64 bg-slate-50 dark:bg-[#12141c] border-l border-slate-200 dark:border-[#222636] flex-col p-4 overflow-y-auto custom-scrollbar select-none shrink-0 transition-colors">
      {/* Creator / Owner */}
      <div className="mb-5">
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Criador & Instrutor
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-[#222636] shadow-2xs">
          <Avatar src={space?.owner?.avatarUrl} name={space?.owner?.name || 'Instrutor'} size="sm" status="online" />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{space?.owner?.name || 'Instrutor'}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Proprietário</p>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div>
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Membros da Comunidade {members.length > 0 && `(${members.length})`}
        </div>
        <div className="flex flex-col gap-1">
          {members.length > 0 ? (
            members.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-[#171a24] transition-colors"
              >
                <Avatar src={m.avatarUrl} name={m.name} size="sm" status="online" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-zinc-200 text-sm truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">@{m.username}</p>
                </div>
              </div>
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
