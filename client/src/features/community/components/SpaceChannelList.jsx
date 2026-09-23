import React from 'react';
import { Link } from 'react-router-dom';
import { Hash, Volume2, ArrowLeft, Plus, Play, ArrowRight } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
export const SpaceChannelList = ({
  space,
  channels,
  currentChannel,
  inVoiceRoom,
  isOwnerOrAdmin,
  onSelectChannel,
  onSelectVoiceRoom,
  onDisconnectVoiceRoom,
  onOpenCreateChannelModal
}) => {
  return <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        
        <Link to={`/community/${space?.slug || space?.id}`} className="h-16 px-4 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={space?.logoUrl} name={space?.name} size="sm" />
            <span className="font-bold text-slate-900 text-sm truncate">
              {space?.name || 'Comunidade'}
            </span>
          </div>
          <ArrowLeft className="w-4 h-4 text-slate-400 hover:text-slate-900" />
        </Link>
        
        <div className="p-3 pb-0">
          <Link to={`/learn/${space?.courseId || space?.slug || space?.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 shadow-2xs transition-all">
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ver Aulas & Vídeos</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        
        <div className="p-3 flex flex-col gap-4">
          
          <div>
            <div className="px-3 pb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Canais de Texto</span>
              {isOwnerOrAdmin && <button onClick={onOpenCreateChannelModal} className="hover:text-blue-600 font-bold p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer" title="Criar canal">
                  <Plus className="w-3.5 h-3.5" />
                </button>}
            </div>
            <div className="flex flex-col gap-1">
              {channels.map(ch => {
              const isSelected = ch.id === currentChannel?.id && !inVoiceRoom;
              return <button key={ch.id} onClick={() => onSelectChannel(ch)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${isSelected ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}>
                    <Hash className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{ch.name}</span>
                  </button>;
            })}
            </div>
          </div>

          
          <div>
            <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Salas de Voz & Transmissão
            </div>
            <div className="flex flex-col gap-1">
              {['Sala de Estudo', 'Foco & Silêncio', 'Tira-Dúvidas'].map((roomName, rIdx) => {
              const isActive = inVoiceRoom === roomName;
              return <button key={roomName} onClick={() => onSelectVoiceRoom(roomName)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}>
                    <div className="flex items-center gap-2.5 truncate">
                      <Volume2 className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="truncate">{roomName}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      {rIdx === 0 ? '8' : '3'}
                    </span>
                  </button>;
            })}
            </div>
          </div>
        </div>
      </div>

      
      {inVoiceRoom && <div className="p-3 border-t border-slate-200 bg-white flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate max-w-[120px]">{inVoiceRoom}</span>
            </div>
            <button onClick={onDisconnectVoiceRoom} className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">
              Desconectar
            </button>
          </div>
        </div>}
    </aside>;
};