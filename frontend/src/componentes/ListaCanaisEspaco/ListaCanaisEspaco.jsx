import './ListaCanaisEspaco.css';
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

export const ListaCanaisEspaco = ({
  space: espaco,
  channels: canais,
  currentChannel: atualCanal,
  inVoiceRoom: inVozSala,
  isOwnerOrAdmin: isProprietarioOrAdministracao,
  onSelectChannel: onSelecionarCanal,
  onSelectVoiceRoom: onSelecionarVozSala,
  onDisconnectVoiceRoom: onDisconnectVozSala,
  onOpenCreateChannelModal: onAbrirCriarCanalJanela,
}) => {
  return (
    <aside className="space-channel-list-sidebar">
      <div>
        <Link
          to="/explorar"
          className="space-channel-list-link"
        >
          <div className="space-channel-list-panel">
            <Avatar
              src={espaco?.logoUrl}
              name={espaco?.name}
              size="sm"
            />
            <span className="space-channel-list-label">{espaco?.name || 'Comunidade'}</span>
          </div>
          <ArrowLeft className="space-channel-list-arrow-left" />
        </Link>

        <div className="space-channel-list-panel-2">
          <Link
            to={`/aprender/${espaco?.idCurso || espaco?.slug || espaco?.id}`}
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
              {isProprietarioOrAdministracao && (
                <button
                  onClick={onAbrirCriarCanalJanela}
                  className="space-channel-list-button"
                  title="Criar canal"
                >
                  <Plus className="space-channel-list-arrow-right" />
                </button>
              )}
            </div>
            <div className="space-channel-list-panel-6">
              {canais.map((ch) => {
                const isSelecionado = ch.id === atualCanal?.id && !inVozSala;

                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelecionarCanal(ch)}
                    className={`space-channel-list-button-2 ${isSelecionado ? 'space-channel-list-button-3' : 'space-channel-list-button-4'}`}
                  >
                    <Hash
                      className={`space-channel-list-hash ${isSelecionado ? 'space-channel-list-hash-2' : 'space-channel-list-hash-3'}`}
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
              {['Sala de Estudo', 'Foco & Silêncio', 'Tira-Dúvidas'].map((salaNome) => {
                const isAtivo = inVozSala === salaNome;

                return (
                  <button
                    key={salaNome}
                    onClick={() => onSelecionarVozSala(salaNome)}
                    className={`space-channel-list-button-5 ${isAtivo ? 'space-channel-list-button-6' : 'space-channel-list-button-4'}`}
                  >
                    <div className="space-channel-list-panel-8">
                      <Volume2
                        className={`space-channel-list-hash ${isAtivo ? 'space-channel-list-volume2' : 'space-channel-list-hash-3'}`}
                      />
                      <span className="space-channel-list-label-2">{salaNome}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {inVozSala && (
        <div className="space-channel-list-panel-9">
          <div className="space-channel-list-panel-10">
            <div className="space-channel-list-panel-11">
              <span className="space-channel-list-label-3"></span>
              <span className="space-channel-list-label-4">{inVozSala}</span>
            </div>
            <button
              onClick={onDisconnectVozSala}
              className="space-channel-list-button-7"
            >
              Desconectar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
