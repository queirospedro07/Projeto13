const Notas = require('../modelos/Notas.js');
const { randomUUID } = require('node:crypto');
const { transacao, bloquearTransacao } = require('../base-dados/ligacao.js');
const { podeEstudarCurso, aulaComCurso } = require('../servicos/acessoCurso.js');
const obterNotasPorAulaId = async (pedido, resposta) => {
  try {
    const { idAula: aulaId } = pedido.params;
    const utilizadorId = pedido.user.id;
    const selecionadoAula = await aulaComCurso(pedido.params.idAula);
    if (
      pedido.params.idAula &&
      (!selecionadoAula ||
        !(await podeEstudarCurso(
          pedido.user,
          await Notas.procurarCursosPorId([selecionadoAula.idCurso]),
        )))
    )
      return resposta.status(403).json({
        error: 'Sem acesso a esta aula.',
      });
    const nota = await Notas.procurarNotaPorUtilizadorIdAndAulaId([utilizadorId, aulaId]);

    return resposta.json(
      nota || {
        content: '',
      },
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter anotação',
    });
  }
};

const enviarNotasPorAulaId = async (pedido, resposta) => {
  try {
    const { idAula: aulaId } = pedido.params;
    const { content: conteudo } = pedido.body;
    const utilizadorId = pedido.user.id;
    if (typeof conteudo !== 'string' || conteudo.length > 20000)
      return resposta.status(400).json({
        error: 'A anotação deve ter até 20 000 caracteres.',
      });
    const agora = new Date().toISOString();
    const aula = await aulaComCurso(aulaId);
    if (
      aula &&
      !(await podeEstudarCurso(pedido.user, await Notas.procurarCursosPorId([aula.idCurso])))
    )
      return resposta.status(403).json({
        error: 'Sem acesso a esta aula.',
      });
    if (!aula) {
      return resposta.status(404).json({
        error: 'Aula não encontrada',
      });
    }

    const nota = await transacao(async () => {
      await bloquearTransacao(`note:${utilizadorId}:${aulaId}`);

      const existente = await Notas.procurarExistentePorUtilizadorIdAndAulaId([
        utilizadorId,
        aulaId,
      ]);
      if (existente)
        await Notas.atualizarNotasPorConteudoAndAtualizadoAtAndId([conteudo, agora, existente.id]);
      else await Notas.inserirNotas([randomUUID(), utilizadorId, aulaId, conteudo, agora, agora]);

      return Notas.procurarNotaPorUtilizadorIdAndAulaId([utilizadorId, aulaId]);
    });

    return resposta.json(nota);
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao guardar anotação',
    });
  }
};

const obterNotas = async (pedido, resposta) => {
  try {
    const utilizadorId = pedido.user.id;
    const notas = await Notas.listarNotasPorUtilizadorId([utilizadorId]);

    return resposta.json(
      notas.map((n) => ({
        id: n.id,
        content: n.content,
        atualizadoEm: n.atualizadoEm,
        lesson: {
          id: n.idAula,
          title: n.lesson_title,
          module: {
            title: n.module_title,
            course: {
              id: n.course_id,
              title: n.course_title,
            },
          },
        },
      })),
    );
  } catch {
    return resposta.status(500).json({
      error: 'Falha ao obter anotações',
    });
  }
};

exports.obterNotasPorAulaId = obterNotasPorAulaId;
exports.enviarNotasPorAulaId = enviarNotasPorAulaId;
exports.obterNotas = obterNotas;
