const { Router } = require('express');
const {
  autenticar: autenticar,
  autenticacaoOpcional: opcionalAutenticacao,
} = require('../intermediarios/autenticacao.js');
const {
  obterSocialAmigos,
  enviarSocialAmigosRequestPorDestinoUtilizadorId,
  enviarSocialAmigosAceitarPorAmizadeId,
  enviarSocialAmigosRejeitarPorAmizadeId,
  eliminarSocialAmigosRemoverPorDestinoUtilizadorId,
  enviarSocialFollowPorDestinoUtilizadorId,
  enviarSocialUnfollowPorDestinoUtilizadorId,
  obterSocialSeguidoresPorUtilizadorId,
  obterSocialSeguidosPorUtilizadorId,
  obterSocialEstadoPorDestinoUtilizadorId,
  obterSocialUtilizadoresPesquisar,
  obterSocialMensagemDiretaConversas,
  obterSocialMensagemDiretaMensagensPorDestinoUtilizadorId,
  enviarSocialMensagemDiretaEnviar,
} = require('../controladores/social.controlador.js');
const { assincronoTratador } = require('../intermediarios/assincronoTratador.js');
const router = Router();

router.get(['/amigos', '/friends'], autenticar, assincronoTratador(obterSocialAmigos));
router.post(
  ['/amigos/pedir/:targetUserId', '/friends/request/:targetUserId'],
  autenticar,
  assincronoTratador(enviarSocialAmigosRequestPorDestinoUtilizadorId),
);
router.post(
  ['/amigos/aceitar/:friendshipId', '/friends/accept/:friendshipId'],
  autenticar,
  assincronoTratador(enviarSocialAmigosAceitarPorAmizadeId),
);
router.post(
  ['/amigos/rejeitar/:friendshipId', '/friends/reject/:friendshipId'],
  autenticar,
  assincronoTratador(enviarSocialAmigosRejeitarPorAmizadeId),
);
router.delete(
  ['/amigos/remover/:targetUserId', '/friends/remove/:targetUserId'],
  autenticar,
  assincronoTratador(eliminarSocialAmigosRemoverPorDestinoUtilizadorId),
);
router.post(
  ['/seguir/:targetUserId', '/follow/:targetUserId'],
  autenticar,
  assincronoTratador(enviarSocialFollowPorDestinoUtilizadorId),
);
router.post(
  ['/deixar-seguir/:targetUserId', '/unfollow/:targetUserId'],
  autenticar,
  assincronoTratador(enviarSocialUnfollowPorDestinoUtilizadorId),
);
router.get(
  ['/seguidores/:idUtilizador', '/followers/:idUtilizador'],
  opcionalAutenticacao,
  assincronoTratador(obterSocialSeguidoresPorUtilizadorId),
);
router.get(
  ['/seguidos/:idUtilizador', '/following/:idUtilizador'],
  opcionalAutenticacao,
  assincronoTratador(obterSocialSeguidosPorUtilizadorId),
);
router.get(
  ['/estado/:targetUserId', '/status/:targetUserId'],
  autenticar,
  assincronoTratador(obterSocialEstadoPorDestinoUtilizadorId),
);
router.get(
  ['/utilizadores/pesquisar', '/users/search'],
  opcionalAutenticacao,
  assincronoTratador(obterSocialUtilizadoresPesquisar),
);
router.get(
  ['/dm/conversas', '/dm/conversations'],
  autenticar,
  assincronoTratador(obterSocialMensagemDiretaConversas),
);
router.get(
  ['/dm/mensagens/:targetUserId', '/dm/messages/:targetUserId'],
  autenticar,
  assincronoTratador(obterSocialMensagemDiretaMensagensPorDestinoUtilizadorId),
);
router.post(
  ['/dm/enviar', '/dm/send'],
  autenticar,
  assincronoTratador(enviarSocialMensagemDiretaEnviar),
);
module.exports = router;
