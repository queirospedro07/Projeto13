import './SpaceChannelList.css';
import { Link } from 'react-router-dom';
import {
  LuHash as Hash,
  LuVolume2 as Volume2,
  LuArrowLeft as ArrowLeft,
  LuPlus as Plus,
  LuPlay as Play,
  LuArrowRight as ArrowRight,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
export const SpaceChannelList = ({
  space,
  channels,
  currentChannel,
  inVoiceRoom,
  isOwnerOrAdmin,
  onSelectChannel,
  onSelectVoiceRoom,
  onDisconnectVoiceRoom,
  onOpenCreateChannelModal,
}) => {
  return (
    <aside className="space-channel-list-sidebar">
      <div>
        <Link to="/explore" className="space-channel-list-link">
          <div className="space-channel-list-panel">
            <Avatar src={space?.logoUrl} name={space?.name} size="sm" />
            <span className="space-channel-list-label">{space?.name || 'Comunidade'}</span>
          </div>
          <ArrowLeft className="space-channel-list-arrow-left" />
        </Link>

        <div className="space-channel-list-panel-2">
          <Link
            to={`/learn/${space?.courseId || space?.slug || space?.id}`}
            className="space-channel-list-link-2 subtle-shadow"
          >
            <div className="space-channel-list-panel-3">
              <Play className="space-channel-list-play" />
              <span>Ver Aulas & Vídeos</span>
            </div>
            <ArrowRight className="space-channel-list-arrow-right" />
          </Link>
        </div>

        <div className="space-channel-list-panel-4">
          <div>
            <div className="space-channel-list-panel-5">
              <span>Canais de Texto</span>
              {isOwnerOrAdmin && (
                <button
                  onClick={onOpenCreateChannelModal}
                  className="space-channel-list-button"
                  title="Criar canal"
                >
                  <Plus className="space-channel-list-arrow-right" />
                </button>
              )}
            </div>
            <div className="space-channel-list-panel-6">
              {channels.map((ch) => {
                const isSelected = ch.id === currentChannel?.id && !inVoiceRoom;
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChannel(ch)}
                    className={`space-channel-list-button-2 ${isSelected ? 'space-channel-list-button-3' : 'space-channel-list-button-4'}`}
                  >
                    <Hash
                      className={`space-channel-list-hash ${isSelected ? 'space-channel-list-hash-2' : 'space-channel-list-hash-3'}`}
                    />
                    <span className="space-channel-list-label-2">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="space-channel-list-panel-7">Salas de Voz & Transmissão</div>
            <div className="space-channel-list-panel-6">
              {['Sala de Estudo', 'Foco & Silêncio', 'Tira-Dúvidas'].map((roomName) => {
                const isActive = inVoiceRoom === roomName;
                return (
                  <button
                    key={roomName}
                    onClick={() => onSelectVoiceRoom(roomName)}
                    className={`space-channel-list-button-5 ${isActive ? 'space-channel-list-button-6' : 'space-channel-list-button-4'}`}
                  >
                    <div className="space-channel-list-panel-8">
                      <Volume2
                        className={`space-channel-list-hash ${isActive ? 'space-channel-list-volume2' : 'space-channel-list-hash-3'}`}
                      />
                      <span className="space-channel-list-label-2">{roomName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {inVoiceRoom && (
        <div className="space-channel-list-panel-9">
          <div className="space-channel-list-panel-10">
            <div className="space-channel-list-panel-11">
              <span className="space-channel-list-label-3"></span>
              <span className="space-channel-list-label-4">{inVoiceRoom}</span>
            </div>
            <button onClick={onDisconnectVoiceRoom} className="space-channel-list-button-7">
              Desconectar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
