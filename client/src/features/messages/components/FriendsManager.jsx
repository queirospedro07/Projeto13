import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, MessageSquare, Check, X, Search } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
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
  onOpenConversationWithUser
}) => {
  return <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 animate-fade-in">
      
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Comunidade & Amigos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conecte-se com colegas de turma, envie pedidos de amizade e troque mensagens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onSetFriendsSubTab('all')} className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${friendsSubTab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            Amigos ({friendsData.friends.length})
          </button>
          <button onClick={() => onSetFriendsSubTab('pending')} className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${friendsSubTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            Pendentes ({friendsData.incoming.length})
          </button>
          <button onClick={() => onSetFriendsSubTab('add')} className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${friendsSubTab === 'add' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
      </div>

      
      {friendsSubTab === 'all' && <div>
          {friendsData.friends.length === 0 ? <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">
                Ainda não tem amigos adicionados
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Adicione colegas pelo nome de utilizador ou explore os perfis nas comunidades.
              </p>
              <Button variant="primary" size="sm" onClick={() => onSetFriendsSubTab('add')} leftIcon={<UserPlus className="w-3.5 h-3.5" />} className="font-bold">
                Adicionar Primeiro Amigo
              </Button>
            </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendsData.friends.map(f => <div key={f.friendshipId} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={f.user.avatarUrl} name={f.user.name} size="md" className="rounded-xl" />
                    <div className="min-w-0">
                      <Link to={`/profile/${f.user.username}`} className="font-bold text-sm text-slate-900 hover:underline truncate block">
                        {f.user.name}
                      </Link>
                      <p className="text-xs text-slate-500">@{f.user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => onOpenConversationWithUser(f.user)} leftIcon={<MessageSquare className="w-3.5 h-3.5 text-blue-600" />} className="font-bold text-xs">
                      Mensagem
                    </Button>
                    <button onClick={() => onRemoveFriend(f.user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Remover Amigo">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>)}
            </div>}
        </div>}

      
      {friendsSubTab === 'pending' && <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Pedidos Recebidos ({friendsData.incoming.length})
            </p>

            {friendsData.incoming.length === 0 ? <p className="text-xs text-slate-500">Nenhum pedido de amizade pendente.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friendsData.incoming.map(r => <div key={r.friendshipId} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={r.user.avatarUrl} name={r.user.name} size="md" className="rounded-xl" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{r.user.name}</p>
                        <p className="text-xs text-slate-500">@{r.user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="primary" size="sm" onClick={() => onAcceptRequest(r.friendshipId)} leftIcon={<Check className="w-3.5 h-3.5" />} className="font-bold">
                        Aceitar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onRejectRequest(r.friendshipId)} leftIcon={<X className="w-3.5 h-3.5 text-red-500" />} className="font-bold text-red-600 hover:bg-red-50">
                        Recusar
                      </Button>
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>}

      
      {friendsSubTab === 'add' && <div className="max-w-xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Adicionar Amigo por Nome de Utilizador
            </h3>
            <p className="text-xs text-slate-500">
              Escreva o username exato do utilizador (ex:{' '}
              <span className="font-mono text-blue-600 font-semibold">@alex_dev</span>) para lhe
              enviar um pedido de amizade.
            </p>
          </div>

          <form onSubmit={onSearchAndAddFriend} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                @
              </span>
              <input type="text" required placeholder="nome_de_utilizador" value={addFriendQuery} onChange={e => onAddFriendQueryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono" />
            </div>
            <Button type="submit" variant="primary" size="md" leftIcon={<Search className="w-4 h-4" />} className="font-bold px-6 shadow-md shadow-blue-500/20">
              Pesquisar
            </Button>
          </form>

          {searchResult && <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={searchResult.avatarUrl} name={searchResult.name} size="md" className="rounded-xl" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{searchResult.name}</p>
                  <p className="text-xs text-slate-500">@{searchResult.username}</p>
                </div>
              </div>

              {requestSent ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Pedido Enviado
                </span> : <Button variant="primary" size="sm" onClick={() => onSendFriendRequest(searchResult.id)} leftIcon={<UserPlus className="w-3.5 h-3.5" />} className="font-bold">
                  Enviar Pedido
                </Button>}
            </div>}
        </div>}
    </div>;
};