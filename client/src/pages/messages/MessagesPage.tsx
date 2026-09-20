import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';

// Modular Subcomponents
import { CallStage } from '../../components/call/CallStage';
import { DirectChatPane } from '../../features/messages/components/DirectChatPane';
import { FriendsManager } from '../../features/messages/components/FriendsManager';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'dms' | 'friends'>('dms');
  const [friendsSubTab, setFriendsSubTab] = useState<'all' | 'pending' | 'add'>('all');

  // Conversations & Chat State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCallOpen, setIsCallOpen] = useState(false);

  // Friends State
  const [friendsData, setFriendsData] = useState<{ friends: any[]; incoming: any[]; outgoing: any[] }>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [addFriendInput, setAddFriendInput] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [requestSent, setRequestSent] = useState(false);

  // Load conversations & friends
  const loadConversations = () => {
    api.getDirectConversations().then(data => {
      setConversations(data || []);
      if (data && data.length > 0 && !activePeer) {
        setActivePeer(data[0].peer);
      }
    }).catch(() => {});
  };

  const loadFriends = () => {
    api.getFriends().then(data => {
      setFriendsData(data || { friends: [], incoming: [], outgoing: [] });
    }).catch(() => {});
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
  }, []);

  // Load message history when active peer changes
  useEffect(() => {
    if (activePeer) {
      api.getDirectMessages(activePeer.id).then(res => {
        setMessages(res.messages || []);
      }).catch(() => {});
    }
  }, [activePeer?.id]);

  // Real-time Socket.IO Direct Messages
  useEffect(() => {
    if (!socket) return;
    const handleDM = (msg: any) => {
      const targetId = msg.receiverId || msg.recipientId;
      if (
        (msg.senderId === activePeer?.id && targetId === user?.id) ||
        (msg.senderId === user?.id && targetId === activePeer?.id)
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const optimisticIdx = prev.findIndex(m => 
            m.id.startsWith('temp-') && m.senderId === msg.senderId && m.content === msg.content
          );
          if (optimisticIdx !== -1) {
            const next = [...prev];
            next[optimisticIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });
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

  // Send Direct Message (Instant Optimistic Display)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activePeer) return;

    const content = draft.trim();
    const tempId = `temp-dm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const optimisticDM = {
      id: tempId,
      senderId: user?.id,
      receiverId: activePeer.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user
    };

    // 1. Instant optimistic visual display
    setDraft('');
    setMessages(prev => [...prev, optimisticDM]);
    soundEffects.playMessage();

    // 2. Immediate socket broadcast
    socket?.emit('direct-message', optimisticDM);
    socket?.emit('send-message', optimisticDM);

    // 3. Persist to server
    try {
      const res = await api.sendDirectMessage(activePeer.id, content);
      setMessages(prev => prev.map(m => (m.id === tempId ? res : m)));
      socket?.emit('direct-message', res);
      socket?.emit('send-message', res);
      loadConversations();
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setDraft(content);
      toast({ title: 'Erro ao enviar mensagem', message: err.message, type: 'error' });
    }
  };

  // Friends Actions
  const handleSearchAndAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;

    try {
      const cleanUsername = addFriendInput.replace('@', '').trim();
      const results = await api.searchSocialUsers(cleanUsername);
      if (results && results.length > 0) {
        setSearchResult(results[0]);
      } else {
        setSearchResult(null);
        toast({ title: 'Utilizador não encontrado', message: 'Verifique o nome de utilizador.', type: 'error' });
      }
      setRequestSent(false);
    } catch (err: any) {
      toast({ title: 'Utilizador não encontrado', message: 'Verifique o nome de utilizador.', type: 'error' });
      setSearchResult(null);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await api.sendFriendRequest(targetUserId);
      setRequestSent(true);
      soundEffects.playSuccess();
      toast({ title: 'Pedido Enviado!', message: 'Pedido de amizade enviado com sucesso.', type: 'success' });
      loadFriends();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar pedido', message: err.message, type: 'error' });
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await api.acceptFriendRequest(friendshipId);
      soundEffects.playSuccess();
      toast({ title: 'Pedido Aceite!', message: 'Agora são amigos e podem trocar mensagens.', type: 'success' });
      loadFriends();
    } catch (err: any) {
      toast({ title: 'Erro ao aceitar pedido', message: err.message, type: 'error' });
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await api.rejectFriendRequest(friendshipId);
      toast({ title: 'Pedido Rejeitado' });
      loadFriends();
    } catch (err: any) {
      toast({ title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendUserId: string) => {
    try {
      await api.removeFriend(friendUserId);
      toast({ title: 'Amigo Removido' });
      loadFriends();
    } catch (err: any) {
      toast({ title: 'Erro', message: err.message, type: 'error' });
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.peer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peer?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col md:flex-row rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm animate-fade-in mb-8">
      
      {/* 1. LEFT SIDEBAR (CHATS & FRIENDS TABS) */}
      <aside className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
        
        {/* Sidebar Header & Main Tabs */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
            <button
              onClick={() => { soundEffects.play('click'); setActiveTab('dms'); }}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'dms' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mensagens</span>
            </button>

            <button
              onClick={() => { soundEffects.play('click'); setActiveTab('friends'); }}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'friends' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Amigos</span>
              {friendsData.incoming.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {friendsData.incoming.length}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {activeTab === 'dms' ? (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                Nenhuma conversa recente. Comece uma conversa a partir da aba de <button onClick={() => setActiveTab('friends')} className="text-blue-600 font-bold hover:underline">Amigos</button>.
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = c.peer?.id === activePeer?.id && !isCallOpen;
                return (
                  <button
                    key={c.peer.id}
                    onClick={() => {
                      soundEffects.play('click');
                      setIsCallOpen(false);
                      setActivePeer(c.peer);
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-950 shadow-2xs'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="relative">
                      <Avatar
                        src={c.peer.avatarUrl}
                        name={c.peer.name}
                        size="md"
                        className="rounded-xl shrink-0"
                      />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-sm text-slate-950 truncate">{c.peer.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {c.lastMessage?.content || `@${c.peer.username}`}
                      </p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => { soundEffects.play('click'); setFriendsSubTab('all'); }}
                className={`w-full p-3 rounded-xl font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                  friendsSubTab === 'all' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Todos os Amigos</span>
                <Badge variant="brand" size="sm">{friendsData.friends.length}</Badge>
              </button>

              <button
                onClick={() => { soundEffects.play('click'); setFriendsSubTab('pending'); }}
                className={`w-full p-3 rounded-xl font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                  friendsSubTab === 'pending' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Pedidos Pendentes</span>
                {friendsData.incoming.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {friendsData.incoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { soundEffects.play('click'); setFriendsSubTab('add'); }}
                className={`w-full p-3 rounded-xl font-bold text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
                  friendsSubTab === 'add' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50'
                }`}
              >
                <span>Adicionar Amigo</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN PANE (CHAT OR FRIENDS HUB) */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeTab === 'dms' ? (
          activePeer ? (
            isCallOpen ? (
              <CallStage
                roomName={`Chamada com ${activePeer.name}`}
                roomId={`call_dm_${[user?.id || 'me', activePeer.id].sort().join('_')}`}
                isStageMode={false}
                onDisconnect={() => setIsCallOpen(false)}
              />
            ) : (
              <DirectChatPane
                activePeer={activePeer}
                messages={messages}
                currentUserId={user?.id}
                draft={draft}
                onDraftChange={setDraft}
                onSendMessage={handleSendMessage}
                onStartCall={() => {
                  setIsCallOpen(true);
                  soundEffects.playJoinCall();
                }}
              />
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">As Suas Mensagens Diretas</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
                Selecione uma conversa ao lado ou escolha um amigo para iniciar uma conversa privada.
              </p>
            </div>
          )
        ) : (
          <FriendsManager
            friendsSubTab={friendsSubTab}
            onSetFriendsSubTab={setFriendsSubTab}
            friendsData={friendsData}
            addFriendQuery={addFriendInput}
            onAddFriendQueryChange={setAddFriendInput}
            onSearchAndAddFriend={handleSearchAndAddFriend}
            searchResult={searchResult}
            requestSent={requestSent}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
            onOpenConversationWithUser={(u) => {
              setActivePeer(u);
              setActiveTab('dms');
            }}
          />
        )}
      </main>

    </div>
  );
};

export default MessagesPage;
