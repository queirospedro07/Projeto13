import './CourseChannelChat.css';
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hash,
  HelpCircle,
  Sparkles,
  Users,
  Send,
  Reply,
  X,
  Check,
  CheckCircle2,
  Pin,
  Lock,
} from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { formatRole } from '../../../utils/formatters';
export const CourseChannelChat = ({
  channel,
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  replyingTo,
  onSetReplyingTo,
  onTogglePin,
  onToggleResolve,
  resolvedMessageIds,
  showMembersList,
  onToggleMembersList,
  isCreatorOrAdmin,
  creatorUser,
  currentUserId,
  onInsertGuidingPrompt,
  classmates = [],
}) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages.length]);
  const isAnnouncement = channel.accessMode === 'announcement' || channel.name.includes('anuncio');
  const canPost = isCreatorOrAdmin || !isAnnouncement;
  return (
    <div className="course-channel-chat-panel">
      <div className="course-channel-chat-panel-2">
        {channel.guidingQuestion && (
          <div className="course-channel-chat-panel-3">
            <div className="course-channel-chat-panel-4">
              <div className="course-channel-chat-panel-5">
                <Sparkles className="course-channel-chat-sparkles" />
              </div>
              <div>
                <p className="course-channel-chat-description">Desafio / Pergunta Orientadora</p>
                <p className="course-channel-chat-description-2">{channel.guidingQuestion}</p>
              </div>
            </div>
            {canPost && (
              <button
                onClick={() => onInsertGuidingPrompt(channel.guidingQuestion)}
                className="course-channel-chat-button"
              >
                Responder ao Desafio
              </button>
            )}
          </div>
        )}

        <div className="course-channel-chat-panel-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="course-channel-chat-panel-7">
              <Hash className="course-channel-chat-hash" />
              <p className="course-channel-chat-description-3">Início do canal #{channel.name}</p>
              <p className="course-channel-chat-description-4">
                {isAnnouncement
                  ? 'Os comunicados e avisos oficiais do instrutor serão publicados aqui.'
                  : 'Seja o primeiro a enviar uma mensagem para os seus colegas e instrutor.'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isResolved = resolvedMessageIds.has(m.id);
              const isSenderCreator = m.sender?.role === 'CREATOR' || m.sender?.role === 'ADMIN';
              return (
                <div
                  key={m.id}
                  className={`course-channel-chat-panel-8 ui-group ${isResolved ? 'course-channel-chat-panel-9' : m.isPinned ? 'course-channel-chat-panel-10' : 'course-channel-chat-panel-11'}`}
                >
                  <Link
                    to={`/profile/${m.sender?.username || m.sender?.id || ''}`}
                    className="course-channel-chat-link"
                    title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                  >
                    <Avatar src={m.sender?.avatarUrl} name={m.sender?.name || 'Aluno'} size="md" />
                  </Link>

                  <div className="course-channel-chat-panel-12">
                    <div className="course-channel-chat-panel-13">
                      <Link
                        to={`/profile/${m.sender?.username || m.sender?.id || ''}`}
                        className="course-channel-chat-link-2"
                        title={m.sender?.name ? `Ver perfil de ${m.sender.name}` : 'Ver perfil'}
                      >
                        {m.sender?.name || 'Aluno'}
                      </Link>
                      {isSenderCreator && (
                        <span className="course-channel-chat-label">Instrutor</span>
                      )}
                      <span className="course-channel-chat-label-2">
                        {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
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
                    {canPost && (
                      <button
                        onClick={() => onSetReplyingTo(m)}
                        className="course-channel-chat-button-2"
                        title="Responder"
                      >
                        <Reply className="course-channel-chat-check-circle2" />
                      </button>
                    )}

                    {channel.type === 'qa' && onToggleResolve && (
                      <button
                        onClick={() => onToggleResolve(m.id)}
                        className={`course-channel-chat-button-3 ${isResolved ? 'course-channel-chat-button-4' : 'course-channel-chat-button-5'}`}
                        title={isResolved ? 'Reabrir dúvida' : 'Marcar como resolvido'}
                      >
                        <Check className="course-channel-chat-check-circle2" />
                      </button>
                    )}

                    {isCreatorOrAdmin && onTogglePin && (
                      <button
                        onClick={() => onTogglePin(m.id)}
                        className={`course-channel-chat-button-6 ${m.isPinned ? 'course-channel-chat-button-7' : 'course-channel-chat-button-8'}`}
                        title={m.isPinned ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin className="course-channel-chat-check-circle2" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {replyingTo && (
          <div className="course-channel-chat-panel-16">
            <div className="course-channel-chat-panel-17">
              <Reply className="course-channel-chat-reply-2" />
              <span>
                A responder a <strong>{replyingTo.sender?.name}</strong>: "{replyingTo.content}"
              </span>
            </div>
            <button onClick={() => onSetReplyingTo(null)} className="course-channel-chat-button-9">
              <X className="course-channel-chat-sparkles" />
            </button>
          </div>
        )}

        {!canPost ? (
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
            <form onSubmit={onSendMessage} className="course-channel-chat-form">
              <input
                type="text"
                placeholder={`Enviar mensagem em #${channel.name}...`}
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                className="course-channel-chat-field"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="course-channel-chat-button-10"
              >
                <Send className="course-channel-chat-sparkles" />
              </button>
            </form>
          </div>
        )}
      </div>

      {showMembersList && (
        <aside className="course-channel-chat-sidebar custom-scrollbar">
          <div className="course-channel-chat-panel-21">
            <div className="course-channel-chat-panel-22">Instrutor do Curso</div>
            <Link
              to={`/profile/${creatorUser?.username || creatorUser?.id || ''}`}
              className="course-channel-chat-link-3 subtle-shadow ui-group"
              title={
                creatorUser?.name ? `Ver perfil de ${creatorUser.name}` : 'Ver perfil do instrutor'
              }
            >
              <Avatar
                src={creatorUser?.avatarUrl}
                name={creatorUser?.name || 'Instrutor'}
                size="sm"
                status="online"
              />
              <div className="course-channel-chat-panel-23">
                <p className="course-channel-chat-description-6">
                  {creatorUser?.name || 'Instrutor'}
                </p>
                <p className="course-channel-chat-description-7">Corpo Docente</p>
              </div>
            </Link>
          </div>

          <div>
            <div className="course-channel-chat-panel-22">Colegas de Turma</div>
            {classmates.length === 0 ? (
              <div className="course-channel-chat-panel-24">
                <p className="course-channel-chat-description-8">
                  Ainda não há outros colegas matriculados nesta turma.
                </p>
              </div>
            ) : (
              <div className="course-channel-chat-panel-25">
                {classmates.map((m) => (
                  <Link
                    key={m.id}
                    to={`/profile/${m.username || m.id || ''}`}
                    className="course-channel-chat-link-4 ui-group"
                    title={`Ver perfil de ${m.name}`}
                  >
                    <Avatar
                      src={m.avatarUrl}
                      name={m.name}
                      size="sm"
                      status={m.isOnline ? 'online' : undefined}
                    />
                    <div className="course-channel-chat-panel-23">
                      <p className="course-channel-chat-description-9">{m.name}</p>
                      <p className="course-channel-chat-label-2">{formatRole(m.role)}</p>
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
