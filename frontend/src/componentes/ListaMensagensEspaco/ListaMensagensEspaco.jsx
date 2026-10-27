import './ListaMensagensEspaco.css';
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuHash as Hash,
  LuSearch as Search,
  LuPin as Pin,
  LuUsers as Users,
  LuSend as Send,
  LuReply as Reply,
  LuX as X,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';

export const ListaMensagensEspaco = ({
  currentChannel: atualCanal,
  messages: mensagens,
  inputContent: entradaConteudo,
  onInputChange: onEntradaAlterar,
  onSendMessage: onEnviarMensagem,
  replyingTo,
  onSetReplyingTo: onDefinirReplyingTo,
  typingUsers: escreverUtilizadores,
  searchQuery: pesquisarConsultar,
  onSearchChange: onPesquisarAlterar,
  pinnedOnly: afixadoApenas,
  onTogglePinnedOnly: onAlternarAfixadoApenas,
  showMembers: mostrarMembros,
  onToggleMembers: onAlternarMembros,
  isOwnerOrAdmin: isProprietarioOrAdministracao,
  onTogglePin: onAlternarAfixar,
}) => {
  const mensagensTerminarRef = useRef(null);

  useEffect(() => {
    mensagensTerminarRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [mensagens.length]);

  return (
    <div className="space-message-stream-panel">
      <div className="space-message-stream-panel-2">
        <div className="space-message-stream-panel-3">
          <Hash className="space-message-stream-hash" />
          <span className="space-message-stream-label">{atualCanal?.name || 'geral'}</span>
          {atualCanal?.topic && (
            <>
              <span className="space-message-stream-label-2">|</span>
              <span className="space-message-stream-label-3">{atualCanal.topic}</span>
            </>
          )}
        </div>

        <div className="space-message-stream-panel-4">
          <div className="space-message-stream-panel-5">
            <Search className="space-message-stream-search" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={pesquisarConsultar}
              onChange={(evento) => onPesquisarAlterar(evento.target.value)}
              className="space-message-stream-field"
            />
          </div>

          <button
            onClick={onAlternarAfixadoApenas}
            className={`space-message-stream-button ${afixadoApenas ? 'space-message-stream-button-2' : 'space-message-stream-button-3'}`}
            title="Filtrar mensagens fixadas"
          >
            <Pin className="space-message-stream-pin" />
          </button>

          <button
            onClick={onAlternarMembros}
            className={`space-message-stream-button ${mostrarMembros ? 'space-message-stream-button-4' : 'space-message-stream-button-3'}`}
            title="Mostrar membros"
          >
            <Users className="space-message-stream-pin" />
          </button>
        </div>
      </div>

      <div className="space-message-stream-panel-6 custom-scrollbar">
        {mensagens.length === 0 ? (
          <div className="space-message-stream-panel-7">
            <div className="space-message-stream-panel-8">
              <Hash className="space-message-stream-hash-2" />
            </div>
            <h3 className="space-message-stream-subheading">
              Bem-vindo ao canal #{atualCanal?.name || 'geral'}!
            </h3>
            <p className="space-message-stream-description">
              {atualCanal?.topic || 'Este é o início do histórico de mensagens deste canal.'}
            </p>
          </div>
        ) : (
          mensagens.map((m) => (
            <div
              key={m.id}
              className={`space-message-stream-panel-9 ui-group ${m.estaAfixada ? 'space-message-stream-panel-10' : ''}`}
            >
              <Link
                to={`/perfil/${m.sender?.username || m.sender?.id || ''}`}
                className="space-message-stream-link"
                title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
              >
                <Avatar
                  src={m.sender?.urlAvatar}
                  name={m.sender?.name || 'Membro'}
                  size="md"
                />
              </Link>

              <div className="space-message-stream-panel-11">
                <div className="space-message-stream-panel-12">
                  <Link
                    to={`/perfil/${m.sender?.username || m.sender?.id || ''}`}
                    className="space-message-stream-link-2"
                    title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                  >
                    {m.sender?.name || 'Membro'}
                  </Link>
                  {m.sender?.role === 'ADMIN' ? (
                    <span className="space-message-stream-label-4">Administracao</span>
                  ) : m.sender?.role === 'CREATOR' ? (
                    <span className="space-message-stream-label-4">Criador</span>
                  ) : null}
                  <span className="space-message-stream-label-5">
                    {new Date(m.criadoEm).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {m.estaAfixada && (
                    <span className="space-message-stream-label-6">
                      <Pin className="space-message-stream-pin-2" /> Fixada
                    </span>
                  )}
                </div>

                {m.replyTo && (
                  <div className="space-message-stream-panel-13">
                    <Reply className="space-message-stream-reply" />
                    <span className="space-message-stream-label-7">
                      {m.replyTo.sender?.name || 'Membro'}:
                    </span>
                    <span className="space-message-stream-label-8">{m.replyTo.content}</span>
                  </div>
                )}

                <p className="space-message-stream-description-2">{m.content}</p>
              </div>

              <div className="space-message-stream-panel-14">
                <button
                  onClick={() => onDefinirReplyingTo(m)}
                  className="space-message-stream-button-5"
                  title="Responder"
                  aria-label="Responder"
                >
                  <Reply className="space-message-stream-reply-2" />
                </button>
                {isProprietarioOrAdministracao && (
                  <button
                    onClick={() => onAlternarAfixar(m.id)}
                    className={`space-message-stream-button-6 ${m.estaAfixada ? 'space-message-stream-button-7' : 'space-message-stream-button-8'}`}
                    title={m.estaAfixada ? 'Desafixar' : 'Fixar'}
                  >
                    <Pin className="space-message-stream-reply-2" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={mensagensTerminarRef} />
      </div>

      {replyingTo && (
        <div className="space-message-stream-panel-15">
          <div className="space-message-stream-panel-16">
            <Reply className="space-message-stream-reply-3" />
            <span>
              A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"
            </span>
          </div>
          <button
            onClick={() => onDefinirReplyingTo(null)}
            className="space-message-stream-button-9"
          >
            <X className="space-message-stream-pin" />
          </button>
        </div>
      )}

      {escreverUtilizadores.length > 0 && (
        <div className="space-message-stream-panel-17">
          {escreverUtilizadores.join(', ')}{' '}
          {escreverUtilizadores.length === 1 ? 'está a escrever...' : 'estão a escrever...'}
        </div>
      )}

      <div className="space-message-stream-panel-18">
        <form
          onSubmit={onEnviarMensagem}
          className="space-message-stream-form"
        >
          <input
            type="text"
            placeholder={`Enviar mensagem em #${atualCanal?.name || 'geral'}...`}
            value={entradaConteudo}
            onChange={onEntradaAlterar}
            className="space-message-stream-field-2"
          />
          <button
            type="submit"
            disabled={!entradaConteudo.trim()}
            className="space-message-stream-button-10"
          >
            <Send className="space-message-stream-pin" />
          </button>
        </form>
      </div>
    </div>
  );
};
