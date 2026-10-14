import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hash, Search, Pin, Users, Send, Reply, X } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
export const SpaceMessageStream = ({
  currentChannel,
  messages,
  inputContent,
  onInputChange,
  onSendMessage,
  replyingTo,
  onSetReplyingTo,
  typingUsers,
  searchQuery,
  onSearchChange,
  pinnedOnly,
  onTogglePinnedOnly,
  showMembers,
  onToggleMembers,
  isOwnerOrAdmin,
  onTogglePin
}) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages.length]);
  return <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0c0d12]">
      
      <div className="h-16 pl-14 md:pl-6 pr-4 md:pr-6 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Hash className="w-5 h-5 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
            {currentChannel?.name || 'geral'}
          </span>
          {currentChannel?.topic && <>
              <span className="text-slate-300 dark:text-neutral-700">|</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-md hidden sm:inline font-medium">
                {currentChannel.topic}
              </span>
            </>}
        </div>

        <div className="flex items-center gap-2.5">
          
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-36 focus:w-52 transition-all" />
          </div>

          
          <button onClick={onTogglePinnedOnly} className={`p-2 rounded-xl border transition-colors cursor-pointer ${pinnedOnly ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-neutral-800'}`} title="Filtrar mensagens fixadas">
            <Pin className="w-4 h-4" />
          </button>

          
          <button onClick={onToggleMembers} className={`p-2 rounded-xl border transition-colors cursor-pointer ${showMembers ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white border-slate-200 dark:border-neutral-800'}`} title="Mostrar membros">
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
              Bem-vindo ao canal #{currentChannel?.name || 'geral'}!
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
              {currentChannel?.topic || 'Este é o início do histórico de mensagens deste canal.'}
            </p>
          </div> : messages.map(m => <div key={m.id} className={`group relative flex gap-3.5 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#151720] transition-colors ${m.isPinned ? 'bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40' : ''}`}>
              <Link
                to={`/profile/${m.sender?.username || m.sender?.id || ''}`}
                className="shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
              >
                <Avatar src={m.sender?.avatarUrl} name={m.sender?.name || 'Membro'} size="md" />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/profile/${m.sender?.username || m.sender?.id || ''}`}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:underline cursor-pointer"
                    title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                  >
                    {m.sender?.name || 'Membro'}
                  </Link>
                  {m.sender?.role === 'CREATOR' && <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] uppercase">
                      Criador
                    </span>}
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit'
              })}
                  </span>
                  {m.isPinned && <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 ml-auto">
                      <Pin className="w-3 h-3" /> Fixada
                    </span>}
                </div>

                
                {m.replyTo && <div className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-[#1a1d28] p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 border-blue-500">
                    <Reply className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="font-bold">{m.replyTo.sender?.name || 'Membro'}:</span>
                    <span className="truncate">{m.replyTo.content}</span>
                  </div>}

                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words whitespace-pre-line">
                  {m.content}
                </p>

                
              </div>

              <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-[#1a1d28]/95 backdrop-blur-md border border-slate-200/80 dark:border-[#2a2e42] shadow-xs rounded-lg p-0.5">
                <button onClick={() => onSetReplyingTo(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#25293a] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md text-xs cursor-pointer transition-colors" title="Responder" aria-label="Responder">
                  <Reply className="w-3.5 h-3.5" />
                </button>
                {isOwnerOrAdmin && <button onClick={() => onTogglePin(m.id)} className={`p-1.5 hover:bg-slate-100 dark:hover:bg-[#25293a] rounded-lg text-xs cursor-pointer ${m.isPinned ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`} title={m.isPinned ? 'Desafixar' : 'Fixar'}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>}
              </div>
            </div>)}
        <div ref={messagesEndRef} />
      </div>

      
      {replyingTo && <div className="px-6 py-2 bg-blue-50/80 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"
            </span>
          </div>
          <button onClick={() => onSetReplyingTo(null)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>}

      
      {typingUsers.length > 0 && <div className="px-6 py-1 text-xs text-slate-400 italic">
          {typingUsers.join(', ')}{' '}
          {typingUsers.length === 1 ? 'está a escrever...' : 'estão a escrever...'}
        </div>}

      
      <div className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12]">
        <form onSubmit={onSendMessage} className="flex items-center gap-2 bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-neutral-800 rounded-2xl px-3 sm:px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
          <input type="text" placeholder={`Enviar mensagem em #${currentChannel?.name || 'geral'}...`} value={inputContent} onChange={onInputChange} className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none min-w-0" />
          <button type="submit" disabled={!inputContent.trim()} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer shadow-xs shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>;
};