import React from 'react';
import { Avatar } from '../../../components/ui/Avatar';

interface SpaceMembersSidebarProps {
  space: any;
}

export const SpaceMembersSidebar: React.FC<SpaceMembersSidebarProps> = ({ space }) => {
  return (
    <aside className="hidden lg:flex w-64 bg-slate-50 border-l border-slate-200 flex-col p-4 overflow-y-auto custom-scrollbar select-none shrink-0">
      {/* Creator / Owner */}
      <div className="mb-5">
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Criador & Instrutor
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors">
          <Avatar src={space?.owner?.avatarUrl} name={space?.owner?.name} size="sm" status="online" />
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{space?.owner?.name}</p>
            <p className="text-xs text-blue-600 font-semibold">Proprietário</p>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div>
        <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Membros — {space?.members?.length || 5}
        </div>
        <div className="flex flex-col gap-1">
          {space?.members?.map((m: any) => (
            <div
              key={m.id}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors"
            >
              <Avatar src={m.user?.avatarUrl} name={m.user?.name} size="sm" status="online" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{m.user?.name}</p>
                <p className="text-xs text-slate-400">@{m.user?.username}</p>
              </div>
            </div>
          )) || [
            { id: '1', name: 'Elena Rostova', username: 'elena_r' },
            { id: '2', name: 'Marc Dupont', username: 'marc_dev' },
            { id: '3', name: 'Diogo Silva', username: 'diogo_s' },
          ].map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors">
              <Avatar name={m.name} size="sm" status="online" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{m.name}</p>
                <p className="text-xs text-slate-400">@{m.username}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
