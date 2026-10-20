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
import { Button } from '../Button';

export const FriendsManager = ({
  friendsSubTab,
  onSetFriendsSubTab,
  friendsData,
  addFriendQuery,
  onAddFriendQueryChange,
  onSearchAndAddFriend,
  searchResult,
  requestSent,
  onSendFriendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onOpenConversationWithUser,
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
            onClick={() => onSetFriendsSubTab('all')}
            className={`friends-manager-button ${friendsSubTab === 'all' ? 'friends-manager-button-2' : 'friends-manager-button-3'}`}
          >
            Amigos ({friendsData?.friends?.length || 0})
          </button>
          <button
            onClick={() => onSetFriendsSubTab('pending')}
            className={`friends-manager-button-4 ${friendsSubTab === 'pending' ? 'friends-manager-button-2' : 'friends-manager-button-3'}`}
          >
            Pendentes ({friendsData?.incoming?.length || 0})
          </button>
          <button
            onClick={() => onSetFriendsSubTab('add')}
            className={`friends-manager-button-5 ${friendsSubTab === 'add' ? 'friends-manager-button-6' : 'friends-manager-button-7'}`}
          >
            <UserPlus className="friends-manager-user-plus" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {friendsSubTab === 'all' && (
        <div>
          {!friendsData?.friends || friendsData.friends.length === 0 ? (
            <div className="friends-manager-panel-4">
              <Users className="friends-manager-users" />
              <h3 className="friends-manager-subheading">Ainda não tem amigos adicionados</h3>
              <p className="friends-manager-description-2">
                Adicione colegas pelo nome de utilizador ou explore os perfis na plataforma.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSetFriendsSubTab('add')}
                leftIcon={<UserPlus className="friends-manager-user-plus" />}
                className="friends-manager-button-8"
              >
                Adicionar Primeiro Amigo
              </Button>
            </div>
          ) : (
            <div className="friends-manager-panel-5">
              {friendsData.friends.map((f) => (
                <div
                  key={f.friendshipId}
                  className="friends-manager-panel-6 ui-group"
                >
                  <div className="friends-manager-panel-7">
                    <Avatar
                      shape="square"
                      src={f.user.avatarUrl}
                      name={f.user.name}
                      size="md"
                      className="friends-manager-avatar"
                    />
                    <div className="friends-manager-panel-8">
                      <Link
                        to={`/profile/${f.user.username}`}
                        className="friends-manager-link"
                      >
                        {f.user.name}
                      </Link>
                      <p className="friends-manager-description-3">@{f.user.username}</p>
                    </div>
                  </div>

                  <div className="friends-manager-panel-9">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenConversationWithUser(f.user)}
                      leftIcon={<MessageSquare className="friends-manager-message-square" />}
                      className="friends-manager-button-9"
                    >
                      Mensagem
                    </Button>
                    <button
                      onClick={() => onRemoveFriend(f.user.id)}
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

      {friendsSubTab === 'pending' && (
        <div className="friends-manager-panel-10">
          <div>
            <p className="friends-manager-description-4">
              Pedidos Recebidos ({friendsData?.incoming?.length || 0})
            </p>

            {!friendsData?.incoming || friendsData.incoming.length === 0 ? (
              <p className="friends-manager-description-5">Nenhum pedido de amizade pendente.</p>
            ) : (
              <div className="friends-manager-panel-11">
                {friendsData.incoming.map((r) => (
                  <div
                    key={r.friendshipId}
                    className="friends-manager-panel-12"
                  >
                    <div className="friends-manager-panel-7">
                      <Avatar
                        shape="square"
                        src={r.user.avatarUrl}
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
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onAcceptRequest(r.friendshipId)}
                        leftIcon={<Check className="friends-manager-user-plus" />}
                        className="friends-manager-button-8"
                      >
                        Aceitar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onRejectRequest(r.friendshipId)}
                        leftIcon={<X className="friends-manager-x-2" />}
                        className="friends-manager-button-11"
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {friendsSubTab === 'add' && (
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
            onSubmit={onSearchAndAddFriend}
            className="friends-manager-form"
          >
            <div className="friends-manager-panel-15">
              <span className="friends-manager-label-2">@</span>
              <input
                type="text"
                required
                placeholder="nome_de_utilizador"
                value={addFriendQuery}
                onChange={(e) => onAddFriendQueryChange(e.target.value)}
                className="friends-manager-field"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Search className="friends-manager-x" />}
              className="friends-manager-button-12"
            >
              Pesquisar
            </Button>
          </form>

          {searchResult && (
            <div className="friends-manager-panel-16">
              <div className="friends-manager-panel-7">
                <Avatar
                  shape="square"
                  src={searchResult.avatarUrl}
                  name={searchResult.name}
                  size="md"
                  className="friends-manager-avatar"
                />
                <div className="friends-manager-panel-8">
                  <p className="friends-manager-description-7">{searchResult.name}</p>
                  <p className="friends-manager-description-3">@{searchResult.username}</p>
                </div>
              </div>

              {requestSent ? (
                <span className="friends-manager-label-3">
                  <Check className="friends-manager-x" /> Pedido Enviado
                </span>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSendFriendRequest(searchResult.id)}
                  leftIcon={<UserPlus className="friends-manager-user-plus" />}
                  className="friends-manager-button-13"
                >
                  Enviar Pedido
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsManager;
