import './MessagesPage.css';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LuMessageSquare as MessageSquare,
  LuUsers as Users,
  LuSearch as Search,
  LuPlus as Plus,
  LuSend as Send,
  LuVideo as Video,
  LuX as X,
  LuUserPlus as UserPlus,
  LuArrowLeft as ArrowLeft,
  LuPin as Pin,
  LuCheck as Check,
  LuCheckCheck as CheckCheck,
} from 'react-icons/lu';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { CallStage } from '../../components/CallStage';
import { FriendsManager } from '../../components/FriendsManager';
export const MessagesPage = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab =
    searchParams.get('tab') === 'friends' || searchParams.get('tab') === 'add' ? 'friends' : 'chat';
  const initialSubTab = searchParams.get('tab') === 'add' ? 'add' : 'all';
  const [mainTab, setMainTab] = useState(initialTab);
  const [friendsSubTab, setFriendsSubTab] = useState(initialSubTab);
  const [friendsData, setFriendsData] = useState({
    friends: [],
    incoming: [],
    outgoing: [],
  });
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
  const [showReadReceipts, setShowReadReceipts] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(`nexo_read_receipts_${user?.id}`) !== 'false'
      : true;
  });
  useEffect(() => {
    if (!user?.id) return;
    try {
      setPinnedPeerIds(JSON.parse(localStorage.getItem(`nexo_pinned_peers_${user.id}`) || '[]'));
    } catch {
      setPinnedPeerIds([]);
    }
    setOnlyShowPinned(localStorage.getItem(`nexo_only_pinned_${user.id}`) === 'true');
    setShowReadReceipts(localStorage.getItem(`nexo_read_receipts_${user.id}`) !== 'false');
  }, [user?.id]);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };
  const isUserOnline = (id) =>
    Boolean(
      id &&
      (typeof onlineUsers?.has === 'function'
        ? onlineUsers.has(id)
        : Array.isArray(onlineUsers) &&
          onlineUsers.some(
            (u) => String(typeof u === 'string' ? u : u?.userId || u?.id) === String(id),
          )),
    );
  const togglePinPeer = (peerId, e) => {
    if (e) e.stopPropagation();
    setPinnedPeerIds((prev) => {
      const isPinned = prev.includes(peerId);
      const next = isPinned ? prev.filter((id) => id !== peerId) : [peerId, ...prev];
      if (user?.id) {
        localStorage.setItem(`nexo_pinned_peers_${user.id}`, JSON.stringify(next));
        window.dispatchEvent(new Event('nexo_pins_changed'));
      }
      toast({
        title: isPinned ? 'Contacto Desafixado' : 'Contacto Afixado',
        message: isPinned
          ? 'O contacto foi removido dos seus afixados.'
          : 'O contacto foi afixado no topo da lista de mensagens.',
        type: 'info',
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
      const data = await api.get('/social/dm/conversations').then(({ data }) => data);
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
          api
            .get(`/social/dm/messages/${targetUserId}`)
            .then(({ data }) => data)
            .then((res) => {
              if (res?.peer) {
                setActivePeer(res.peer);
                if (res.messages) setMessages(res.messages);
              }
            })
            .catch(() => {});
        }
      } else if (!activePeer && list.length > 0 && mainTab === 'chat') {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActivePeer(list[0].peer);
        }
      }
    } catch {}
  };
  const loadFriendsData = async () => {
    try {
      const data = await api.get('/social/friends').then(({ data }) => data);
      setFriendsData(
        data || {
          friends: [],
          incoming: [],
          outgoing: [],
        },
      );
    } catch {}
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
      api
        .get(`/social/dm/messages/${activePeer.id}`)
        .then(({ data }) => data)
        .then((res) => {
          setMessages(res.messages || []);
          scrollToBottom();
        })
        .catch(() => {});

      // Clear unread count for the active peer
      setConversations((prev) =>
        prev.map((c) =>
          c.peer?.id === activePeer.id
            ? {
                ...c,
                unreadCount: 0,
              }
            : c,
        ),
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
          const optIdx = prev.findIndex(
            (m) => m.id?.startsWith('temp-') && m.content === msg.content,
          );
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
        type: 'info',
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
      api
        .get(`/social/users/search?query=${encodeURIComponent(clean === undefined ? '' : clean)}`)
        .then(({ data }) => data)
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
      api
        .get(
          `/social/users/search?query=${encodeURIComponent(newChatSearch === undefined ? '' : newChatSearch)}`,
        )
        .then(({ data }) => data)
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
      sender: user,
    };
    setDraft('');
    setMessages((prev) => [...prev, optimistic]);
    soundEffects.playMessage();
    try {
      const res = await api
        .post('/social/dm/send', {
          receiverId: activePeer.id,
          content,
        })
        .then(({ data }) => data);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res : m)));
      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      toast({
        title: 'Erro ao enviar',
        message: err.message || 'Não foi possível enviar a mensagem.',
        type: 'error',
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
    setSearchParams({
      userId: peer.id,
    });
    setConversations((prev) => {
      const exists = prev.some((c) => c.peer?.id === peer.id);
      if (!exists) {
        return [
          {
            peer,
            lastMessage: null,
            unreadCount: 0,
          },
          ...prev,
        ];
      }
      return prev.map((c) =>
        c.peer?.id === peer.id
          ? {
              ...c,
              unreadCount: 0,
            }
          : c,
      );
    });
  };
  const handleSearchAndAddFriend = async (e) => {
    e.preventDefault();
    if (!addFriendQuery.trim()) return;
    const clean = addFriendQuery.replace(/^@/, '').trim().toLowerCase();
    try {
      const users = await api
        .get(`/social/users/search?query=${encodeURIComponent(clean === undefined ? '' : clean)}`)
        .then(({ data }) => data);
      const exact = (users || []).find(
        (u) => u.username?.toLowerCase() === clean && u.id !== user?.id,
      );
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
            type: 'error',
          });
        }
      }
    } catch {
      toast({
        title: 'Erro',
        message: 'Falha ao pesquisar utilizador.',
        type: 'error',
      });
    }
  };
  const handleSendFriendRequest = async (targetUserId) => {
    try {
      await api.post(`/social/friends/request/${targetUserId}`).then(({ data }) => data);
      setRequestSent(true);
      toast({
        title: 'Pedido Enviado',
        message: 'Pedido de amizade enviado com sucesso!',
        type: 'success',
      });
      loadFriendsData();
    } catch (err) {
      toast({
        title: 'Aviso',
        message: err.message || 'Não foi possível enviar o pedido.',
        type: 'error',
      });
    }
  };
  const handleAcceptFriendRequest = async (friendshipId) => {
    try {
      await api.post(`/social/friends/accept/${friendshipId}`).then(({ data }) => data);
      toast({
        title: 'Amizade Aceite',
        message: 'Agora são amigos e podem conversar livremente!',
        type: 'success',
      });
      loadFriendsData();
      loadConversations();
    } catch (err) {
      toast({
        title: 'Erro',
        message: err.message || 'Falha ao aceitar pedido.',
        type: 'error',
      });
    }
  };
  const handleRejectFriendRequest = async (friendshipId) => {
    try {
      await api.post(`/social/friends/reject/${friendshipId}`).then(({ data }) => data);
      toast({
        title: 'Pedido Recusado',
        type: 'info',
      });
      loadFriendsData();
    } catch {}
  };
  const handleRemoveFriend = async (targetUserId) => {
    try {
      await api.delete(`/social/friends/remove/${targetUserId}`).then(({ data }) => data);
      toast({
        title: 'Amigo Removido',
        type: 'info',
      });
      loadFriendsData();
    } catch {}
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
    <div className="messages-page-panel">
      {/* SIDEBAR (CONVERSATIONS / FRIENDS) */}
      <aside
        className={`messages-page-sidebar ${mainTab === 'friends' || (mainTab === 'chat' && activePeer) ? 'messages-page-sidebar-2' : 'messages-page-sidebar-3'}`}
      >
        {/* Header Tabs */}
        <div className="messages-page-panel-2">
          <div className="messages-page-panel-3">
            <button
              onClick={() => {
                soundEffects.play('click');
                setMainTab('chat');
                setSearchParams({});
              }}
              className={`messages-page-button ${mainTab === 'chat' ? 'messages-page-button-2' : 'messages-page-button-3'}`}
            >
              <MessageSquare className="messages-page-message-square" />
              <span>Conversas</span>
            </button>
            <button
              onClick={() => {
                soundEffects.play('click');
                setMainTab('friends');
                setSearchParams({
                  tab: 'friends',
                });
              }}
              className={`messages-page-button-4 ${mainTab === 'friends' ? 'messages-page-button-2' : 'messages-page-button-3'}`}
            >
              <Users className="messages-page-message-square" />
              <span>Amigos</span>
              {friendsData?.incoming?.length > 0 && <span className="messages-page-label" />}
            </button>
          </div>

          <button
            onClick={() => {
              soundEffects.play('click');
              setIsNewChatModalOpen(true);
            }}
            className="messages-page-button-5"
            title="Nova conversa"
          >
            <Plus className="messages-page-plus" />
          </button>
        </div>

        {/* Search & Pinned Toggle Bar */}
        <div className="messages-page-panel-4">
          <div className="messages-page-panel-5">
            <Search className="messages-page-search" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="messages-page-field"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="messages-page-button-6">
                <X className="messages-page-x" />
              </button>
            )}
          </div>

          {/* Toggle "Apenas Afixados" */}
          <button
            onClick={toggleOnlyShowPinned}
            className={`messages-page-button-7 ${onlyShowPinned ? 'messages-page-button-8' : 'messages-page-button-9'}`}
            title={
              onlyShowPinned ? 'A mostrar apenas contactos afixados' : 'Filtrar apenas afixados'
            }
          >
            <Pin className="messages-page-message-square" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="messages-page-panel-6 custom-scrollbar">
          {searchQuery.trim() ? (
            <div>
              <p className="messages-page-description">Resultados ({searchResults.length})</p>
              {searchResults.length === 0 ? (
                <p className="messages-page-description-2">
                  {isSearchingUsers ? 'A pesquisar...' : 'Nenhum utilizador encontrado.'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectPeer(u)}
                    className="messages-page-panel-7 ui-group"
                  >
                    <div className="messages-page-panel-8">
                      <Avatar
                        shape="square"
                        src={u.avatarUrl}
                        name={u.name}
                        size="sm"
                        className="messages-page-avatar"
                      />
                      <div className="messages-page-panel-9">
                        <p className="messages-page-description-3">{u.name}</p>
                        <p className="messages-page-description-4">@{u.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => togglePinPeer(u.id, e)}
                      className="messages-page-button-10"
                      title={pinnedPeerIds.includes(u.id) ? 'Desafixar' : 'Afixar contacto'}
                    >
                      {pinnedPeerIds.includes(u.id) ? (
                        <Pin className="messages-page-pin" />
                      ) : (
                        <Pin className="messages-page-message-square" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="messages-page-panel-10">
              <p>{onlyShowPinned ? 'Nenhum contacto afixado.' : 'Sem conversas ativas.'}</p>
              <div className="messages-page-panel-11">
                {onlyShowPinned ? (
                  <button
                    onClick={() => setOnlyShowPinned(false)}
                    className="messages-page-button-11"
                  >
                    Mostrar todas as conversas
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="messages-page-button-11"
                    >
                      Iniciar Conversa
                    </button>
                    <button
                      onClick={() => {
                        setMainTab('friends');
                        setFriendsSubTab('add');
                      }}
                      className="messages-page-button-12"
                    >
                      <UserPlus className="messages-page-x" />
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
                  className={`messages-page-panel-12 ui-group ${isSelected ? 'messages-page-panel-13' : 'messages-page-panel-14'}`}
                >
                  <div className="messages-page-panel-15">
                    <Avatar
                      shape="square"
                      src={c.peer.avatarUrl}
                      name={c.peer.name}
                      size="md"
                      className="messages-page-avatar-2"
                    />
                    <span
                      className={`messages-page-label-2 ${isUserOnline(c.peer?.id) ? 'messages-page-label-4' : 'messages-page-label-5'} messages-page-label-3`}
                    />
                    {isPinned && (
                      <span className="messages-page-label-6">
                        <Pin className="messages-page-pin-2" />
                      </span>
                    )}
                  </div>

                  <div className="messages-page-panel-9">
                    <div className="messages-page-panel-16">
                      <span className="messages-page-label-7">
                        <span>{c.peer.name}</span>
                      </span>
                      {c.lastMessage?.createdAt && (
                        <span
                          className={`messages-page-label-8 ${isSelected ? 'messages-page-label-9' : 'messages-page-label-10'}`}
                        >
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`messages-page-description-5 ${isSelected ? 'messages-page-description-6' : 'messages-page-description-7'}`}
                    >
                      {c.lastMessage?.content || `@${c.peer.username}`}
                    </p>
                  </div>

                  {/* Pin action button on hover */}
                  <button
                    type="button"
                    onClick={(e) => togglePinPeer(c.peer.id, e)}
                    className={`messages-page-button-13 ${isPinned ? 'messages-page-button-14' : 'messages-page-button-15'}`}
                    title={isPinned ? 'Desafixar contacto' : 'Afixar contacto'}
                  >
                    <Pin
                      className={`messages-page-message-square ${isPinned ? 'messages-page-pin-3' : ''}`}
                    />
                  </button>

                  {/* Unread message count badge (ONLY shown when > 0) */}
                  {c.unreadCount > 0 && (
                    <span className="messages-page-label-11">{c.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CONTENT (CHAT / FRIENDS / CALL) */}
      <main
        className={`messages-page-main ${mainTab === 'chat' && !activePeer ? 'messages-page-sidebar-2' : 'messages-page-sidebar-3'}`}
      >
        {mainTab === 'friends' ? (
          <div className="messages-page-panel-17">
            <div className="messages-page-panel-18">
              <button
                onClick={() => {
                  setMainTab('chat');
                  setSearchParams({});
                }}
                className="messages-page-button-16"
              >
                <ArrowLeft className="messages-page-plus" />
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
                navigate(`/messages?userId=${peer.id}`, {
                  replace: true,
                });
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
                  roomId: `call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`,
                });
              }}
            />
          ) : (
            <div className="messages-page-panel-17">
              {/* Chat Header */}
              <header className="messages-page-header">
                <div className="messages-page-panel-19">
                  <button
                    onClick={() => {
                      setActivePeer(null);
                      setSearchParams({});
                    }}
                    className="messages-page-button-17"
                    title="Voltar às conversas"
                    aria-label="Voltar às conversas"
                  >
                    <ArrowLeft className="messages-page-arrow-left" />
                  </button>
                  <div className="messages-page-panel-15">
                    <Avatar
                      shape="square"
                      src={activePeer.avatarUrl}
                      name={activePeer.name}
                      size="sm"
                      className="messages-page-avatar-2"
                    />
                    <span
                      className={`messages-page-label-2 ${isUserOnline(activePeer.id) ? 'messages-page-label-4' : 'messages-page-label-5'} messages-page-label-3`}
                    />
                  </div>
                  <div className="messages-page-panel-20">
                    <div className="messages-page-panel-21">
                      <h3 className="messages-page-subheading">{activePeer.name}</h3>
                      <span className="messages-page-label-12">@{activePeer.username}</span>
                    </div>
                    <p
                      className={`messages-page-description-8 ${isUserOnline(activePeer.id) ? 'messages-page-description-10' : 'messages-page-description-11'} messages-page-description-9`}
                    >
                      <span
                        className={`messages-page-label-13 ${isUserOnline(activePeer.id) ? 'messages-page-label-14' : 'messages-page-label-5'}`}
                      />
                      {isUserOnline(activePeer.id) ? 'Disponível' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="messages-page-panel-22">
                  {/* Pin Peer Button */}
                  <button
                    onClick={(e) => togglePinPeer(activePeer.id, e)}
                    className={`messages-page-button-18 ${pinnedPeerIds.includes(activePeer.id) ? 'messages-page-button-19' : 'messages-page-button-20'}`}
                    title={
                      pinnedPeerIds.includes(activePeer.id)
                        ? 'Desafixar contacto'
                        : 'Afixar contacto na barra lateral'
                    }
                  >
                    <Pin
                      className={`messages-page-message-square ${pinnedPeerIds.includes(activePeer.id) ? 'messages-page-pin-3' : ''}`}
                    />
                    <span className="messages-page-label-15">
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
                          avatarUrl: user.avatarUrl,
                        },
                        roomId: dmRoomId,
                      });
                      setIsCallOpen(true);
                    }}
                    className="messages-page-button-21"
                    title="Iniciar chamada de voz/vídeo"
                  >
                    <Video className="messages-page-video" />
                    <span className="messages-page-label-15">Chamada</span>
                  </button>

                  <Link to={`/profile/${activePeer.username || activePeer.id}`}>
                    <Button variant="secondary" size="sm" className="messages-page-button-22">
                      Perfil
                    </Button>
                  </Link>
                </div>
              </header>

              {/* Messages Scroll Area */}
              <div className="messages-page-panel-23 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="messages-page-panel-24">
                    <Avatar
                      shape="square"
                      src={activePeer.avatarUrl}
                      name={activePeer.name}
                      size="xl"
                      className="messages-page-avatar-3"
                    />
                    <h4 className="messages-page-caption">{activePeer.name}</h4>
                    <p className="messages-page-description-12">@{activePeer.username}</p>
                    <p className="messages-page-description-13">
                      Esta é uma conversa direta e privada. Envie uma mensagem para iniciar o
                      contacto.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderId === user?.id;
                    const isSeen = m.isRead === true || m.isRead === 1;
                    return (
                      <div
                        key={m.id || idx}
                        className={`messages-page-panel-25 ${isMe ? 'messages-page-panel-26' : ''}`}
                      >
                        {!isMe && (
                          <Avatar
                            shape="square"
                            src={activePeer.avatarUrl}
                            name={activePeer.name}
                            size="sm"
                            className="messages-page-avatar-4"
                          />
                        )}

                        <div
                          className={`messages-page-panel-27 ${isMe ? 'messages-page-panel-28' : ''}`}
                        >
                          <div
                            className={`messages-page-panel-29 ${isMe ? 'messages-page-panel-30 message-outgoing-corner' : 'messages-page-panel-31 message-incoming-corner'}`}
                          >
                            {m.content}
                          </div>

                          <div
                            className={`messages-page-panel-32 ${isMe ? 'messages-page-panel-33' : 'messages-page-panel-34'}`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Read Receipts ("Dar Vista") indicator for sent messages */}
                            {isMe &&
                              showReadReceipts &&
                              (isSeen ? (
                                <span className="messages-page-label-16" title="Visto">
                                  <CheckCheck className="messages-page-check-check" />
                                  <span className="messages-page-label-17">Visto</span>
                                </span>
                              ) : (
                                <span className="messages-page-label-18" title="Enviado">
                                  <Check className="messages-page-message-square" />
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="messages-page-form pb-safe">
                <input
                  type="text"
                  required
                  placeholder={`Mensagem para @${activePeer.username}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="messages-page-field-2"
                />
                <button type="submit" disabled={!draft.trim()} className="messages-page-button-23">
                  <Send className="messages-page-message-square" />
                </button>
              </form>
            </div>
          )
        ) : (
          <div className="messages-page-panel-35">
            <div className="messages-page-panel-36">
              <MessageSquare className="messages-page-message-square-2" />
            </div>
            <h3 className="messages-page-subheading-2">Caixa de Mensagens & Amigos</h3>
            <p className="messages-page-description-14">
              Conecte-se com amigos ou selecione uma conversa para trocar mensagens diretas.
            </p>
            <div className="messages-page-panel-22">
              <Button
                onClick={() => setIsNewChatModalOpen(true)}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="messages-page-message-square" />}
                className="messages-page-button-24"
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
                leftIcon={<UserPlus className="messages-page-message-square" />}
                className="messages-page-button-24"
              >
                Adicionar Amigo
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NOVA CONVERSA */}
      {isNewChatModalOpen &&
        createPortal(
          <div className="messages-page-panel-37 dialog-layer">
            <div
              className="messages-page-panel-38"
              onClick={() => setIsNewChatModalOpen(false)}
              aria-hidden="true"
            />
            <div className="messages-page-panel-39">
              <div className="messages-page-panel-40" onClick={(e) => e.stopPropagation()}>
                <div className="messages-page-panel-41">
                  <h3 className="messages-page-subheading-3">Iniciar Nova Conversa</h3>
                  <button
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="messages-page-button-25"
                  >
                    <X className="messages-page-plus" />
                  </button>
                </div>

                <div className="messages-page-panel-42">
                  <Search className="messages-page-search-2" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou @utilizador..."
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    className="messages-page-field-3"
                    autoFocus
                  />
                </div>

                <div className="messages-page-panel-43 custom-scrollbar">
                  {newChatResults.length === 0 ? (
                    <p className="messages-page-description-15">
                      {newChatSearch
                        ? 'Nenhum utilizador encontrado.'
                        : 'Digite o nome para pesquisar.'}
                    </p>
                  ) : (
                    newChatResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectPeer(u)}
                        className="messages-page-button-26 ui-group"
                      >
                        <div className="messages-page-panel-8">
                          <Avatar
                            shape="square"
                            src={u.avatarUrl}
                            name={u.name}
                            size="sm"
                            className="messages-page-avatar"
                          />
                          <div className="messages-page-panel-44">
                            <p className="messages-page-description-3">{u.name}</p>
                            <p className="messages-page-description-4">@{u.username}</p>
                          </div>
                        </div>

                        <span className="messages-page-label-19">Conversar</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
export default MessagesPage;
