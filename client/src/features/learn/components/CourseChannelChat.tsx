import React, { useRef, useEffect } from 'react';
import { 
  Hash, 
  HelpCircle, 
  Sparkles, 
  Search, 
  Pin, 
  Users, 
  Send, 
  Reply, 
  X, 
  Check, 
  CheckCircle2, 
  RotateCcw 
} from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
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

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Messages Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Channel Guidelines / Topic Bar */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 truncate">
            {channel.type === 'qa' ? (
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            ) : channel.type === 'showcase' ? (
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="truncate">{channel.topic || 'Canal de interação da turma'}</span>
          </div>

          <button
            onClick={onToggleMembersList}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            title="Membros no canal"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Guiding Question Prompt Banner if Present */}
        {channel.guidingQuestion && (
          <div className="m-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Desafio / Pergunta Orientadora</p>
                <p className="text-sm font-extrabold text-slate-900 leading-snug">{channel.guidingQuestion}</p>
              </div>
            </div>
            <button
              onClick={() => onInsertGuidingPrompt(channel.guidingQuestion!)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              Responder ao Desafio
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Hash className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">Início do canal #{channel.name}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Seja o primeiro a enviar uma mensagem para os seus colegas e instrutor.
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
                      ? 'bg-emerald-50/50 border border-emerald-200/60'
                      : m.isPinned
                      ? 'bg-amber-50/50 border border-amber-200/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar src={m.sender?.avatarUrl} name={m.sender?.name || 'Aluno'} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{m.sender?.name || 'Aluno'}</span>
                      {isSenderCreator && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                          Instrutor
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {isResolved && (
                        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolvido
                        </span>
                      )}
                    </div>

                    {m.replyTo && (
                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 border-blue-500">
                        <Reply className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-bold">{m.replyTo.sender?.name || 'Aluno'}:</span>
                        <span className="truncate">{m.replyTo.content}</span>
                      </div>
                    )}

                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{m.content}</p>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute right-4 top-3 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() => onSetReplyingTo(m)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg text-xs cursor-pointer"
                      title="Responder"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {channel.type === 'qa' && onToggleResolve && (
                      <button
                        onClick={() => onToggleResolve(m.id)}
                        className={`p-1.5 hover:bg-emerald-50 rounded-lg text-xs cursor-pointer ${
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
                        className={`p-1.5 hover:bg-slate-100 rounded-lg text-xs cursor-pointer ${
                          m.isPinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-900'
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
          <div className="px-6 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-4 h-4 text-blue-600 shrink-0" />
              <span>A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"</span>
            </div>
            <button
              onClick={() => onSetReplyingTo(null)}
              className="p-1 hover:bg-blue-100 rounded-md text-blue-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form onSubmit={onSendMessage} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input
              type="text"
              placeholder={`Enviar mensagem em #${channel.name}...`}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              className="flex-1 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none"
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
      </div>

      {/* Right Online Members Sidebar */}
      {showMembersList && (
        <aside className="hidden lg:flex w-64 bg-slate-50 border-l border-slate-200 flex-col p-4 overflow-y-auto custom-scrollbar select-none shrink-0">
          <div className="mb-5">
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Instrutor do Curso
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Avatar src={creatorUser?.avatarUrl} name={creatorUser?.name || 'Instrutor'} size="sm" status="online" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{creatorUser?.name || 'Sarah Jenkins'}</p>
                <p className="text-xs text-blue-600 font-semibold">Corpo Docente</p>
              </div>
            </div>
          </div>

          <div>
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Alunos Conectados — 14
            </div>
            <div className="flex flex-col gap-1">
              {[
                { name: 'Elena Rostova', role: 'Aluno' },
                { name: 'Marc Dupont', role: 'Aluno' },
                { name: 'Diogo Silva', role: 'Aluno' },
                { name: 'Inês Ferreira', role: 'Aluno' }
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors">
                  <Avatar name={m.name} size="sm" status="online" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-400">{m.role}</p>
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
