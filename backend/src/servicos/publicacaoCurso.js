const { randomUUID } = require('node:crypto');
const {
  consultarUm,
  consultarTodos,
  executar,
  transacao,
  bloquearTransacao,
} = require('../base-dados/ligacao');
const { podeGerirCurso } = require('./acessoCurso');
const { carregarAvaliacao } = require('./avaliacoes');

function fail(mensagem, estado = 400) {
  throw Object.assign(new Error(mensagem), {
    status: estado,
  });
}

function verificarVersao(curso, expectedAtualizadoAt) {
  if (expectedAtualizadoAt !== undefined && typeof expectedAtualizadoAt !== 'string')
    fail('Versão do curso inválida.');
  if (expectedAtualizadoAt && expectedAtualizadoAt !== curso.atualizadoEm)
    fail('O curso foi alterado entretanto. Atualize a página e reveja a versão atual.', 409);
}

async function validarCursoParaRevisao(curso) {
  if (!curso.title?.trim() || !curso.description?.trim() || !curso.category?.trim())
    fail('Preencha o título, a descrição e a categoria antes de enviar o curso para revisão.');
  if (!curso.eGratuito && !(curso.price > 0))
    fail('Defina um preço superior a zero para um curso pago.');
  const modulos = await consultarTodos(
    'SELECT * FROM consulta_modulos_curso WHERE "idCurso" = $1',
    [curso.id],
  );
  if (!modulos.length)
    fail('Adicione pelo menos um módulo com aulas antes de enviar para revisão.');
  for (const modulo of modulos) {
    const aulas = await consultarTodos('SELECT * FROM consulta_aulas WHERE "idModulo" = $1', [
      modulo.id,
    ]);
    if (!modulo.title?.trim() || !aulas.length)
      fail('Cada módulo deve ter um título e pelo menos uma aula.');
    for (const aula of aulas) {
      if (!aula.title?.trim()) fail('Todas as aulas precisam de um título.');
      if (aula.type === 'video' && !aula.urlVideo?.trim())
        fail(`Adicione o vídeo da aula "${aula.title}".`);
      if (aula.type === 'quiz') {
        const questionario = await carregarAvaliacao(aula.id);
        if (!questionario?.questions?.length)
          fail(`Adicione perguntas ao questionário "${aula.title}".`);
        for (const pergunta of questionario.questions) {
          if (!pergunta.question?.trim())
            fail(`Preencha os enunciados do questionário "${aula.title}".`);
          if (
            pergunta.type !== 'open-ended' &&
            (pergunta.options.length < 2 ||
              pergunta.options.some((opcao) => !opcao.text.trim()) ||
              !pergunta.options.some((opcao) => opcao.isCorrect))
          )
            fail(`Defina as opções e a resposta correta do questionário "${aula.title}".`);
        }
      } else if (aula.type !== 'video' && !aula.content?.trim())
        fail(`Preencha o conteúdo da aula "${aula.title}".`);
    }
  }
}

async function notify(utilizadorId, titulo, conteudo, ligacao) {
  await executar(
    "INSERT INTO notificacoes(id,id_utilizador,tipo,titulo,conteudo,ligacao,esta_lida,criado_em) VALUES($1,$2,'system',$3,$4,$5,0,$6)",
    [randomUUID(), utilizadorId, titulo, conteudo, ligacao, new Date().toISOString()],
  );
}

async function submeterCurso(utilizador, id) {
  return transacao(async () => {
    await bloquearTransacao(`course-community:${id}`);

    const curso = await consultarUm('SELECT * FROM consulta_cursos WHERE id=$1', [id]);
    if (!curso) fail('Curso não encontrado.', 404);
    if (!(await podeGerirCurso(utilizador, curso)))
      fail('Sem permissão para submeter este curso.', 403);
    if (curso.estadoAprovacao === 'PENDING')
      return {
        estadoAprovacao: 'PENDING',
        message: 'O curso já aguarda revisão.',
      };
    if (curso.estadoAprovacao === 'APPROVED')
      fail('Este curso já está aprovado. Guarde primeiro as alterações.', 409);
    if (curso.estadoAprovacao === 'REJECTED')
      fail('Guarde as correções antes de voltar a enviar o curso.', 409);
    await validarCursoParaRevisao(curso);

    const agora = new Date().toISOString();

    await executar(
      "UPDATE cursos SET estado_aprovacao='PENDING', e_publicado=0, submetido_para_revisao_em=$1, atualizado_em=$1 WHERE id=$2",
      [agora, id],
    );

    const administradores = await consultarTodos(
      'SELECT id FROM consulta_utilizadores WHERE role=\'ADMIN\' AND "estaSuspenso"=0',
    );
    for (const administracao of administradores)
      await notify(
        administracao.id,
        'Curso para revisão',
        `O curso "${curso.title}" aguarda revisão.`,
        '/admin?tab=courses',
      );

    return {
      estadoAprovacao: 'PENDING',
      message: 'Curso enviado para revisão.',
    };
  });
}

async function reverCurso(id, acao, entrada = {}) {
  const notas = entrada.notes ?? (acao === 'APPROVED' ? 'Curso aprovado pela administração.' : '');
  if (typeof notas !== 'string' || !notas.trim() || notas.length > 2000)
    fail('Escreva um feedback entre 1 e 2000 caracteres.');

  return transacao(async () => {
    await bloquearTransacao(`course-community:${id}`);

    const curso = await consultarUm('SELECT * FROM consulta_cursos WHERE id=$1', [id]);
    if (!curso) fail('Curso não encontrado.', 404);
    verificarVersao(curso, entrada.atualizadoEmEsperado);
    if (
      curso.estadoAprovacao !== 'PENDING' &&
      !(acao === 'REJECTED' && curso.estadoAprovacao === 'APPROVED')
    )
      fail('O estado do curso mudou. Atualize a lista antes de tomar uma decisão.', 409);
    if (acao === 'APPROVED') await validarCursoParaRevisao(curso);
    const agora = new Date().toISOString();

    await executar(
      'UPDATE cursos SET estado_aprovacao=$1,e_publicado=$2,notas_admin=$3,revisto_em=$4,atualizado_em=$4 WHERE id=$5',
      [acao, acao === 'APPROVED' ? 1 : 0, notas.trim(), agora, id],
    );
    await notify(
      curso.idFormador,
      acao === 'APPROVED' ? 'Curso aprovado e publicado' : 'Alterações solicitadas ao curso',
      `"${curso.title}": ${notas.trim()}`,
      `/formador/cursos/${id}/editar`,
    );

    return {
      success: true,
      estadoAprovacao: acao,
      message:
        acao === 'APPROVED' ? 'Curso aprovado e publicado.' : 'Feedback enviado ao formador.',
    };
  });
}

exports.verificarVersao = verificarVersao;
exports.submeterCurso = submeterCurso;
exports.reverCurso = reverCurso;
