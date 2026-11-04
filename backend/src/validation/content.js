function isSeguroImagem(valor, { allowEmpty = true } = {}) {
  if (typeof valor !== 'string') return false;
  if (!valor) return allowEmpty;
  // Reject control characters in image URLs.
  // eslint-disable-next-line no-control-regex
  if (valor.length > 2800000 || /[\u0000-\u001f]/.test(valor)) return false;
  if (valor.startsWith('data:')) {
    const match = /^data:image\/(png|jpeg|webp);base64,([a-z\d+/]+={0,2})$/i.exec(valor);
    if (!match) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (match[1].toLowerCase() === 'png')
      return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (match[1].toLowerCase() === 'jpeg')
      return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;

    return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }

  if (valor.startsWith('/') && !valor.startsWith('//') && !valor.includes('\\')) return true;
  try {
    const url = new URL(valor);

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      valor.length <= 2000
    );
  } catch {
    return false;
  }
}

function isSeguroCapa(valor) {
  return (
    isSeguroImagem(valor) ||
    (typeof valor === 'string' &&
      (/^#[\da-f]{3,8}$/i.test(valor) ||
        /^gradient-(indigo|emerald|sunset|dusk|aurora|midnight)$/.test(valor) ||
        /^(rgb|hsl)a?\([\d\s.,%/+-]+\)$/i.test(valor)))
  );
}

function validarCursoBody(pedido, resposta, seguinte) {
  const body = pedido.body || {};
  if (
    body.duracaoHoras !== undefined &&
    (typeof body.duracaoHoras !== 'number' ||
      !Number.isFinite(body.duracaoHoras) ||
      body.duracaoHoras < 0 ||
      body.duracaoHoras > 10000)
  )
    return resposta.status(400).json({
      error: 'A duração do curso deve estar entre 0 e 10 000 horas.',
    });
  if (
    body.modoChamadaPredefinido !== undefined &&
    !['open', 'stage', 'qa'].includes(body.modoChamadaPredefinido)
  )
    return resposta.status(400).json({
      error: 'Modo de chamada inválido.',
    });
  if (body.hasCommunity !== undefined && typeof body.hasCommunity !== 'boolean')
    return resposta.status(400).json({
      error: 'Indique se o curso tem comunidade.',
    });
  if (body.hasCommunity === false && body.idEspaco)
    return resposta.status(400).json({
      error: 'Um curso sem comunidade não pode ter um espaço associado.',
    });
  if (
    body.title !== undefined &&
    (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.length > 160)
  )
    return resposta.status(400).json({
      error: 'O título deve ter entre 2 e 160 caracteres.',
    });
  if (
    body.description !== undefined &&
    (typeof body.description !== 'string' || body.description.length > 20000)
  )
    return resposta.status(400).json({
      error: 'Descrição inválida (limite de 20 000 caracteres).',
    });
  for (const chave of [
    'eGratuito',
    'estaPublicado',
    'permitirPartilhaEcraAluno',
    'permitirCamaraAluno',
  ])
    if (body[chave] !== undefined && ![true, false, 0, 1].includes(body[chave]))
      return resposta.status(400).json({
        error: 'Opção de curso inválida.',
      });
  for (const chave of ['urlMiniatura', 'urlCapa'])
    if (body[chave] !== undefined && !isSeguroImagem(body[chave]))
      return resposta.status(400).json({
        error: 'Imagem de curso inválida. Use JPG, PNG ou WebP, ou um link http/https.',
      });
  if (
    body.price !== undefined &&
    (typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price < 0 ||
      Math.abs(body.price * 100 - Math.round(body.price * 100)) > 0.000001 ||
      body.price > 100000)
  )
    return resposta.status(400).json({
      error: 'Use um preço válido com um máximo de duas casas decimais.',
    });
  if (
    body.modules !== undefined &&
    (!Array.isArray(body.modules) ||
      body.modules.length > 50 ||
      body.modules.some(
        (m) => !m || typeof m !== 'object' || !Array.isArray(m.lessons) || m.lessons.length > 100,
      ))
  )
    return resposta.status(400).json({
      error: 'Estrutura de módulos inválida (máximo de 50 módulos e 100 aulas por módulo).',
    });
  for (const chave of [
    'category',
    'difficulty',
    'language',
    'modoChamadaPredefinido',
    'thumbnailPosition',
    'posicaoCapa',
  ]) {
    if (body[chave] !== undefined && (typeof body[chave] !== 'string' || body[chave].length > 160))
      return resposta.status(400).json({
        error: 'Dados de curso inválidos.',
      });
  }

  for (const chave of ['learningOutcomes', 'requirements'])
    if (
      body[chave] !== undefined &&
      (!Array.isArray(body[chave]) ||
        body[chave].length > 50 ||
        body[chave].some((valor) => typeof valor !== 'string' || valor.length > 1000))
    )
      return resposta.status(400).json({
        error: 'Objetivos e requisitos devem ser listas com até 50 textos de 1000 caracteres.',
      });
  const seguroUrl = (valor) => {
    try {
      const url = new URL(valor);

      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        valor.length <= 2000
      );
    } catch {
      return false;
    }
  };

  const aulas = (body.modules || []).flatMap((modulo) => modulo.lessons);
  for (const listar of [body.modules || [], aulas, body.channels || []]) {
    if (!Array.isArray(listar)) continue;
    const ids = listar.filter((item) => item?.id !== undefined).map((item) => item.id);
    if (
      ids.some((id) => typeof id !== 'string' || id.length > 160) ||
      new Set(ids).size !== ids.length
    )
      return resposta.status(400).json({
        error: 'Os identificadores dos módulos, aulas e canais devem ser válidos e únicos.',
      });
  }

  if (
    aulas.length > 500 ||
    aulas.some(
      (aula) =>
        !aula ||
        typeof aula.title !== 'string' ||
        aula.title.length > 200 ||
        !['video', 'text', 'article', 'resource', 'quiz', 'project'].includes(aula.type) ||
        ['duracaoMinutos', 'recompensaExperiencia'].some(
          (chave) =>
            aula[chave] !== undefined &&
            (!Number.isFinite(Number(aula[chave])) ||
              Number(aula[chave]) < 0 ||
              Number(aula[chave]) > 10000),
        ) ||
        (aula.urlVideo && !seguroUrl(aula.urlVideo)) ||
        JSON.stringify(aula.content || aula.richArticle || aula.customData || '').length > 100000 ||
        (aula.quiz &&
          (!Array.isArray(aula.quiz.questions) ||
            aula.quiz.questions.length > 100 ||
            aula.quiz.questions.some(
              (pergunta) =>
                !pergunta ||
                typeof pergunta.question !== 'string' ||
                pergunta.question.length > 2000 ||
                (pergunta.options &&
                  (!Array.isArray(pergunta.options) ||
                    pergunta.options.length > 10 ||
                    pergunta.options.some((opcao) =>
                      typeof opcao === 'string'
                        ? opcao.length > 4000
                        : !opcao || typeof opcao.text !== 'string' || opcao.text.length > 4000,
                    ))),
            ))),
    )
  )
    return resposta.status(400).json({
      error:
        'Conteúdo das aulas inválido. Use até 500 aulas por curso e 100 perguntas por questionário.',
    });
  if (
    body.channels !== undefined &&
    (!Array.isArray(body.channels) ||
      body.channels.length > 100 ||
      body.channels.some(
        (canal) => !canal || typeof canal.name !== 'string' || canal.name.length > 80,
      ))
  )
    return resposta.status(400).json({
      error: 'Canais inválidos.',
    });
  if (body.documents !== undefined) {
    if (!Array.isArray(body.documents) || body.documents.length > 20)
      return resposta.status(400).json({
        error: 'Use até 20 documentos por curso.',
      });
    let total = 0;
    for (const documento of body.documents) {
      const valor = documento?.url || documento?.data;
      if (typeof valor !== 'string')
        return resposta.status(400).json({
          error: 'Documento inválido.',
        });
      if (seguroUrl(valor)) continue;
      const match =
        /^data:(application\/pdf|image\/(png|jpeg|webp)|text\/plain);base64,([a-z\d+/]+={0,2})$/i.exec(
          valor,
        );
      if (!match)
        return resposta.status(400).json({
          error: 'Use PDF, TXT, JPG, PNG ou WebP, ou uma ligação http/https.',
        });
      const bytes = Buffer.from(match[3], 'base64');

      total += bytes.length;
      if (
        bytes.length > 2 * 1024 * 1024 ||
        total > 4 * 1024 * 1024 ||
        (match[1] === 'application/pdf' && bytes.toString('ascii', 0, 5) !== '%PDF-') ||
        (match[2] && !isSeguroImagem(valor))
      )
        return resposta.status(400).json({
          error: 'Use ficheiros válidos até 2 MB e 4 MB de documentos no total.',
        });
    }
  }

  return seguinte();
}

exports.isSeguroImagem = isSeguroImagem;
exports.isSeguroCapa = isSeguroCapa;
exports.validarCursoBody = validarCursoBody;
