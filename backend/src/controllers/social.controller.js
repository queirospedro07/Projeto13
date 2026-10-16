const Social = require('../models/Social.js');
const { asyncMap } = require('../utils/asyncCollections.js');
const { transaction } = require('../database/connection.js');
const getSocialFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const acceptedFriendships = await Social.listAcceptedFriendshipsByRequesterIdAndAddresseeId([
      userId,
      userId,
      userId,
    ]);
    const friends = (
      await asyncMap(acceptedFriendships, async (f) => {
        const u = await Social.findUById([f.friendId]);
        return {
          friendshipId: f.friendshipId,
          friendsSince: f.friendsSince,
          user: u,
        };
      })
    ).filter((f) => f.user);
    const incoming = await Social.listIncomingByAddresseeId([userId]);
    const outgoing = await Social.listOutgoingByRequesterId([userId]);
    return res.json({
      friends,
      incoming: incoming.map((r) => ({
        friendshipId: r.friendshipId,
        createdAt: r.createdAt,
        user: {
          id: r.user_id,
          name: r.name,
          username: r.username,
          avatarUrl: r.avatarUrl,
          role: r.role,
        },
      })),
      outgoing: outgoing.map((r) => ({
        friendshipId: r.friendshipId,
        createdAt: r.createdAt,
        user: {
          id: r.user_id,
          name: r.name,
          username: r.username,
          avatarUrl: r.avatarUrl,
          role: r.role,
        },
      })),
    });
  } catch (err) {
    console.error('Friends fetch error:', err);
    return res.status(500).json({
      error: 'Falha ao obter lista de amigos',
    });
  }
};
const postSocialFriendsRequestByTargetUserId = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { targetUserId } = req.params;
    const now = new Date().toISOString();
    if (requesterId === targetUserId) {
      return res.status(400).json({
        error: 'Não pode enviar pedido de amizade para si próprio',
      });
    }
    const targetUser = await Social.findTargetUserById([targetUserId]);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Utilizador não encontrado',
      });
    }
    const existing = await Social.findExistingByRequesterIdAndAddresseeId([
      requesterId,
      targetUserId,
      targetUserId,
      requesterId,
    ]);
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.json({
          message: 'Já são amigos!',
          status: 'ACCEPTED',
        });
      }
      if (existing.status === 'PENDING') {
        if (existing.requesterId === targetUserId) {
          await Social.updateFriendshipsByUpdatedAtAndId([now, existing.id]);
          return res.json({
            message: 'Pedido de amizade aceite com sucesso!',
            status: 'ACCEPTED',
          });
        }
        return res.json({
          message: 'Pedido de amizade já se encontra pendente',
          status: 'PENDING',
        });
      }
    }
    const friendshipId = `fr-${Date.now()}`;
    await transaction(async () => {
      await Social.insertFriendships([friendshipId, requesterId, targetUserId, now, now]);
      await Social.insertNotifications([
        `notif-${Date.now()}`,
        targetUserId,
        'Novo Pedido de Amizade',
        `${req.user.username} enviou-lhe um pedido de amizade.`,
        now,
      ]);
    });
    return res.status(201).json({
      message: 'Pedido de amizade enviado com sucesso!',
      friendshipId,
      status: 'PENDING',
    });
  } catch (err) {
    console.error('Friend request error:', err);
    return res.status(500).json({
      error: 'Falha ao enviar pedido de amizade',
    });
  }
};
const postSocialFriendsAcceptByFriendshipId = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;
    const now = new Date().toISOString();
    const friendship = await Social.findFriendshipById([friendshipId]);
    if (!friendship) {
      return res.status(404).json({
        error: 'Pedido de amizade não encontrado',
      });
    }
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({
        error: 'Não tem permissão para responder a este pedido',
      });
    }
    await Social.updateFriendshipsByUpdatedAtAndId([now, friendshipId]);
    const otherUserId =
      friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
    await Social.insertNotifications([
      `notif-${Date.now()}`,
      otherUserId,
      'Pedido de Amizade Aceite!',
      `${req.user.username} aceitou o seu pedido de amizade. Agora podem trocar mensagens diretas.`,
      now,
    ]);
    return res.json({
      message: 'Amizade aceite com sucesso!',
      status: 'ACCEPTED',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao aceitar amizade',
    });
  }
};
const postSocialFriendsRejectByFriendshipId = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.id;
    const friendship = await Social.findFriendshipById([friendshipId]);
    if (!friendship) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
      });
    }
    if (friendship.addresseeId !== userId && friendship.requesterId !== userId) {
      return res.status(403).json({
        error: 'Sem permissão',
      });
    }
    await Social.deleteFriendshipsById([friendshipId]);
    return res.json({
      message: 'Pedido removido com sucesso.',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao rejeitar pedido',
    });
  }
};
const deleteSocialFriendsRemoveByTargetUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    await Social.deleteFriendshipsByRequesterIdAndAddresseeId([
      userId,
      targetUserId,
      targetUserId,
      userId,
    ]);
    return res.json({
      message: 'Amigo removido com sucesso.',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao remover amigo',
    });
  }
};
const postSocialFollowByTargetUserId = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { targetUserId } = req.params;
    const now = new Date().toISOString();
    if (followerId === targetUserId) {
      return res.status(400).json({
        error: 'Não pode seguir o seu próprio perfil',
      });
    }
    const targetUser = await Social.findTargetUserByIdForPostSocialFollowByTargetUserId([
      targetUserId,
    ]);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Utilizador não encontrado',
      });
    }
    const existing = await Social.findExistingByFollowerIdAndFollowingId([
      followerId,
      targetUserId,
    ]);
    if (existing) {
      return res.json({
        message: 'Já está a seguir este utilizador',
        isFollowing: true,
      });
    }
    const followId = `fol-${Date.now()}`;
    await transaction(async () => {
      await Social.insertFollows([followId, followerId, targetUserId, now]);
      await Social.insertNotificationsForLookup([
        `notif-${Date.now()}`,
        targetUserId,
        'Novo Seguidor',
        `${req.user.username} começou a seguir o seu perfil.`,
        `/profile/${req.user.username}`,
        now,
      ]);
    });
    return res.status(201).json({
      message: 'A seguir utilizador!',
      isFollowing: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao seguir utilizador',
    });
  }
};
const postSocialUnfollowByTargetUserId = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { targetUserId } = req.params;
    await Social.deleteFollowsByFollowerIdAndFollowingId([followerId, targetUserId]);
    return res.json({
      message: 'Deixou de seguir o utilizador.',
      isFollowing: false,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao deixar de seguir',
    });
  }
};
const getSocialFollowersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Social.listFollowersByFollowingId([userId]);
    return res.json({
      followers,
      count: followers.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao obter seguidores',
    });
  }
};
const getSocialFollowingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Social.listFollowingByFollowerId([userId]);
    return res.json({
      following,
      count: following.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao obter lista de a seguir',
    });
  }
};
const getSocialStatusByTargetUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    const follow = await Social.findExistingByFollowerIdAndFollowingId([userId, targetUserId]);
    const friendship = await Social.findExistingByRequesterIdAndAddresseeId([
      userId,
      targetUserId,
      targetUserId,
      userId,
    ]);
    const followersCount = ((await Social.countFollowsByFollowingId([targetUserId])) || {}).c || 0;
    const followingCount = ((await Social.countFollowsByFollowerId([targetUserId])) || {}).c || 0;
    const friendsCount =
      (
        (await Social.countFriendshipsByRequesterIdAndAddresseeId([targetUserId, targetUserId])) ||
        {}
      ).c || 0;
    return res.json({
      isFollowing: !!follow,
      friendshipStatus: friendship ? friendship.status : 'NONE',
      isRequester: friendship ? friendship.requesterId === userId : false,
      friendshipId: friendship ? friendship.id : null,
      followersCount,
      followingCount,
      friendsCount,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao verificar estado social',
    });
  }
};
const getSocialUsersSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id || null;
    if (!query || String(query).trim().length < 1) {
      const users = userId
        ? await Social.listUsers([userId])
        : await Social.listUsersForGetSocialUsersSearch();
      return res.json(users);
    }
    const searchTerm = `%${String(query).trim()}%`;
    const users = userId
      ? await Social.listUsersByNameAndUsername([userId, searchTerm, searchTerm])
      : await Social.listUsersByNameAndUsernameForGetSocialUsersSearch([searchTerm, searchTerm]);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao pesquisar utilizadores',
    });
  }
};
const getSocialDmConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const peers = await Social.listPeersBySenderIdAndReceiverId([userId, userId, userId]);
    const conversations = (
      await asyncMap(peers, async (p) => {
        const peer = await Social.findUById([p.peerId]);
        const lastMessage = await Social.findLastMessageBySenderIdAndReceiverId([
          userId,
          p.peerId,
          p.peerId,
          userId,
        ]);
        const unreadCount =
          ((await Social.countDirectMessagesBySenderIdAndReceiverId([p.peerId, userId])) || {}).c ||
          0;
        return {
          peer,
          lastMessage,
          unreadCount,
        };
      })
    ).filter((c) => c.peer);
    conversations.sort((a, b) => {
      const tA = new Date(a.lastMessage?.createdAt || 0).getTime();
      const tB = new Date(b.lastMessage?.createdAt || 0).getTime();
      return tB - tA;
    });
    return res.json(conversations);
  } catch (err) {
    console.error('DM conversations error:', err);
    return res.status(500).json({
      error: 'Falha ao obter conversas',
    });
  }
};
const getSocialDmMessagesByTargetUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;
    await Social.updateDirectMessagesBySenderIdAndReceiverId([targetUserId, userId]);
    const messages = await Social.listMessagesBySenderIdAndReceiverId([
      userId,
      targetUserId,
      targetUserId,
      userId,
    ]);
    const peer = await Social.findUById([targetUserId]);
    const formatted = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: m.isRead === 1,
      createdAt: m.createdAt,
      sender: {
        id: m.user_id,
        name: m.user_name,
        username: m.user_username,
        avatarUrl: m.user_avatarUrl,
        role: m.user_role,
      },
    }));
    return res.json({
      peer,
      messages: formatted,
    });
  } catch (err) {
    console.error('DM history error:', err);
    return res.status(500).json({
      error: 'Falha ao obter histórico de mensagens',
    });
  }
};
const postSocialDmSend = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;
    const now = new Date().toISOString();
    if (
      typeof receiverId !== 'string' ||
      receiverId.length > 180 ||
      typeof content !== 'string' ||
      !content.trim() ||
      content.length > 4000
    ) {
      return res.status(400).json({
        error: 'Destinatário e conteúdo são obrigatórios',
      });
    }
    if (senderId === receiverId) {
      return res.status(400).json({
        error: 'Não pode enviar mensagens diretas para si próprio',
      });
    }
    const receiver = await Social.findTargetUserByIdForPostSocialFollowByTargetUserId([receiverId]);
    if (!receiver) {
      return res.status(404).json({
        error: 'Destinatário não encontrado',
      });
    }
    const dmId = `dm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await Social.insertDirectMessages([dmId, senderId, receiverId, content.trim(), now]);
    const sender = await Social.findSenderById([senderId]);
    const dmResponse = {
      id: dmId,
      senderId,
      receiverId,
      content: content.trim(),
      isRead: false,
      createdAt: now,
      sender,
    };
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('direct-message', dmResponse);
      io.to(`user_${senderId}`).emit('direct-message', dmResponse);
    }
    return res.status(201).json(dmResponse);
  } catch (err) {
    console.error('Send DM error:', err);
    return res.status(500).json({
      error: 'Falha ao enviar mensagem direta',
    });
  }
};
exports.getSocialFriends = getSocialFriends;
exports.postSocialFriendsRequestByTargetUserId = postSocialFriendsRequestByTargetUserId;
exports.postSocialFriendsAcceptByFriendshipId = postSocialFriendsAcceptByFriendshipId;
exports.postSocialFriendsRejectByFriendshipId = postSocialFriendsRejectByFriendshipId;
exports.deleteSocialFriendsRemoveByTargetUserId = deleteSocialFriendsRemoveByTargetUserId;
exports.postSocialFollowByTargetUserId = postSocialFollowByTargetUserId;
exports.postSocialUnfollowByTargetUserId = postSocialUnfollowByTargetUserId;
exports.getSocialFollowersByUserId = getSocialFollowersByUserId;
exports.getSocialFollowingByUserId = getSocialFollowingByUserId;
exports.getSocialStatusByTargetUserId = getSocialStatusByTargetUserId;
exports.getSocialUsersSearch = getSocialUsersSearch;
exports.getSocialDmConversations = getSocialDmConversations;
exports.getSocialDmMessagesByTargetUserId = getSocialDmMessagesByTargetUserId;
exports.postSocialDmSend = postSocialDmSend;
