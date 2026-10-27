const Espaco = require('../modelos/Espaco.js');
const {
  assincronoMap,
  assincronoParaCada,
  assincronoAlgum,
} = require('../utilitarios/colecoesAssincronas.js');
const { transacao, bloquearTransacao } = require('../base-dados/ligacao.js');
const { randomUUID } = require('node:crypto');
const {
  podeModerateEspaco,
  podeEstudarCurso,
  podeAcessoEspaco,
} = require('../servicos/acessoCurso.js');
const enviarEspacoPorIdCanais = async (pedido, resposta) => {
  if (!(await podeModerateEspaco(pedido.user, pedido.params.id)))
    return resposta.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  const id = randomUUID();
  const b = pedido.body;

  await Espaco.inserirCanais([
    id,
    pedido.params.id,
    b.name.trim(),
    b.type,
    b.topic || '',
    b.type === 'voice' ? 1 : 0,
    b.perguntaOrientadora || '',
  ]);

  return resposta.status(201).json(await Espaco.procurarCanaisPorId([id]));
};

const atualizarEspacoPorIdCanaisPorCanalId = async (pedido, resposta) => {
  if (!(await podeModerateEspaco(pedido.user, pedido.params.id)))
    return resposta.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  if (!(await Espaco.procurarCanaisPorIdAndEspacoId([pedido.params.idCanal, pedido.params.id])))
    return resposta.status(404).json({
      error: 'Canal não encontrado.',
    });
  const b = pedido.body;

  await Espaco.atualizarCanal([
    b.name.trim(),
    b.type,
    b.topic || '',
    b.type === 'voice' ? 1 : 0,
    b.perguntaOrientadora || '',
    pedido.params.idCanal,
    pedido.params.id,
  ]);

  return resposta.json(await Espaco.procurarCanaisPorId([pedido.params.idCanal]));
};

const eliminarEspacoPorIdCanaisPorCanalId = async (pedido, resposta) => {
  if (!(await podeModerateEspaco(pedido.user, pedido.params.id)))
    return resposta.status(403).json({
      error: 'Sem permissão para gerir canais.',
    });
  if (!(await Espaco.procurarCanaisPorIdAndEspacoId([pedido.params.idCanal, pedido.params.id])))
    return resposta.status(404).json({
      error: 'Canal não encontrado.',
    });
  await Espaco.eliminarCanaisPorIdAndEspacoId([pedido.params.idCanal, pedido.params.id]);

  return resposta.json({
    success: true,
  });
};

const obterEspaco = async (pedido, resposta) => {
  try {
    const registos = await Espaco.pesquisar(pedido.query);
    const enriched = await assincronoMap(registos, async (s) => {
      let isMembro = false;
      let membroCargo = null;
      if (pedido.user) {
        const mem = await Espaco.procurarMemPorEspacoIdAndUtilizadorId([s.id, pedido.user.id]);
        if (mem) {
          isMembro = true;
          membroCargo = mem.role;
        }
      }

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        urlCapa: s.urlCapa,
        urlIcone: s.urlIcone,
        category: s.category,
        owner: {
          id: s.owner_id,
          name: s.owner_name,
          username: s.owner_username,
          urlAvatar: s.owner_avatarUrl,
        },
        membersCount: s.membersCount,
        channelsCount: s.channelsCount,
        coursesCount: s.coursesCount,
        isMember: isMembro,
        memberRole: membroCargo,
      };
    });

    return resposta.json(enriched);
  } catch (erro) {
    console.error('Failed to fetch spaces:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar comunidades',
    });
  }
};

const obterEspacoPorId = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    let espaco = await Espaco.contarEspacoPorIdAndSlug([id, id]);
    if (!espaco) {
      const cursoRegisto = await Espaco.procurarCursoRegistoPorIdAndSlug([id, id]);
      if (cursoRegisto) {
        if (cursoRegisto.idEspaco) {
          espaco = await Espaco.contarAdesoesPorId([cursoRegisto.idEspaco]);
        }

        if (!espaco) {
          espaco = {
            id: cursoRegisto.id,
            name: cursoRegisto.title,
            slug: cursoRegisto.slug,
            description: cursoRegisto.description,
            urlIcone: cursoRegisto.urlMiniatura,
            urlCapa: cursoRegisto.urlCapa || cursoRegisto.urlMiniatura,
            category: cursoRegisto.category,
            owner_id: cursoRegisto.owner_id,
            owner_name: cursoRegisto.owner_name,
            owner_username: cursoRegisto.owner_username,
            owner_avatarUrl: cursoRegisto.owner_avatarUrl,
            owner_bio: cursoRegisto.owner_bio,
            membersCount: 1,
            channelsCount: 4,
            idCurso: cursoRegisto.id,
          };
        }
      }
    }

    if (!espaco) {
      return resposta.status(404).json({
        error: 'Comunidade não encontrada',
      });
    }

    let canais = await Espaco.listarCanaisPorEspacoId([espaco.id]);
    const cursos = await Espaco.listarCursosPorEspacoId([espaco.id]);
    const membros = await Espaco.listarMembrosPorEspacoIdAndId([
      espaco.id,
      espaco.id,
      espaco.id,
      espaco.owner_id || '',
    ]);
    let isMembro = false;
    let membroCargo = null;
    if (pedido.user) {
      const mem = await Espaco.procurarMemPorEspacoIdAndUtilizadorId([espaco.id, pedido.user.id]);
      if (mem) {
        isMembro = true;
        membroCargo = mem.role;
      }
    }

    return resposta.json({
      ...espaco,
      owner: {
        id: espaco.owner_id,
        name: espaco.owner_name,
        username: espaco.owner_username,
        urlAvatar: espaco.owner_avatarUrl,
        bio: espaco.owner_bio,
      },
      channels: (await podeAcessoEspaco(pedido.user, espaco.id)) ? canais : [],
      courses: cursos,
      members: ((await podeAcessoEspaco(pedido.user, espaco.id)) ? membros : []).map((m) => ({
        id: m.id,
        role: m.role,
        aderiuEm: m.aderiuEm,
        user: {
          id: m.user_id,
          name: m.name,
          username: m.username,
          urlAvatar: m.urlAvatar,
          role: m.user_role,
          xp: m.xp,
          level: m.level,
        },
      })),
      isMember: isMembro,
      memberRole: membroCargo,
    });
  } catch (erro) {
    console.error('Failed to load space details:', erro);

    return resposta.status(500).json({
      error: 'Falha ao carregar detalhes do espaço',
    });
  }
};

const enviarEspacoPorIdAderir = async (pedido, resposta) => {
  try {
    const { id } = pedido.params;
    const utilizadorId = pedido.user.id;
    const agora = new Date().toISOString();
    const espaco = await Espaco.procurarEspacoPorIdAndSlug([id, id]);
    if (!espaco) {
      return resposta.status(404).json({
        error: 'Comunidade não encontrada',
      });
    }

    if (
      espaco.ePrivado === 1 &&
      pedido.user.role !== 'ADMIN' &&
      pedido.user.id !== espaco.idProprietario
    ) {
      return resposta.status(403).json({
        error: 'Esta comunidade é privada.',
      });
    }

    const pendenteCurso = await Espaco.procurarPendenteCursoPorEspacoId([espaco.id]);
    if (pendenteCurso) {
      return resposta.status(403).json({
        error: 'Este curso ainda aguarda aprovação.',
      });
    }

    const bloqueadoCurso = await assincronoAlgum(
      await Espaco.listarCursosPorEspacoIdParaEnviarEspacoPorIdAderir([espaco.id]),
      async (curso) => !(await podeEstudarCurso(pedido.user, curso)),
    );
    if (bloqueadoCurso)
      return resposta.status(403).json({
        error: 'Inscreva-se no curso antes de entrar na comunidade.',
      });
    await transacao(async () => {
      await bloquearTransacao(`membership:${utilizadorId}:${espaco.id}`);

      const existente = await Espaco.procurarExistentePorEspacoIdAndUtilizadorId([
        espaco.id,
        utilizadorId,
      ]);
      if (!existente) await Espaco.inserirAdesoes([randomUUID(), utilizadorId, espaco.id, agora]);
      const associadoCursos = await Espaco.listarAssociadoCursosPorEspacoIdAndId([
        espaco.id,
        espaco.id,
      ]);

      await assincronoParaCada(associadoCursos, async (c) => {
        await bloquearTransacao(`enrollment:${utilizadorId}:${c.id}`);
        await Espaco.inserirInscricoes([randomUUID(), utilizadorId, c.id, agora]);
      });
    });

    return resposta.status(201).json({
      message: 'Entrou na comunidade e no curso com sucesso!',
    });
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao entrar na comunidade',
    });
  }
};

exports.enviarEspacoPorIdCanais = enviarEspacoPorIdCanais;
exports.atualizarEspacoPorIdCanaisPorCanalId = atualizarEspacoPorIdCanaisPorCanalId;
exports.eliminarEspacoPorIdCanaisPorCanalId = eliminarEspacoPorIdCanaisPorCanalId;
exports.obterEspaco = obterEspaco;
exports.obterEspacoPorId = obterEspacoPorId;
exports.enviarEspacoPorIdAderir = enviarEspacoPorIdAderir;
