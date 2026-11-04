import './CourseDiscussionChannel.css';
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuHash as Hash,
  LuSparkles as Sparkles,
  LuSend as Send,
  LuReply as Reply,
  LuX as X,
  LuCheck as Check,
  LuCircleCheck as CheckCircle2,
  LuPin as Pin,
  LuLock as Lock,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { formatarCargo } from '../../utils/formatting';

export const CursoCanalConversa = ({
  channel: canal,
  messages: mensagens,
  chatInput: conversaEntrada,
  onChatInputChange: onConversaEntradaAlterar,
  onSendMessage: onEnviarMensagem,
  replyingTo,
  onSetReplyingTo: onDefinirReplyingTo,
  onTogglePin: onAlternarAfixar,
  onToggleResolve: onAlternarResolver,
  resolvedMessageIds: resolvedMensagemIds,
  showMembersList: mostrarMembrosListar,
  isCreatorOrAdmin: isFormadorOrAdministracao,
  creatorUser: formadorUtilizador,
  onInsertGuidingPrompt: onInserirOrientadoraPrompt,
  classmates: colegas = [],
}) => {
  const mensagensTerminarRef = useRef(null);

  useEffect(() => {
    mensagensTerminarRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [mensagens.length]);

  const isAnnouncement = canal.modoAcesso === 'announcement' || canal.name.includes('anuncio');
  const podeEnviar = isFormadorOrAdministracao || !isAnnouncement;

  return (
    <div className="course-channel-chat-panel">
      <div className="course-channel-chat-panel-2">
        {canal.perguntaOrientadora && (
          <div className="course-channel-chat-panel-3">
            <div className="course-channel-chat-panel-4">
              <div className="course-channel-chat-panel-5">
                <Sparkles className="course-channel-chat-sparkles" />
              </div>
              <div>
                <p className="course-channel-chat-description">Desafio / Pergunta Orientadora</p>
                <p className="course-channel-chat-description-2">{canal.perguntaOrientadora}</p>
              </div>
            </div>
            {podeEnviar && (
              <button
                onClick={() => onInserirOrientadoraPrompt(canal.perguntaOrientadora)}
                className="course-channel-chat-button"
              >
                Responder ao Desafio
              </button>
            )}
          </div>
        )}

        <div className="course-channel-chat-panel-6 custom-scrollbar">
          {mensagens.length === 0 ? (
            <div className="course-channel-chat-panel-7">
              <Hash className="course-channel-chat-hash" />
              <p className="course-channel-chat-description-3">Início do canal #{canal.name}</p>
              <p className="course-channel-chat-description-4">
                {isAnnouncement
                  ? 'Os comunicados e avisos oficiais do instrutor serão publicados aqui.'
                  : 'Seja o primeiro a enviar uma mensagem para os seus colegas e instrutor.'}
              </p>
            </div>
          ) : (
            mensagens.map((m) => {
              const isResolved = resolvedMensagemIds.has(m.id);
              const isRemetenteFormador =
                m.sender?.role === 'CREATOR' || m.sender?.role === 'ADMIN';

              return (
                <div
                  key={m.id}
                  className={`course-channel-chat-panel-8 ui-group ${isResolved ? 'course-channel-chat-panel-9' : m.estaAfixada ? 'course-channel-chat-panel-10' : 'course-channel-chat-panel-11'}`}
                >
                  <Link
                    to={`/perfil/${m.sender?.username || m.sender?.id || ''}`}
                    className="course-channel-chat-link"
                    title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                  >
                    <Avatar
                      src={m.sender?.urlAvatar}
                      name={m.sender?.name || 'Aluno'}
                      size="md"
                    />
                  </Link>

                  <div className="course-channel-chat-panel-12">
                    <div className="course-channel-chat-panel-13">
                      <Link
                        to={`/perfil/${m.sender?.username || m.sender?.id || ''}`}
                        className="course-channel-chat-link-2"
                        title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                      >
                        {m.sender?.name || 'Aluno'}
                      </Link>
                      {isRemetenteFormador && (
                        <span className="course-channel-chat-label">Instrutor</span>
                      )}
                      <span className="course-channel-chat-label-2">
                        {new Date(m.criadoEm).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {isResolved && (
                        <span className="course-channel-chat-label-3">
                          <CheckCircle2 className="course-channel-chat-check-circle2" />
                          Resolvido
                        </span>
                      )}
                    </div>

                    {m.replyTo && (
                      <div className="course-channel-chat-panel-14">
                        <Reply className="course-channel-chat-reply" />
                        <span className="course-channel-chat-label-4">
                          {m.replyTo.sender?.name || 'Aluno'}:
                        </span>
                        <span className="course-channel-chat-label-5">{m.replyTo.content}</span>
                      </div>
                    )}

                    <p className="course-channel-chat-description-5">{m.content}</p>
                  </div>

                  <div className="course-channel-chat-panel-15">
                    {podeEnviar && (
                      <button
                        onClick={() => onDefinirReplyingTo(m)}
                        className="course-channel-chat-button-2"
                        title="Responder"
                      >
                        <Reply className="course-channel-chat-check-circle2" />
                      </button>
                    )}

                    {canal.type === 'qa' && onAlternarResolver && (
                      <button
                        onClick={() => onAlternarResolver(m.id)}
                        className={`course-channel-chat-button-3 ${isResolved ? 'course-channel-chat-button-4' : 'course-channel-chat-button-5'}`}
                        title={isResolved ? 'Reabrir dúvida' : 'Marcar como resolvido'}
                      >
                        <Check className="course-channel-chat-check-circle2" />
                      </button>
                    )}

                    {isFormadorOrAdministracao && onAlternarAfixar && (
                      <button
                        onClick={() => onAlternarAfixar(m.id)}
                        className={`course-channel-chat-button-6 ${m.estaAfixada ? 'course-channel-chat-button-7' : 'course-channel-chat-button-8'}`}
                        title={m.estaAfixada ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin className="course-channel-chat-check-circle2" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={mensagensTerminarRef} />
        </div>

        {replyingTo && (
          <div className="course-channel-chat-panel-16">
            <div className="course-channel-chat-panel-17">
              <Reply className="course-channel-chat-reply-2" />
              <span>
                A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"
              </span>
            </div>
            <button
              onClick={() => onDefinirReplyingTo(null)}
              className="course-channel-chat-button-9"
            >
              <X className="course-channel-chat-sparkles" />
            </button>
          </div>
        )}

        {!podeEnviar ? (
          <div className="course-channel-chat-panel-18">
            <div className="course-channel-chat-panel-19">
              <Lock className="course-channel-chat-lock" />
              <span>
                Apenas o instrutor e administradores podem enviar comunicados neste canal.
              </span>
            </div>
          </div>
        ) : (
          <div className="course-channel-chat-panel-20">
            <form
              onSubmit={onEnviarMensagem}
              className="course-channel-chat-form"
            >
              <input
                type="text"
                placeholder={`Enviar mensagem em #${canal.name}...`}
                value={conversaEntrada}
                onChange={(evento) => onConversaEntradaAlterar(evento.target.value)}
                className="course-channel-chat-field"
              />
              <button
                type="submit"
                disabled={!conversaEntrada.trim()}
                className="course-channel-chat-button-10"
              >
                <Send className="course-channel-chat-sparkles" />
              </button>
            </form>
          </div>
        )}
      </div>

      {mostrarMembrosListar && (
        <aside className="course-channel-chat-sidebar custom-scrollbar">
          <div className="course-channel-chat-panel-21">
            <div className="course-channel-chat-panel-22">Instrutor do Curso</div>
            <Link
              to={`/perfil/${formadorUtilizador?.username || formadorUtilizador?.id || ''}`}
              className="course-channel-chat-link-3 subtle-shadow ui-group"
              title={
                formadorUtilizador?.name
                  ? `Ver perfil de ${formadorUtilizador.name}`
                  : 'Ver perfil do instrutor'
              }
            >
              <Avatar
                src={formadorUtilizador?.urlAvatar}
                name={formadorUtilizador?.name || 'Instrutor'}
                size="sm"
                status="online"
              />
              <div className="course-channel-chat-panel-23">
                <p className="course-channel-chat-description-6">
                  {formadorUtilizador?.name || 'Instrutor'}
                </p>
                <p className="course-channel-chat-description-7">Corpo Docente</p>
              </div>
            </Link>
          </div>

          <div>
            <div className="course-channel-chat-panel-22">Colegas de Turma</div>
            {colegas.length === 0 ? (
              <div className="course-channel-chat-panel-24">
                <p className="course-channel-chat-description-8">
                  Ainda não há outros colegas matriculados nesta turma.
                </p>
              </div>
            ) : (
              <div className="course-channel-chat-panel-25">
                {colegas.map((m) => (
                  <Link
                    key={m.id}
                    to={`/perfil/${m.username || m.id || ''}`}
                    className="course-channel-chat-link-4 ui-group"
                    title={`Ver perfil de ${m.name}`}
                  >
                    <Avatar
                      src={m.urlAvatar}
                      name={m.name}
                      size="sm"
                      status={m.isOnline ? 'online' : undefined}
                    />
                    <div className="course-channel-chat-panel-23">
                      <p className="course-channel-chat-description-9">{m.name}</p>
                      <p className="course-channel-chat-label-2">{formatarCargo(m.role)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
