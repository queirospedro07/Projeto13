import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Send, MessageSquare } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Message } from '../../../types';

interface DirectChatPaneProps {
  activePeer: any;
  messages: Message[];
  currentUserId?: string;
  draft: string;
  onDraftChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onStartCall: () => void;
}

export const DirectChatPane: React.FC<DirectChatPaneProps> = ({
  activePeer,
  messages,
  currentUserId,
  draft,
  onDraftChange,
  onSendMessage,
  onStartCall
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden animate-fade-in">
      {/* Chat Header */}
      <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <Avatar
            src={activePeer.avatarUrl}
            name={activePeer.name}
            size="md"
            className="rounded-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${activePeer.username}`} className="font-extrabold text-slate-950 text-base hover:underline">
                {activePeer.name}
              </Link>
              <Badge variant="brand" size="sm">@{activePeer.username}</Badge>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Nível {activePeer.level || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Disponível para trocar ideias e colaboração
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartCall}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title={`Iniciar Chamada com ${activePeer.name}`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Iniciar Chamada</span>
          </button>

          <Link to={`/profile/${activePeer.username}`}>
            <Button variant="secondary" size="sm" className="font-bold">
              Ver Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages History List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              Início da conversa com {activePeer.name}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Este é o histórico privado e seguro de mensagens diretas entre si e @{activePeer.username}.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id || idx}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {!isMe && (
                  <Avatar
                    src={activePeer.avatarUrl}
                    name={activePeer.name}
                    size="sm"
                    className="rounded-lg shrink-0 mt-1"
                  />
                )}

                <div className={`space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-sm font-medium'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-xs font-normal'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium px-1">
                    {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={onSendMessage} className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder={`Enviar mensagem direta para @${activePeer.username}...`}
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Send className="w-4 h-4" />}
            className="font-bold shrink-0 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};
