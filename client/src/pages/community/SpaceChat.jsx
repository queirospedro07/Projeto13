import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';
import { CallStage } from '../../components/call/CallStage';
import { SpaceChannelList } from '../../features/community/components/SpaceChannelList';
import { SpaceMessageStream } from '../../features/community/components/SpaceMessageStream';
import { SpaceMembersSidebar } from '../../features/community/components/SpaceMembersSidebar';
export const SpaceChat = () => {
  const {
    id
  } = useParams();
  const {
    user
  } = useAuth();
  const {
    socket,
    joinChannel,
    leaveChannel,
    sendTyping,
    sendStopTyping
  } = useSocket();
  const {
    toast
  } = useToast();
  const [space, setSpace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMembers, setShowMembers] = useState(true);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inVoiceRoom, setInVoiceRoom] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState('text');
  const [newChTopic, setNewChTopic] = useState('');
  const [isSavingChannel, setIsSavingChannel] = useState(false);
  const typingTimeoutRef = useRef(null);
  useEffect(() => {
    if (!id) return;
    api.getSpace(id).then(data => {
      setSpace(data);
      setChannels(data.channels || []);
      if (data.channels && data.channels.length > 0) {
        setCurrentChannel(data.channels[0]);
      }
    }).catch(err => console.error(err));
  }, [id]);
  useEffect(() => {
    if (!currentChannel) return;
    joinChannel(currentChannel.id);
    api.getChannelMessages(currentChannel.id).then(msgs => setMessages(msgs || [])).catch(() => {});
    return () => {
      leaveChannel(currentChannel.id);
    };
  }, [currentChannel?.id]);
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = msg => {
      if (msg.channelId === currentChannel?.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const optimisticIdx = prev.findIndex(m => m.id.startsWith('temp-') && (m.senderId === msg.senderId || m.sender?.username === msg.sender?.username) && m.content === msg.content);
          if (optimisticIdx !== -1) {
            const next = [...prev];
            next[optimisticIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });
      }
    };
    const handleTyping = ({
      channelId,
      username
    }) => {
      if (channelId === currentChannel?.id && username !== user?.name && username !== user?.username) {
        setTypingUsers(prev => Array.from(new Set([...prev, username])));
      }
    };
    const handleStopTyping = ({
      channelId,
      username
    }) => {
      if (channelId === currentChannel?.id) {
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    };
    socket.on('new-message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, currentChannel?.id, user?.name, user?.username]);
  const handleSendMessage = async e => {
    e.preventDefault();
    if (!inputContent.trim() || !currentChannel) return;
    const contentToSend = inputContent.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const currentReply = replyingTo;
    const optimisticMsg = {
      id: tempId,
      channelId: currentChannel.id,
      senderId: user?.id || 'temp-user',
      content: contentToSend,
      isPinned: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'temp-user',
        name: user?.name || 'Eu',
        username: user?.username || 'eu',
        avatarUrl: user?.avatarUrl,
        role: user?.role || 'STUDENT'
      },
      replyTo: currentReply ? {
        id: currentReply.id,
        content: currentReply.content,
        sender: currentReply.sender
      } : undefined,
      reactions: []
    };
    setInputContent('');
    setReplyingTo(null);
    setMessages(prev => [...prev, optimisticMsg]);
    soundEffects.playMessage();
    sendStopTyping(currentChannel.id);
    socket?.emit('send-message', optimisticMsg);
    try {
      const newMsg = await api.sendMessage(currentChannel.id, {
        content: contentToSend,
        replyToId: currentReply?.id
      });
      setMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
      socket?.emit('send-message', newMsg);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputContent(contentToSend);
      toast({
        title: 'Erro',
        message: 'Não foi possível enviar a mensagem',
        type: 'error'
      });
    }
  };
  const handleInputChange = e => {
    setInputContent(e.target.value);
    if (!currentChannel) return;
    sendTyping(currentChannel.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(currentChannel.id);
    }, 2000);
  };
  const handleCreateChannel = async e => {
    e.preventDefault();
    if (!newChName.trim() || !space) return;
    setIsSavingChannel(true);
    const formattedName = newChName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      const created = await api.createChannel(space.id, {
        name: formattedName,
        type: newChType,
        topic: newChTopic
      });
      setChannels(prev => [...prev, created]);
      setCurrentChannel(created);
      soundEffects.playSuccess();
      setShowChannelModal(false);
      setNewChName('');
      setNewChTopic('');
      toast({
        title: 'Canal Criado!',
        message: `Canal #${created.name} adicionado com sucesso.`,
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro ao criar canal',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsSavingChannel(false);
    }
  };
  const isOwnerOrAdmin = user?.role === 'ADMIN' || user?.role === 'CREATOR' || space?.ownerId === user?.id;
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      await api.toggleReaction(messageId, emoji);
      socket?.emit('reaction-updated', {
        channelId: currentChannel?.id
      });
      const updated = await api.getChannelMessages(currentChannel.id);
      setMessages(updated);
    } catch (err) {}
  };
  const handleTogglePin = async messageId => {
    try {
      const res = await api.togglePin(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? {
        ...m,
        isPinned: res.isPinned
      } : m));
      toast({
        title: res.isPinned ? 'Mensagem Fixada' : 'Mensagem Desafixada'
      });
    } catch (err) {}
  };
  const filteredMessages = messages.filter(m => {
    if (pinnedOnly && !m.isPinned) return false;
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  return <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm relative">
      
      {showMobileSidebar && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setShowMobileSidebar(false)} />}

      
      
      <div className={`
        absolute inset-y-0 left-0 z-30 transition-transform duration-200
        md:relative md:translate-x-0 md:z-auto
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SpaceChannelList space={space} channels={channels} currentChannel={currentChannel} inVoiceRoom={inVoiceRoom} isOwnerOrAdmin={isOwnerOrAdmin} onSelectChannel={ch => {
        setInVoiceRoom(null);
        setCurrentChannel(ch);
        setShowMobileSidebar(false);
      }} onSelectVoiceRoom={roomName => {
        setInVoiceRoom(roomName);
        soundEffects.playJoinCall();
        setShowMobileSidebar(false);
      }} onDisconnectVoiceRoom={() => {
        setInVoiceRoom(null);
        soundEffects.playLeaveCall();
      }} onOpenCreateChannelModal={() => {
        setNewChType('text');
        setShowChannelModal(true);
        setShowMobileSidebar(false);
      }} />
      </div>

      
      {inVoiceRoom ? <CallStage key={inVoiceRoom} roomName={inVoiceRoom} roomId={`space_${space?.id || 'community'}_${inVoiceRoom.toLowerCase().replace(/[^a-z0-9]/g, '_')}`} roomType={inVoiceRoom.toLowerCase().includes('palco') || inVoiceRoom.toLowerCase().includes('masterclass') ? 'stage' : inVoiceRoom.toLowerCase().includes('dúvida') || inVoiceRoom.toLowerCase().includes('duvidas') ? 'qa' : 'voice'} isStageMode={inVoiceRoom.toLowerCase().includes('palco') || inVoiceRoom.toLowerCase().includes('masterclass')} onDisconnect={() => setInVoiceRoom(null)} /> : <>
          
          <button onClick={() => setShowMobileSidebar(true)} className="md:hidden absolute top-3 left-3 z-10 p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer" title="Canais" aria-label="Abrir lista de canais">
            <Menu className="w-5 h-5" />
          </button>
          <SpaceMessageStream currentChannel={currentChannel} messages={filteredMessages} inputContent={inputContent} onInputChange={handleInputChange} onSendMessage={handleSendMessage} replyingTo={replyingTo} onSetReplyingTo={setReplyingTo} typingUsers={typingUsers} searchQuery={searchQuery} onSearchChange={setSearchQuery} pinnedOnly={pinnedOnly} onTogglePinnedOnly={() => setPinnedOnly(!pinnedOnly)} showMembers={showMembers} onToggleMembers={() => setShowMembers(!showMembers)} isOwnerOrAdmin={isOwnerOrAdmin} onToggleReaction={handleToggleReaction} onTogglePin={handleTogglePin} />

          {showMembers && <SpaceMembersSidebar space={space} />}
        </>}

      
      {showChannelModal && <Modal isOpen={showChannelModal} onClose={() => setShowChannelModal(false)} title="Criar Novo Canal">
          <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sugestões Rápidas (1-Clique)
              </label>
              <div className="flex flex-wrap gap-2">
                {[{
              name: 'anuncios',
              type: 'text',
              label: 'Anúncios',
              topic: 'Avisos e novidades importantes da comunidade'
            }, {
              name: 'geral',
              type: 'text',
              label: 'Geral',
              topic: 'Conversas gerais e apresentações'
            }, {
              name: 'sala-de-estudo',
              type: 'voice',
              label: 'Voz Livre',
              topic: 'Sala com áudio e partilha livre para todos'
            }, {
              name: 'palco-masterclass',
              type: 'stage',
              label: 'Palco (Apenas Adm)',
              topic: 'Apenas os instrutores falam e partilham ecrã'
            }, {
              name: 'fila-de-duvidas',
              type: 'qa',
              label: 'Dúvidas & Q&A',
              topic: 'Fila moderada de perguntas e respostas'
            }].map(tmpl => <button key={tmpl.name} type="button" onClick={() => {
              setNewChName(tmpl.name);
              setNewChType(tmpl.type);
              setNewChTopic(tmpl.topic);
            }} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                    {tmpl.label}
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2">
                Tipo e Regras do Canal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button type="button" onClick={() => setNewChType('text')} className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newChType === 'text' ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <p className="font-semibold text-xs">Canal de Texto</p>
                  <p className={`text-[11px] mt-0.5 ${newChType === 'text' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Mensagens e fórum
                  </p>
                </button>

                <button type="button" onClick={() => setNewChType('voice')} className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newChType === 'voice' ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <p className="font-semibold text-xs">Conversação Livre</p>
                  <p className={`text-[11px] mt-0.5 ${newChType === 'voice' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Todos podem falar e partilhar
                  </p>
                </button>

                <button type="button" onClick={() => setNewChType('stage')} className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newChType === 'stage' ? 'border-purple-600 bg-purple-950 text-white font-medium shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'}`}>
                  <p className="font-semibold text-xs text-purple-600 dark:text-purple-400">
                    Palco (Apenas Adm Fala)
                  </p>
                  <p className={`text-[11px] mt-0.5 ${newChType === 'stage' ? 'text-purple-200' : 'text-slate-500'}`}>
                    Alunos proibidos sem autorização
                  </p>
                </button>

                <button type="button" onClick={() => setNewChType('qa')} className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newChType === 'qa' ? 'border-amber-600 bg-amber-950 text-white font-medium shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50'}`}>
                  <p className="font-semibold text-xs text-amber-600 dark:text-amber-400">
                    Sala de Dúvidas (Q&A)
                  </p>
                  <p className={`text-[11px] mt-0.5 ${newChType === 'qa' ? 'text-amber-200' : 'text-slate-500'}`}>
                    Fila moderada de oradores
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Nome do Canal</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  #
                </span>
                <input type="text" required placeholder="ex: palco-masterclass" value={newChName} onChange={e => setNewChName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Tópico ou Descrição (Opcional)
              </label>
              <input type="text" placeholder="ex: Partilha de recursos e links recomendados" value={newChTopic} onChange={e => setNewChTopic(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setShowChannelModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={isSavingChannel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50">
                {isSavingChannel ? 'A criar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default SpaceChat;