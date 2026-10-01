import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ArrowLeft,
  Pin,
  PinOff,
  Check,
  CheckCheck,
  Filter
} from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useToast } from '../../../components/ui/Toast';
import { soundEffects } from '../../../services/soundEffects';
import { api } from '../../../services/api';
import { CallStage } from '../../../components/call/CallStage';
import { FriendsManager } from '../../../features/messages/components/FriendsManager';

export const MessagesPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = searchParams.get('tab') === 'friends' || searchParams.get('tab') === 'add' ? 'friends' : 'chat';
  const initialSubTab = searchParams.get('tab') === 'add' ? 'add' : 'all';

  const [mainTab, setMainTab] = useState(initialTab);
  const [friendsSubTab, setFriendsSubTab] = useState(initialSubTab);
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [addFriendQuery, setAddFriendQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

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

  // Pinned Peers State
  const [pinnedPeerIds, setPinnedPeerIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`nexo_pinned_peers_${user?.id}`) || '[]');
    } catch {
      return [];
    }
  });

  const [onlyShowPinned, setOnlyShowPinned] = useState(() => {
    return localStorage.getItem(`nexo_only_pinned_${user?.id}`) === 'true';
  });

  // Read receipts preference
  const showReadReceipts = typeof window !== 'undefined'
    ? localStorage.getItem(`nexo_read_receipts_${user?.id}`) !== 'false'
    : true;

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const togglePinPeer = (peerId, e) => {
    if (e) e.stopPropagation();
    setPinnedPeerIds((prev) => {
      const isPinned = prev.includes(peerId);
      const next = isPinned ? prev.filter((id) => id !== peerId) : [peerId, ...prev];
      if (user?.id) {
        localStorage.setItem(`nexo_pinned_peers_${user.id}`, JSON.stringify(next));
      }
      toast({
        title: isPinned ? 'Contacto Desafixado' : 'Contacto Afixado',
        message: isPinned
          ? 'O contacto foi removido dos seus afixados.'
          : 'O contacto foi afixado no topo da lista de mensagens.',
        type: 'info'
      });
      return next;
    });
  };

  const toggleOnlyShowPinned = () => {
    setOnlyShowPinned((prev) => {
      const next = !prev;
      if (user?.id) {
        localStorage.setItem(`nexo_only_pinned_${user.id}`, String(next));
      }
      return next;
    });
  };

  const loadConversations = async () => {
    try {
      const data = await api.getDirectConversations();
      const list = data || [];
      setConversations(list);

      const targetUserId = searchParams.get('userId');
      if (targetUserId) {
        setMainTab('chat');
        const found = list.find((c) => c.peer?.id === targetUserId);
        if (found) {
          setActivePeer(found.peer);
        } else if (location.state?.peer && location.state.peer.id === targetUserId) {
          setActivePeer(location.state.peer);
        } else {
          api.searchSocialUsers('').then((allUsers) => {
            const match = (allUsers || []).find((u) => u.id === targetUserId);
            if (match) setActivePeer(match);
          }).catch(() => {});
        }
      } else if (!activePeer && list.length > 0 && mainTab === 'chat') {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActivePeer(list[0].peer);
        }
      }
    } catch (_) {}
  };

  const loadFriendsData = async () => {
    try {
      const data = await api.getFriends();
      setFriendsData(data || { friends: [], incoming: [], outgoing: [] });
    } catch (_) {}
  };

  useEffect(() => {
    loadConversations();
    loadFriendsData();
  }, [user?.id, searchParams]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'friends') {
      setMainTab('friends');
      setFriendsSubTab('all');
    } else if (tabParam === 'add') {
      setMainTab('friends');
      setFriendsSubTab('add');
    } else {
      setMainTab('chat');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activePeer?.id) {
      api.getDirectMessages(activePeer.id).then((res) => {
        setMessages(res.messages || []);
        scrollToBottom();
      }).catch(() => {});

      // Clear unread count for the active peer
      setConversations((prev) =>
        prev.map((c) => (c.peer?.id === activePeer.id ? { ...c, unreadCount: 0 } : c))
      );
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optIdx = prev.findIndex((m) => m.id?.startsWith('temp-') && m.content === msg.content);
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

    const handleCallRejected = ({ rejector }) => {
      toast({
        title: 'Chamada Recusada',
        message: `${rejector?.name || 'O utilizador'} recusou a chamada.`,
        type: 'info'
      });
      setIsCallOpen(false);
    };

    socket.on('direct-call-rejected', handleCallRejected);

    return () => {
      socket.off('direct-message', handleDM);
      socket.off('direct-call-rejected', handleCallRejected);
    };
  }, [socket, activePeer?.id, user?.id, toast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }
    const clean = searchQuery.replace(/^@/, '').trim().toLowerCase();
    setIsSearchingUsers(true);
    const timer = setTimeout(() => {
      api.searchSocialUsers(clean)
        .then((users) => {
          const filtered = (users || []).filter((u) => u.id !== user?.id);
          setSearchResults(filtered);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearchingUsers(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  useEffect(() => {
    if (!newChatSearch.trim()) {
      setNewChatResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchSocialUsers(newChatSearch)
        .then((users) => {
          setNewChatResults((users || []).filter((u) => u.id !== user?.id));
        })
        .catch(() => setNewChatResults([]));
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
    setMessages((prev) => [...prev, optimistic]);
    soundEffects.playMessage();

    try {
      const res = await api.sendDirectMessage(activePeer.id, content);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res : m)));
      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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
    setMainTab('chat');
    setIsNewChatModalOpen(false);
    setSearchQuery('');
    setConversations((prev) =>
      prev.map((c) => (c.peer?.id === peer.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSearchAndAddFriend = async (e) => {
    e.preventDefault();
    if (!addFriendQuery.trim()) return;
    const clean = addFriendQuery.replace(/^@/, '').trim().toLowerCase();
    try {
      const users = await api.searchSocialUsers(clean);
      const exact = (users || []).find((u) => u.username?.toLowerCase() === clean && u.id !== user?.id);
      if (exact) {
        setSearchResult(exact);
        setRequestSent(false);
      } else {
        const first = (users || []).find((u) => u.id !== user?.id);
        if (first) {
          setSearchResult(first);
          setRequestSent(false);
        } else {
          setSearchResult(null);
          toast({
            title: 'Não encontrado',
            message: 'Nenhum utilizador encontrado com esse nome.',
            type: 'error'
          });
        }
      }
    } catch (_) {
      toast({
        title: 'Erro',
        message: 'Falha ao pesquisar utilizador.',
        type: 'error'
      });
    }
  };

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      await api.sendFriendRequest(targetUserId);
      setRequestSent(true);
      toast({
        title: 'Pedido Enviado',
        message: 'Pedido de amizade enviado com sucesso!',
        type: 'success'
      });
      loadFriendsData();
    } catch (err) {
      toast({
        title: 'Aviso',
        message: err.message || 'Não foi possível enviar o pedido.',
        type: 'error'
      });
    }
  };

  const handleAcceptFriendRequest = async (friendshipId) => {
    try {
      await api.acceptFriendRequest(friendshipId);
      toast({
        title: 'Amizade Aceite',
        message: 'Agora são amigos e podem conversar livremente!',
        type: 'success'
      });
      loadFriendsData();
      loadConversations();
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao aceitar pedido.',
        type: 'error'
      });
    }
  };

  const handleRejectFriendRequest = async (friendshipId) => {
    try {
      await api.rejectFriendRequest(friendshipId);
      toast({
        title: 'Pedido Recusado',
        type: 'info'
      });
      loadFriendsData();
    } catch (_) {}
  };

  const handleRemoveFriend = async (targetUserId) => {
    try {
      await api.removeFriend(targetUserId);
      toast({
        title: 'Amigo Removido',
        type: 'info'
      });
      loadFriendsData();
    } catch (_) {}
  };

  // Filter & sort conversations (Pinned at top, optional "only pinned" filter)
  const filteredConversations = conversations
    .filter((c) => {
      const matchesSearch =
        c.peer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.peer?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (onlyShowPinned) {
        return pinnedPeerIds.includes(c.peer?.id);
      }
      return true;
    })
    .sort((a, b) => {
      const aPinned = pinnedPeerIds.includes(a.peer?.id);
      const bPinned = pinnedPeerIds.includes(b.peer?.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const tA = new Date(a.lastMessage?.createdAt || 0).getTime();
      const tB = new Date(b.lastMessage?.createdAt || 0).getTime();
      return tB - tA;
    });

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)] md:h-[calc(100vh-6rem)] flex flex-col md:flex-row rounded-2xl md:rounded-xl overflow-hidden border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] shadow-sm animate-fade-in mb-2 md:mb-6">
      {/* ── SIDEBAR (CONVERSATIONS / FRIENDS) ── */}
      <aside
        className={`w-full md:w-80 border-r border-slate-200/90 dark:border-neutral-800 bg-slate-50/60 dark:bg-[#0e0f12] flex flex-col shrink-0 ${
          mainTab === 'friends' || (mainTab === 'chat' && activePeer) ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header Tabs */}
        <div className="p-3.5 border-b border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl flex-1">
            <button
              onClick={() => {
                soundEffects.play('click');
                setMainTab('chat');
                setSearchParams({});
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mainTab === 'chat'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversas</span>
            </button>
            <button
              onClick={() => {
                soundEffects.play('click');
                setMainTab('friends');
                setSearchParams({ tab: 'friends' });
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                mainTab === 'friends'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Amigos</span>
              {friendsData?.incoming?.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              soundEffects.play('click');
              setIsNewChatModalOpen(true);
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Nova conversa"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Pinned Toggle Bar */}
        <div className="p-3 border-b border-slate-200/90 dark:border-neutral-800 bg-white/50 dark:bg-[#0b0c0e]/50 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all"
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

          {/* Toggle "Apenas Afixados" */}
          <button
            onClick={toggleOnlyShowPinned}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              onlyShowPinned
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-neutral-800 border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={onlyShowPinned ? 'A mostrar apenas contactos afixados' : 'Filtrar apenas afixados'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {searchQuery.trim() ? (
            <div>
              <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Resultados ({searchResults.length})
              </p>
              {searchResults.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400 dark:text-neutral-500 font-medium">
                  {isSearchingUsers ? 'A pesquisar...' : 'Nenhum utilizador encontrado.'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectPeer(u)}
                    className="w-full p-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800/60 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatarUrl} name={u.name} size="sm" className="rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => togglePinPeer(u.id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={pinnedPeerIds.includes(u.id) ? 'Desafixar' : 'Afixar contacto'}
                    >
                      {pinnedPeerIds.includes(u.id) ? (
                        <Pin className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500 font-medium space-y-2">
              <p>{onlyShowPinned ? 'Nenhum contacto afixado.' : 'Sem conversas ativas.'}</p>
              <div className="flex flex-col gap-1.5 pt-2">
                {onlyShowPinned ? (
                  <button
                    onClick={() => setOnlyShowPinned(false)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Mostrar todas as conversas
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Iniciar Conversa
                    </button>
                    <button
                      onClick={() => {
                        setMainTab('friends');
                        setFriendsSubTab('add');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Adicionar Amigos</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.peer?.id === activePeer?.id && mainTab === 'chat' && !isCallOpen;
              const isPinned = pinnedPeerIds.includes(c.peer?.id);

              return (
                <div
                  key={c.peer.id}
                  onClick={() => handleSelectPeer(c.peer)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer select-none group relative ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs font-bold'
                      : 'hover:bg-slate-100/90 dark:hover:bg-neutral-800/50 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.peer.avatarUrl} name={c.peer.name} size="md" className="rounded-xl" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-black absolute -bottom-0.5 -right-0.5" />
                    {isPinned && (
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center absolute -top-1 -left-1 shadow-xs ring-1 ring-white dark:ring-black">
                        <Pin className="w-2 h-2 fill-white" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate flex items-center gap-1">
                        <span>{c.peer.name}</span>
                      </span>
                      {c.lastMessage?.createdAt && (
                        <span
                          className={`text-[9px] shrink-0 ${
                            isSelected ? 'text-slate-300 dark:text-neutral-400' : 'text-slate-400 dark:text-neutral-500'
                          }`}
                        >
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate font-medium ${
                        isSelected ? 'text-slate-200 dark:text-neutral-300' : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      {c.lastMessage?.content || `@${c.peer.username}`}
                    </p>
                  </div>

                  {/* Pin action button on hover */}
                  <button
                    type="button"
                    onClick={(e) => togglePinPeer(c.peer.id, e)}
                    className={`p-1 rounded-md transition-opacity shrink-0 ${
                      isPinned
                        ? 'opacity-100 text-blue-500 dark:text-blue-400'
                        : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={isPinned ? 'Desafixar contacto' : 'Afixar contacto'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Unread message count badge (ONLY shown when > 0) */}
                  {c.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] shrink-0 shadow-xs animate-pulse">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT (CHAT / FRIENDS / CALL) ── */}
      <main
        className={`flex-1 flex flex-col bg-white dark:bg-[#0b0c0e] overflow-hidden ${
          mainTab === 'chat' && !activePeer ? 'hidden md:flex' : 'flex'
        }`}
      >
        {mainTab === 'friends' ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="md:hidden px-3.5 py-2.5 border-b border-slate-200/90 dark:border-neutral-800 bg-slate-50 dark:bg-[#0e0f12] flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setMainTab('chat');
                  setSearchParams({});
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 py-1 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar às conversas</span>
              </button>
            </div>
            <FriendsManager
              friendsSubTab={friendsSubTab}
              onSetFriendsSubTab={setFriendsSubTab}
              friendsData={friendsData}
              addFriendQuery={addFriendQuery}
              onAddFriendQueryChange={setAddFriendQuery}
              onSearchAndAddFriend={handleSearchAndAddFriend}
              searchResult={searchResult}
              requestSent={requestSent}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptRequest={handleAcceptFriendRequest}
              onRejectRequest={handleRejectFriendRequest}
              onRemoveFriend={handleRemoveFriend}
              onOpenConversationWithUser={(peer) => {
                handleSelectPeer(peer);
                navigate(`/messages?userId=${peer.id}`, { replace: true });
              }}
            />
          </div>
        ) : activePeer ? (
          isCallOpen ? (
            <CallStage
              key={`call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`}
              roomName={`Chamada com ${activePeer.name}`}
              roomId={`call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`}
              onDisconnect={() => {
                setIsCallOpen(false);
                socket?.emit('direct-call-ended', {
                  targetUserId: activePeer.id,
                  roomId: `call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`
                });
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Chat Header */}
              <header className="h-14 px-3 sm:px-5 border-b border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setActivePeer(null);
                      setSearchParams({});
                    }}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                    title="Voltar às conversas"
                    aria-label="Voltar às conversas"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative shrink-0">
                    <Avatar src={activePeer.avatarUrl} name={activePeer.name} size="sm" className="rounded-xl" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-black absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {activePeer.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
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
                  {/* Pin Peer Button */}
                  <button
                    onClick={(e) => togglePinPeer(activePeer.id, e)}
                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      pinnedPeerIds.includes(activePeer.id)
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={pinnedPeerIds.includes(activePeer.id) ? 'Desafixar contacto' : 'Afixar contacto na barra lateral'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${pinnedPeerIds.includes(activePeer.id) ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">
                      {pinnedPeerIds.includes(activePeer.id) ? 'Afixado' : 'Afixar'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.playJoinCall();
                      const dmRoomId = `call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`;
                      socket?.emit('direct-call-start', {
                        targetUserId: activePeer.id,
                        caller: {
                          id: user.id,
                          name: user.name,
                          username: user.username,
                          avatarUrl: user.avatarUrl
                        },
                        roomId: dmRoomId
                      });
                      setIsCallOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
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

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/40 dark:bg-[#0e0f12]/40">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                    <Avatar src={activePeer.avatarUrl} name={activePeer.name} size="xl" className="rounded-2xl mb-3 shadow-md" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                      {activePeer.name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mb-3">
                      @{activePeer.username}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                      Esta é uma conversa direta e privada. Envie uma mensagem para iniciar o contacto.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderId === user?.id;
                    const isSeen = m.isRead === true || m.isRead === 1;

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
                                : 'bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white rounded-bl-xs shadow-xs'
                            }`}
                          >
                            {m.content}
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[10px] text-slate-400 dark:text-neutral-500 font-mono px-1 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>

                            {/* Read Receipts ("Dar Vista") indicator for sent messages */}
                            {isMe && showReadReceipts && (
                              isSeen ? (
                                <span className="flex items-center gap-0.5 text-blue-400 font-bold text-[10px]" title="Visto">
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-[9px]">Visto</span>
                                </span>
                              ) : (
                                <span className="flex items-center text-slate-400 dark:text-neutral-500" title="Enviado">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 sm:p-3 bg-white dark:bg-[#0b0c0e] border-t border-slate-200/90 dark:border-neutral-800 flex items-center gap-2 pb-safe"
              >
                <input
                  type="text"
                  required
                  placeholder={`Mensagem para @${activePeer.username}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all font-medium"
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
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Caixa de Mensagens & Amigos
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs leading-relaxed mb-4">
              Conecte-se com amigos ou selecione uma conversa para trocar mensagens diretas.
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsNewChatModalOpen(true)}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="font-bold text-xs"
              >
                Nova Mensagem
              </Button>
              <Button
                onClick={() => {
                  setMainTab('friends');
                  setFriendsSubTab('add');
                }}
                variant="secondary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                className="font-bold text-xs"
              >
                Adicionar Amigo
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: NOVA CONVERSA ── */}
      {isNewChatModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
            <div
              className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity"
              onClick={() => setIsNewChatModalOpen(false)}
              aria-hidden="true"
            />
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div
                className="relative w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0c0d10] border border-slate-200 dark:border-neutral-800 shadow-2xl text-left space-y-4 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Iniciar Nova Conversa
                  </h3>
                  <button
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou @utilizador..."
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                  {newChatResults.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                      {newChatSearch ? 'Nenhum utilizador encontrado.' : 'Digite o nome para pesquisar.'}
                    </p>
                  ) : (
                    newChatResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectPeer(u)}
                        className="w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 hover:bg-slate-100 dark:hover:bg-neutral-800/60 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={u.avatarUrl} name={u.name} size="sm" className="rounded-lg shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                              @{u.username}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Conversar
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MessagesPage;