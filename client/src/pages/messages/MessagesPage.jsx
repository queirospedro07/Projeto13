import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Video,
  X,
  UserPlus,
  UserCheck,
  Clock,
  ExternalLink,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { CallStage } from '../../components/call/CallStage';

export const MessagesPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activePeer, setActivePeer] = useState(location.state?.peer || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatResults, setNewChatResults] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await api.getDirectConversations();
      const list = data || [];
      setConversations(list);

      const targetUserId = searchParams.get('userId');
      if (targetUserId) {
        const found = list.find(c => c.peer?.id === targetUserId);
        if (found) {
          setActivePeer(found.peer);
        } else if (location.state?.peer && location.state.peer.id === targetUserId) {
          setActivePeer(location.state.peer);
        } else {
          api.searchSocialUsers('').then(allUsers => {
            const match = (allUsers || []).find(u => u.id === targetUserId);
            if (match) setActivePeer(match);
          }).catch(() => {});
        }
      } else if (!activePeer && list.length > 0) {
        setActivePeer(list[0].peer);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id, searchParams]);

  useEffect(() => {
    if (activePeer?.id) {
      api.getDirectMessages(activePeer.id).then(res => {
        setMessages(res.messages || []);
        scrollToBottom();
      }).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [activePeer?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (!socket) return;

    const handleDM = (msg) => {
      const targetId = msg.receiverId || msg.recipientId;
      const isFromActive = msg.senderId === activePeer?.id && targetId === user?.id;
      const isToActive = msg.senderId === user?.id && targetId === activePeer?.id;

      if (isFromActive || isToActive) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const optIdx = prev.findIndex(m => m.id?.startsWith('temp-') && m.content === msg.content);
          if (optIdx !== -1) {
            const next = [...prev];
            next[optIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });
        if (isFromActive) {
          soundEffects.playMessage();
        }
      }

      loadConversations();
    };

    socket.on('direct-message', handleDM);
    socket.on('new-direct-message', handleDM);
    return () => {
      socket.off('direct-message', handleDM);
      socket.off('new-direct-message', handleDM);
    };
  }, [socket, activePeer?.id, user?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearchingUsers(true);
      api.searchSocialUsers(searchQuery).then(users => {
        setSearchResults((users || []).filter(u => u.id !== user?.id));
      }).catch(() => {
        setSearchResults([]);
      }).finally(() => {
        setIsSearchingUsers(false);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  useEffect(() => {
    if (!newChatSearch.trim()) {
      api.searchSocialUsers('').then(users => {
        setNewChatResults((users || []).filter(u => u.id !== user?.id));
      }).catch(() => setNewChatResults([]));
      return;
    }
    const timer = setTimeout(() => {
      api.searchSocialUsers(newChatSearch).then(users => {
        setNewChatResults((users || []).filter(u => u.id !== user?.id));
      }).catch(() => setNewChatResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [newChatSearch, isNewChatModalOpen, user?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activePeer) return;

    const content = draft.trim();
    const tempId = `temp-dm-${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: user?.id,
      receiverId: activePeer.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user
    };

    setDraft('');
    setMessages(prev => [...prev, optimistic]);
    soundEffects.playMessage();

    try {
      const res = await api.sendDirectMessage(activePeer.id, content);
      setMessages(prev => prev.map(m => m.id === tempId ? res : m));
      loadConversations();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setDraft(content);
      toast({
        title: 'Erro ao enviar',
        message: err.message || 'Não foi possível enviar a mensagem.',
        type: 'error'
      });
    }
  };

  const handleSelectPeer = (peer) => {
    soundEffects.play('click');
    setIsCallOpen(false);
    setActivePeer(peer);
    setIsNewChatModalOpen(false);
    setSearchQuery('');
  };

  const filteredConversations = conversations.filter(c =>
    c.peer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peer?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col md:flex-row rounded-3xl overflow-hidden border border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0b0c0e] shadow-sm animate-fade-in mb-6">
      <aside className="w-full md:w-80 border-r border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-[#0e0f12] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0b0c0e] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              Mensagens
            </h2>
          </div>

          <button
            onClick={() => {
              soundEffects.play('click');
              setIsNewChatModalOpen(true);
            }}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Nova conversa"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>

        <div className="p-3 border-b border-slate-200/90 dark:border-zinc-800/80 bg-white/50 dark:bg-[#0b0c0e]/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar utilizadores..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800/60 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {searchQuery.trim() ? (
            <div>
              <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Resultados ({searchResults.length})
              </p>
              {searchResults.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  {isSearchingUsers ? 'A pesquisar...' : 'Nenhum utilizador encontrado.'}
                </p>
              ) : (
                searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectPeer(u)}
                    className="w-full p-2 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                  >
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" className="rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                        @{u.username}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
              <p className="mb-2">Sem mensagens diretas ainda.</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Iniciar conversa
              </button>
            </div>
          ) : (
            filteredConversations.map(c => {
              const isSelected = c.peer?.id === activePeer?.id && !isCallOpen;
              return (
                <button
                  key={c.peer.id}
                  onClick={() => handleSelectPeer(c.peer)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs font-bold'
                      : 'hover:bg-slate-100/90 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.peer.avatarUrl} name={c.peer.name} size="md" className="rounded-xl" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-black absolute -bottom-0.5 -right-0.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate">
                        {c.peer.name}
                      </span>
                      {c.lastMessage?.createdAt && (
                        <span className={`text-[9px] shrink-0 ${isSelected ? 'text-slate-300 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-slate-200 dark:text-zinc-300' : 'text-slate-500 dark:text-zinc-400'}`}>
                      {c.lastMessage?.content || `@${c.peer.username}`}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shrink-0 shadow-xs">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white dark:bg-[#0b0c0e] overflow-hidden">
        {activePeer ? (
          isCallOpen ? (
            <CallStage
              key={`call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`}
              roomName={`Chamada com ${activePeer.name}`}
              roomId={`call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`}
              isStageMode={false}
              onDisconnect={() => setIsCallOpen(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="h-14 px-5 border-b border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0b0c0e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar src={activePeer.avatarUrl} name={activePeer.name} size="sm" className="rounded-xl" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-black absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {activePeer.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                        @{activePeer.username}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Disponível
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundEffects.playJoinCall();
                      setIsCallOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Iniciar chamada de voz/vídeo"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">Chamada</span>
                  </button>

                  <Link to={`/profile/${activePeer.username}`}>
                    <Button variant="secondary" size="sm" className="font-bold text-xs py-1.5 px-3">
                      Perfil
                    </Button>
                  </Link>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/40 dark:bg-[#0e0f12]/40">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                    <Avatar src={activePeer.avatarUrl} name={activePeer.name} size="xl" className="rounded-2xl mb-3 shadow-md" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                      {activePeer.name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">
                      @{activePeer.username}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                      Esta é uma conversa direta e privada. Envie uma mensagem para iniciar o contacto.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex gap-2 max-w-md ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {!isMe && (
                          <Avatar
                            src={activePeer.avatarUrl}
                            name={activePeer.name}
                            size="sm"
                            className="rounded-lg shrink-0 mt-0.5"
                          />
                        )}

                        <div className={`space-y-0.5 ${isMe ? 'items-end text-right' : ''}`}>
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words font-medium ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                                : 'bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-slate-900 dark:text-white rounded-bl-xs shadow-xs'
                            }`}
                          >
                            {m.content}
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono px-1">
                            {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#0b0c0e] border-t border-slate-200/90 dark:border-zinc-800/80 flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Mensagem para @${activePeer.username}...`}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer font-bold shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Caixa de Mensagens
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-4">
              Selecione uma conversa ou inicie uma nova com qualquer utilizador da plataforma.
            </p>
            <Button
              onClick={() => setIsNewChatModalOpen(true)}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="font-bold text-xs"
            >
              Nova Conversa
            </Button>
          </div>
        )}
      </main>

      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121316] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/90 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Nova Mensagem Direta
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou @username..."
                  value={newChatSearch}
                  onChange={e => setNewChatSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-100 dark:bg-zinc-800/60 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {newChatResults.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Nenhum utilizador encontrado.
                </p>
              ) : (
                newChatResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectPeer(u)}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" className="rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                        @{u.username}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60">
                      Conversar
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;