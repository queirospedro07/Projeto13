import React, { useRef, useEffect } from 'react';
import { Hash, Search, Pin, Users, Send, Reply, X, ThumbsUp } from 'lucide-react';
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
  onToggleReaction,
  onTogglePin
}) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages.length]);
  return <div className="flex-1 flex flex-col min-w-0 bg-white">
      
      <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Hash className="w-5 h-5 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900 text-base truncate">
            {currentChannel?.name || 'geral'}
          </span>
          {currentChannel?.topic && <>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 truncate max-w-md hidden sm:inline font-medium">
                {currentChannel.topic}
              </span>
            </>}
        </div>

        <div className="flex items-center gap-2.5">
          
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Pesquisar..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-36 focus:w-52 transition-all" />
          </div>

          
          <button onClick={onTogglePinnedOnly} className={`p-2 rounded-xl border transition-colors cursor-pointer ${pinnedOnly ? 'bg-amber-50 text-amber-600 border-amber-300' : 'text-slate-500 hover:text-slate-800 border-slate-200'}`} title="Filtrar mensagens fixadas">
            <Pin className="w-4 h-4" />
          </button>

          
          <button onClick={onToggleMembers} className={`p-2 rounded-xl border transition-colors cursor-pointer ${showMembers ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-500 hover:text-slate-800 border-slate-200'}`} title="Mostrar membros">
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Bem-vindo ao canal #{currentChannel?.name || 'geral'}!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {currentChannel?.topic || 'Este é o início do histórico de mensagens deste canal.'}
            </p>
          </div> : messages.map(m => <div key={m.id} className={`group relative flex gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors ${m.isPinned ? 'bg-amber-50/60 border border-amber-200/60' : ''}`}>
              <Avatar src={m.sender?.avatarUrl} name={m.sender?.name || 'Membro'} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900">
                    {m.sender?.name || 'Membro'}
                  </span>
                  {m.sender?.role === 'CREATOR' && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase">
                      Criador
                    </span>}
                  <span className="text-xs text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit'
              })}
                  </span>
                  {m.isPinned && <span className="text-xs font-bold text-amber-600 flex items-center gap-1 ml-auto">
                      <Pin className="w-3 h-3" /> Fixada
                    </span>}
                </div>

                
                {m.replyTo && <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 border-blue-500">
                    <Reply className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="font-bold">{m.replyTo.sender?.name || 'Membro'}:</span>
                    <span className="truncate">{m.replyTo.content}</span>
                  </div>}

                <p className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-line">
                  {m.content}
                </p>

                
                {m.reactions && m.reactions.length > 0 && <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {m.reactions.map((r, rIdx) => <button key={rIdx} onClick={() => onToggleReaction(m.id, r.emoji)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors">
                        <span>{r.emoji}</span>
                        <span className="font-bold text-slate-600">{r.count || 1}</span>
                      </button>)}
                  </div>}
              </div>

              
              <div className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs rounded-lg p-0.5">
                <button onClick={() => onToggleReaction(m.id, 'gosto')} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-md text-xs cursor-pointer transition-colors" title="Gosto" aria-label="Gosto">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onSetReplyingTo(m)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-md text-xs cursor-pointer transition-colors" title="Responder" aria-label="Responder">
                  <Reply className="w-3.5 h-3.5" />
                </button>
                {isOwnerOrAdmin && <button onClick={() => onTogglePin(m.id)} className={`p-1.5 hover:bg-slate-100 rounded-lg text-xs cursor-pointer ${m.isPinned ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'}`} title={m.isPinned ? 'Desafixar' : 'Fixar'}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>}
              </div>
            </div>)}
        <div ref={messagesEndRef} />
      </div>

      
      {replyingTo && <div className="px-6 py-2 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"
            </span>
          </div>
          <button onClick={() => onSetReplyingTo(null)} className="p-1 hover:bg-blue-100 rounded-md text-blue-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>}

      
      {typingUsers.length > 0 && <div className="px-6 py-1 text-xs text-slate-400 italic">
          {typingUsers.join(', ')}{' '}
          {typingUsers.length === 1 ? 'está a escrever...' : 'estão a escrever...'}
        </div>}

      
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={onSendMessage} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input type="text" placeholder={`Enviar mensagem em #${currentChannel?.name || 'geral'}...`} value={inputContent} onChange={onInputChange} className="flex-1 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none" />
          <button type="submit" disabled={!inputContent.trim()} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer shadow-xs">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>;
};