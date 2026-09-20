import React, { useRef, useEffect } from 'react';
import { 
  Hash, 
  HelpCircle, 
  Sparkles, 
  Users, 
  Send, 
  Reply, 
  X, 
  Check, 
  CheckCircle2, 
  Pin,
  Lock
} from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Message } from '../../../types';
import { CourseChannel } from '../../../pages/learn/CoursePlayer';

interface CourseChannelChatProps {
  channel: CourseChannel;
  messages: Message[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  replyingTo: Message | null;
  onSetReplyingTo: (msg: Message | null) => void;
  onTogglePin?: (msgId: string) => void;
  onToggleResolve?: (msgId: string) => void;
  resolvedMessageIds: Set<string>;
  showMembersList: boolean;
  onToggleMembersList: () => void;
  isCreatorOrAdmin: boolean;
  creatorUser?: any;
  currentUserId?: string;
  onInsertGuidingPrompt: (prompt: string) => void;
}

export const CourseChannelChat: React.FC<CourseChannelChatProps> = ({
  channel,
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  replyingTo,
  onSetReplyingTo,
  onTogglePin,
  onToggleResolve,
  resolvedMessageIds,
  showMembersList,
  onToggleMembersList,
  isCreatorOrAdmin,
  creatorUser,
  currentUserId,
  onInsertGuidingPrompt
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isAnnouncement = channel.accessMode === 'announcement' || channel.name.includes('anuncio');
  const canPost = isCreatorOrAdmin || !isAnnouncement;

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in bg-white dark:bg-[#0c0d12]">
      {/* Messages Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0c0d12]">
        {/* Channel Guidelines / Topic Bar */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-[#151720] border-b border-blue-100 dark:border-[#222636] flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-2 truncate">
            {channel.type === 'qa' ? (
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : channel.type === 'showcase' ? (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            ) : isAnnouncement ? (
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span className="font-bold text-slate-800 dark:text-white truncate">#{channel.name}</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="truncate text-slate-600 dark:text-slate-400">{channel.topic || 'Canal de interação da turma'}</span>
            {isAnnouncement && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase">
                Apenas Leitura
              </span>
            )}
          </div>

          <button
            onClick={onToggleMembersList}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-white/80 dark:hover:bg-[#1e2130] transition-colors cursor-pointer"
            title="Membros no canal"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Guiding Question Prompt Banner if Present */}
        {channel.guidingQuestion && (
          <div className="m-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Desafio / Pergunta Orientadora</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{channel.guidingQuestion}</p>
              </div>
            </div>
            {canPost && (
              <button
                onClick={() => onInsertGuidingPrompt(channel.guidingQuestion!)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a1d28] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                Responder ao Desafio
              </button>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 bg-white dark:bg-[#0c0d12]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
              <Hash className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Início do canal #{channel.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                {isAnnouncement 
                  ? 'Os comunicados e avisos oficiais do instrutor serão publicados aqui.'
                  : 'Seja o primeiro a enviar uma mensagem para os seus colegas e instrutor.'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isResolved = resolvedMessageIds.has(m.id);
              const isSenderCreator = m.sender?.role === 'CREATOR' || m.sender?.role === 'ADMIN';

              return (
                <div
                  key={m.id}
                  className={`group relative flex gap-3.5 p-3.5 rounded-2xl transition-all ${
                    isResolved
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40'
                      : m.isPinned
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-[#151720]'
                  }`}
                >
                  <Avatar src={m.sender?.avatarUrl} name={m.sender?.name || 'Aluno'} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{m.sender?.name || 'Aluno'}</span>
                      {isSenderCreator && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold uppercase">
                          Instrutor
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {isResolved && (
                        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolvido
                        </span>
                      )}
                    </div>

                    {m.replyTo && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1a1d28] p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 border-blue-500">
                        <Reply className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-bold">{m.replyTo.sender?.name || 'Aluno'}:</span>
                        <span className="truncate">{m.replyTo.content}</span>
                      </div>
                    )}

                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{m.content}</p>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute right-4 top-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#1a1d28] border border-slate-200 dark:border-[#2a2e42] rounded-xl p-1 shadow-sm">
                    {canPost && (
                      <button
                        onClick={() => onSetReplyingTo(m)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#25293a] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs cursor-pointer"
                        title="Responder"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {channel.type === 'qa' && onToggleResolve && (
                      <button
                        onClick={() => onToggleResolve(m.id)}
                        className={`p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-xs cursor-pointer ${
                          isResolved ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={isResolved ? 'Reabrir dúvida' : 'Marcar como resolvido'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isCreatorOrAdmin && onTogglePin && (
                      <button
                        onClick={() => onTogglePin(m.id)}
                        className={`p-1.5 hover:bg-slate-100 dark:hover:bg-[#25293a] rounded-lg text-xs cursor-pointer ${
                          m.isPinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={m.isPinned ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-4 h-4 text-blue-600 shrink-0" />
              <span>A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"</span>
            </div>
            <button
              onClick={() => onSetReplyingTo(null)}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar or Announcement Lock Banner */}
        {!canPost ? (
          <div className="p-4 border-t border-slate-200 dark:border-[#222636] bg-slate-50 dark:bg-[#12141c] text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Apenas o instrutor e administradores podem enviar comunicados neste canal.</span>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-200 dark:border-[#222636] bg-white dark:bg-[#0c0d12]">
            <form onSubmit={onSendMessage} className="flex items-center gap-2 bg-slate-50 dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
              <input
                type="text"
                placeholder={`Enviar mensagem em #${channel.name}...`}
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Right Online Members Sidebar */}
      {showMembersList && (
        <aside className="hidden lg:flex w-64 bg-slate-50 dark:bg-[#12141c] border-l border-slate-200 dark:border-[#222636] flex-col p-4 overflow-y-auto custom-scrollbar select-none shrink-0">
          <div className="mb-5">
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Instrutor do Curso
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#171a24] border border-slate-200 dark:border-[#222636] shadow-2xs">
              <Avatar src={creatorUser?.avatarUrl} name={creatorUser?.name || 'Instrutor'} size="sm" status="online" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{creatorUser?.name || 'Instrutor'}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Corpo Docente</p>
              </div>
            </div>
          </div>

          <div>
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Colegas de Turma
            </div>
            <div className="flex flex-col gap-1">
              {[
                { name: 'Diogo Silva', role: 'Aluno' },
                { name: 'Inês Ferreira', role: 'Aluno' },
                { name: 'Mariana Costa', role: 'Aluno' },
                { name: 'Tiago Santos', role: 'Aluno' }
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-[#171a24] transition-colors">
                  <Avatar name={m.name} size="sm" status="online" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
