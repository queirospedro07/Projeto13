import './SpaceChatPage.css';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { LuMenu as Menu } from 'react-icons/lu';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';
import { useActiveCall } from '../../context/ActiveCallContext';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';
import { CallStage } from '../../components/CallStage';
import { JoinCallModal } from '../../components/JoinCallModal';
import { SpaceChannelList } from '../../components/SpaceChannelList';
import { SpaceMessageStream } from '../../components/SpaceMessageStream';
import { SpaceMembersSidebar } from '../../components/SpaceMembersSidebar';
export const SpaceChatPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinChannel, leaveChannel, sendTyping, sendStopTyping } = useSocket();
  const { toast } = useToast();
  const { activeCall, startCall, endCall } = useActiveCall();
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
  const [pendingVoiceRoom, setPendingVoiceRoom] = useState(null);
  const [voiceRoomPreferences, setVoiceRoomPreferences] = useState({
    startMuted: false,
    startVideoOff: true,
  });
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState('text');
  const [newChTopic, setNewChTopic] = useState('');
  const [isSavingChannel, setIsSavingChannel] = useState(false);
  const typingTimeoutRef = useRef(null);
  useEffect(() => {
    if (activeCall && activeCall.spaceId === (space?.id || id)) {
      setInVoiceRoom(activeCall.roomName);
    } else if (!activeCall && inVoiceRoom) {
      setInVoiceRoom(null);
    }
  }, [activeCall, space?.id, id]);
  useEffect(() => {
    if (!id) return;
    api
      .get(`/spaces/${id}`)
      .then(({ data }) => data)
      .then((data) => {
        setSpace(data);
        setChannels(data.channels || []);
        if (data.channels && data.channels.length > 0) {
          setCurrentChannel(data.channels[0]);
        }
      })
      .catch((err) => console.error(err));
  }, [id]);
  useEffect(() => {
    if (!currentChannel) return;
    joinChannel(currentChannel.id);
    api
      .get(`/channels/${currentChannel.id}/messages`)
      .then(({ data }) => data)
      .then((msgs) => setMessages(msgs || []))
      .catch(() => {});
    return () => {
      leaveChannel(currentChannel.id);
    };
  }, [currentChannel?.id]);
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (msg.channelId === currentChannel?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              (m.senderId === msg.senderId || m.sender?.username === msg.sender?.username) &&
              m.content === msg.content,
          );
          if (optimisticIdx !== -1) {
            const next = [...prev];
            next[optimisticIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });
      }
    };
    const handleTyping = ({ channelId, username }) => {
      if (
        channelId === currentChannel?.id &&
        username !== user?.name &&
        username !== user?.username
      ) {
        setTypingUsers((prev) => Array.from(new Set([...prev, username])));
      }
    };
    const handleStopTyping = ({ channelId, username }) => {
      if (channelId === currentChannel?.id) {
        setTypingUsers((prev) => prev.filter((u) => u !== username));
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
  const handleSendMessage = async (e) => {
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
        role: user?.role || 'STUDENT',
      },
      replyTo: currentReply
        ? {
            id: currentReply.id,
            content: currentReply.content,
            sender: currentReply.sender,
          }
        : undefined,
      reactions: [],
    };
    setInputContent('');
    setReplyingTo(null);
    setMessages((prev) => [...prev, optimisticMsg]);
    soundEffects.playMessage();
    sendStopTyping(currentChannel.id);
    try {
      const newMsg = await api
        .post(`/channels/${currentChannel.id}/messages`, {
          content: contentToSend,
          replyToId: currentReply?.id,
        })
        .then(({ data }) => data);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputContent(contentToSend);
      toast({
        title: 'Erro',
        message: 'Não foi possível enviar a mensagem',
        type: 'error',
      });
    }
  };
  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    if (!currentChannel) return;
    sendTyping(currentChannel.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(currentChannel.id);
    }, 2000);
  };
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChName.trim() || !space) return;
    setIsSavingChannel(true);
    const formattedName = newChName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      const created = await api
        .post(`/spaces/${space.id}/channels`, {
          name: formattedName,
          type: newChType,
          topic: newChTopic,
        })
        .then(({ data }) => data);
      setChannels((prev) => [...prev, created]);
      setCurrentChannel(created);
      soundEffects.playSuccess();
      setShowChannelModal(false);
      setNewChName('');
      setNewChTopic('');
      toast({
        title: 'Canal Criado!',
        message: `Canal #${created.name} adicionado com sucesso.`,
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erro ao criar canal',
        message: err.message,
        type: 'error',
      });
    } finally {
      setIsSavingChannel(false);
    }
  };
  const isOwnerOrAdmin =
    user?.role === 'ADMIN' || user?.role === 'CREATOR' || space?.ownerId === user?.id;
  const handleTogglePin = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/pin`).then(({ data }) => data);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isPinned: res.isPinned,
              }
            : m,
        ),
      );
      toast({
        title: res.isPinned ? 'Mensagem Fixada' : 'Mensagem Desafixada',
      });
    } catch {}
  };
  const filteredMessages = messages.filter((m) => {
    if (pinnedOnly && !m.isPinned) return false;
    if (searchQuery && !(m.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });
  return (
    <div className="space-chat-panel">
      {showMobileSidebar && (
        <div className="space-chat-panel-2" onClick={() => setShowMobileSidebar(false)} />
      )}

      <div
        className={`
        space-chat-panel-3
        ${showMobileSidebar ? 'space-chat-panel-4' : 'space-chat-panel-5'}
      `}
      >
        <SpaceChannelList
          space={space}
          channels={channels}
          currentChannel={currentChannel}
          inVoiceRoom={inVoiceRoom}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onSelectChannel={(ch) => {
            setInVoiceRoom(null);
            setCurrentChannel(ch);
            setShowMobileSidebar(false);
          }}
          onSelectVoiceRoom={(roomName) => {
            setPendingVoiceRoom(roomName);
            setShowMobileSidebar(false);
          }}
          onDisconnectVoiceRoom={() => {
            setInVoiceRoom(null);
            endCall();
            soundEffects.playLeaveCall();
          }}
          onOpenCreateChannelModal={() => {
            setNewChType('text');
            setShowChannelModal(true);
            setShowMobileSidebar(false);
          }}
        />
      </div>

      {inVoiceRoom ? (
        <CallStage
          key={`${space?.id || id || 'community'}_${inVoiceRoom}`}
          roomName={inVoiceRoom}
          roomId={`space_${space?.id || id || 'community'}_${inVoiceRoom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')}`}
          roomType={
            inVoiceRoom.toLowerCase().includes('palco') ||
            inVoiceRoom.toLowerCase().includes('masterclass')
              ? 'stage'
              : inVoiceRoom.toLowerCase().includes('dúvida') ||
                  inVoiceRoom.toLowerCase().includes('duvidas')
                ? 'qa'
                : 'voice'
          }
          isStageMode={
            inVoiceRoom.toLowerCase().includes('palco') ||
            inVoiceRoom.toLowerCase().includes('masterclass')
          }
          initialMuted={voiceRoomPreferences.startMuted}
          initialCameraOn={!voiceRoomPreferences.startVideoOff}
          onDisconnect={() => {
            setInVoiceRoom(null);
            endCall();
          }}
        />
      ) : (
        <>
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="space-chat-button"
            title="Canais"
            aria-label="Abrir lista de canais"
          >
            <Menu className="space-chat-menu" />
          </button>
          <SpaceMessageStream
            currentChannel={currentChannel}
            messages={filteredMessages}
            inputContent={inputContent}
            onInputChange={handleInputChange}
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onSetReplyingTo={setReplyingTo}
            typingUsers={typingUsers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pinnedOnly={pinnedOnly}
            onTogglePinnedOnly={() => setPinnedOnly(!pinnedOnly)}
            showMembers={showMembers}
            onToggleMembers={() => setShowMembers(!showMembers)}
            isOwnerOrAdmin={isOwnerOrAdmin}
            onTogglePin={handleTogglePin}
          />

          {showMembers && <SpaceMembersSidebar space={space} />}
        </>
      )}

      {showChannelModal && (
        <Modal
          isOpen={showChannelModal}
          onClose={() => setShowChannelModal(false)}
          title="Criar Novo Canal"
        >
          <form onSubmit={handleCreateChannel} className="space-chat-form">
            <div>
              <label className="space-chat-field-label">Sugestões Rápidas (1-Clique)</label>
              <div className="space-chat-panel-6">
                {[
                  {
                    name: 'anuncios',
                    type: 'text',
                    label: 'Anúncios',
                    topic: 'Avisos e novidades importantes da comunidade',
                  },
                  {
                    name: 'geral',
                    type: 'text',
                    label: 'Geral',
                    topic: 'Conversas gerais e apresentações',
                  },
                  {
                    name: 'sala-de-estudo',
                    type: 'voice',
                    label: 'Voz Livre',
                    topic: 'Sala com áudio e partilha livre para todos',
                  },
                  {
                    name: 'palco-masterclass',
                    type: 'stage',
                    label: 'Palco (Apenas Adm)',
                    topic: 'Apenas os instrutores falam e partilham ecrã',
                  },
                  {
                    name: 'fila-de-duvidas',
                    type: 'qa',
                    label: 'Dúvidas & Q&A',
                    topic: 'Fila moderada de perguntas e respostas',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setNewChName(tmpl.name);
                      setNewChType(tmpl.type);
                      setNewChTopic(tmpl.topic);
                    }}
                    className="space-chat-button-2"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-2">Tipo e Regras do Canal</label>
              <div className="space-chat-panel-7">
                <button
                  type="button"
                  onClick={() => setNewChType('text')}
                  className={`space-chat-button-3 ${newChType === 'text' ? 'space-chat-button-4' : 'space-chat-button-5'}`}
                >
                  <p className="space-chat-description">Canal de Texto</p>
                  <p
                    className={`space-chat-description-2 ${newChType === 'text' ? 'space-chat-description-3' : 'space-chat-description-4'}`}
                  >
                    Mensagens e fórum
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewChType('voice')}
                  className={`space-chat-button-3 ${newChType === 'voice' ? 'space-chat-button-4' : 'space-chat-button-5'}`}
                >
                  <p className="space-chat-description">Conversação Livre</p>
                  <p
                    className={`space-chat-description-2 ${newChType === 'voice' ? 'space-chat-description-3' : 'space-chat-description-4'}`}
                  >
                    Todos podem falar e partilhar
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewChType('stage')}
                  className={`space-chat-button-3 ${newChType === 'stage' ? 'space-chat-button-6' : 'space-chat-button-7'}`}
                >
                  <p className="space-chat-description-5">Palco (Apenas Adm Fala)</p>
                  <p
                    className={`space-chat-description-2 ${newChType === 'stage' ? 'space-chat-description-6' : 'space-chat-description-4'}`}
                  >
                    Alunos proibidos sem autorização
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewChType('qa')}
                  className={`space-chat-button-3 ${newChType === 'qa' ? 'space-chat-button-8' : 'space-chat-button-9'}`}
                >
                  <p className="space-chat-description-7">Sala de Dúvidas (Q&A)</p>
                  <p
                    className={`space-chat-description-2 ${newChType === 'qa' ? 'space-chat-description-8' : 'space-chat-description-4'}`}
                  >
                    Fila moderada de oradores
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-3">Nome do Canal</label>
              <div className="space-chat-panel-8">
                <span className="space-chat-label">#</span>
                <input
                  type="text"
                  required
                  placeholder="ex: palco-masterclass"
                  value={newChName}
                  onChange={(e) => setNewChName(e.target.value)}
                  className="space-chat-field"
                />
              </div>
            </div>

            <div>
              <label className="space-chat-field-label-3">Tópico ou Descrição (Opcional)</label>
              <input
                type="text"
                placeholder="ex: Partilha de recursos e links recomendados"
                value={newChTopic}
                onChange={(e) => setNewChTopic(e.target.value)}
                className="space-chat-field-2"
              />
            </div>

            <div className="space-chat-panel-9">
              <button
                type="button"
                onClick={() => setShowChannelModal(false)}
                className="space-chat-button-10"
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSavingChannel} className="space-chat-button-11">
                {isSavingChannel ? 'A criar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de confirmação com informações principais antes de entrar na chamada da comunidade */}
      <JoinCallModal
        isOpen={Boolean(pendingVoiceRoom)}
        roomName={pendingVoiceRoom}
        contextTitle={space?.name}
        onClose={() => setPendingVoiceRoom(null)}
        onConfirm={({ startMuted, startVideoOff }) => {
          const room = pendingVoiceRoom;
          if (activeCall) {
            endCall();
          }
          setVoiceRoomPreferences({
            startMuted,
            startVideoOff,
          });
          setInVoiceRoom(room);
          soundEffects.playJoinCall();
          const cleanRoomId = `space_${space?.id || id || 'community'}_${room
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')}`;
          startCall({
            roomId: cleanRoomId,
            roomName: room,
            contextTitle: space?.name || 'Comunidade',
            spaceId: space?.id || id,
            returnUrl: `/community/${space?.id || id}`,
          });
          setPendingVoiceRoom(null);
        }}
      />
    </div>
  );
};
export default SpaceChatPage;
