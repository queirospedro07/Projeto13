import './FriendsManager.css';
import { Link } from 'react-router-dom';
import {
  LuUsers as Users,
  LuUserPlus as UserPlus,
  LuMessageSquare as MessageSquare,
  LuCheck as Check,
  LuX as X,
  LuSearch as Search,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { Botao } from '../Button';

export const AmigosGestor = ({
  friendsSubTab: amigosSubSeparador,
  onSetFriendsSubTab: onDefinirAmigosSubSeparador,
  friendsData: amigosDados,
  addFriendQuery: adicionarAmigoConsultar,
  onAddFriendQueryChange: onAdicionarAmigoConsultarAlterar,
  onSearchAndAddFriend: onPesquisarAndAdicionarAmigo,
  searchResult: pesquisarResultado,
  requestSent,
  onSendFriendRequest: onEnviarAmigoRequest,
  onAcceptRequest: onAceitarRequest,
  onRejectRequest: onRejeitarRequest,
  onRemoveFriend: onRemoverAmigo,
  onOpenConversationWithUser: onAbrirConversationComUtilizador,
}) => {
  return (
    <div className="friends-manager-panel">
      <div className="friends-manager-panel-2">
        <div>
          <h2 className="friends-manager-heading">Comunidade & Amigos</h2>
          <p className="friends-manager-description">
            Conecte-se com outros utilizadores, envie pedidos de amizade e troque mensagens diretas.
          </p>
        </div>

        <div className="friends-manager-panel-3">
          <button
            onClick={() => onDefinirAmigosSubSeparador('all')}
            className={`friends-manager-button ${amigosSubSeparador === 'all' ? 'friends-manager-button-2' : 'friends-manager-button-3'}`}
          >
            Amigos ({amigosDados?.friends?.length || 0})
          </button>
          <button
            onClick={() => onDefinirAmigosSubSeparador('pending')}
            className={`friends-manager-button-4 ${amigosSubSeparador === 'pending' ? 'friends-manager-button-2' : 'friends-manager-button-3'}`}
          >
            Pendentes ({amigosDados?.incoming?.length || 0})
          </button>
          <button
            onClick={() => onDefinirAmigosSubSeparador('add')}
            className={`friends-manager-button-5 ${amigosSubSeparador === 'add' ? 'friends-manager-button-6' : 'friends-manager-button-7'}`}
          >
            <UserPlus className="friends-manager-user-plus" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {amigosSubSeparador === 'all' && (
        <div>
          {!amigosDados?.friends || amigosDados.friends.length === 0 ? (
            <div className="friends-manager-panel-4">
              <Users className="friends-manager-users" />
              <h3 className="friends-manager-subheading">Ainda não tem amigos adicionados</h3>
              <p className="friends-manager-description-2">
                Adicione colegas pelo nome de utilizador ou explore os perfis na plataforma.
              </p>
              <Botao
                variant="primary"
                size="sm"
                onClick={() => onDefinirAmigosSubSeparador('add')}
                leftIcon={<UserPlus className="friends-manager-user-plus" />}
                className="friends-manager-button-8"
              >
                Adicionar Primeiro Amigo
              </Botao>
            </div>
          ) : (
            <div className="friends-manager-panel-5">
              {amigosDados.friends.map((f) => (
                <div
                  key={f.friendshipId}
                  className="friends-manager-panel-6 ui-group"
                >
                  <div className="friends-manager-panel-7">
                    <Avatar
                      shape="square"
                      src={f.user.urlAvatar}
                      name={f.user.name}
                      size="md"
                      className="friends-manager-avatar"
                    />
                    <div className="friends-manager-panel-8">
                      <Link
                        to={`/perfil/${f.user.username}`}
                        className="friends-manager-link"
                      >
                        {f.user.name}
                      </Link>
                      <p className="friends-manager-description-3">@{f.user.username}</p>
                    </div>
                  </div>

                  <div className="friends-manager-panel-9">
                    <Botao
                      variant="secondary"
                      size="sm"
                      onClick={() => onAbrirConversationComUtilizador(f.user)}
                      leftIcon={<MessageSquare className="friends-manager-message-square" />}
                      className="friends-manager-button-9"
                    >
                      Mensagem
                    </Botao>
                    <button
                      onClick={() => onRemoverAmigo(f.user.id)}
                      className="friends-manager-button-10"
                      title="Remover Amigo"
                    >
                      <X className="friends-manager-x" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {amigosSubSeparador === 'pending' && (
        <div className="friends-manager-panel-10">
          <div>
            <p className="friends-manager-description-4">
              Pedidos Recebidos ({amigosDados?.incoming?.length || 0})
            </p>

            {!amigosDados?.incoming || amigosDados.incoming.length === 0 ? (
              <p className="friends-manager-description-5">Nenhum pedido de amizade pendente.</p>
            ) : (
              <div className="friends-manager-panel-11">
                {amigosDados.incoming.map((r) => (
                  <div
                    key={r.friendshipId}
                    className="friends-manager-panel-12"
                  >
                    <div className="friends-manager-panel-7">
                      <Avatar
                        shape="square"
                        src={r.user.urlAvatar}
                        name={r.user.name}
                        size="md"
                        className="friends-manager-avatar"
                      />
                      <div className="friends-manager-panel-8">
                        <p className="friends-manager-description-6">{r.user.name}</p>
                        <p className="friends-manager-description-3">@{r.user.username}</p>
                      </div>
                    </div>

                    <div className="friends-manager-panel-13">
                      <Botao
                        variant="primary"
                        size="sm"
                        onClick={() => onAceitarRequest(r.friendshipId)}
                        leftIcon={<Check className="friends-manager-user-plus" />}
                        className="friends-manager-button-8"
                      >
                        Aceitar
                      </Botao>
                      <Botao
                        variant="secondary"
                        size="sm"
                        onClick={() => onRejeitarRequest(r.friendshipId)}
                        leftIcon={<X className="friends-manager-x-2" />}
                        className="friends-manager-button-11"
                      >
                        Recusar
                      </Botao>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {amigosSubSeparador === 'add' && (
        <div className="friends-manager-panel-14">
          <div>
            <h3 className="friends-manager-subheading-2">Adicionar Amigo por Nome de Utilizador</h3>
            <p className="friends-manager-description-5">
              Escreva o nome de utilizador (ex:{' '}
              <span className="friends-manager-label">@mariana_costa</span>) para lhe enviar um
              pedido de amizade.
            </p>
          </div>

          <form
            onSubmit={onPesquisarAndAdicionarAmigo}
            className="friends-manager-form"
          >
            <div className="friends-manager-panel-15">
              <span className="friends-manager-label-2">@</span>
              <input
                type="text"
                required
                placeholder="nome_de_utilizador"
                value={adicionarAmigoConsultar}
                onChange={(evento) => onAdicionarAmigoConsultarAlterar(evento.target.value)}
                className="friends-manager-field"
              />
            </div>
            <Botao
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Search className="friends-manager-x" />}
              className="friends-manager-button-12"
            >
              Pesquisar
            </Botao>
          </form>

          {pesquisarResultado && (
            <div className="friends-manager-panel-16">
              <div className="friends-manager-panel-7">
                <Avatar
                  shape="square"
                  src={pesquisarResultado.urlAvatar}
                  name={pesquisarResultado.name}
                  size="md"
                  className="friends-manager-avatar"
                />
                <div className="friends-manager-panel-8">
                  <p className="friends-manager-description-7">{pesquisarResultado.name}</p>
                  <p className="friends-manager-description-3">@{pesquisarResultado.username}</p>
                </div>
              </div>

              {requestSent ? (
                <span className="friends-manager-label-3">
                  <Check className="friends-manager-x" /> Pedido Enviado
                </span>
              ) : (
                <Botao
                  variant="primary"
                  size="sm"
                  onClick={() => onEnviarAmigoRequest(pesquisarResultado.id)}
                  leftIcon={<UserPlus className="friends-manager-user-plus" />}
                  className="friends-manager-button-13"
                >
                  Enviar Pedido
                </Botao>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmigosGestor;
