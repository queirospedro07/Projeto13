function isSafeImage(value, { allowEmpty = true } = {}) {
  if (typeof value !== 'string') return false;
  if (!value) return allowEmpty;
  // Reject control characters in image URLs.
  // eslint-disable-next-line no-control-regex
  if (value.length > 2800000 || /[\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith('data:')) {
    const match = /^data:image\/(png|jpeg|webp);base64,([a-z\d+/]+={0,2})$/i.exec(value);
    if (!match) return false;
    const bytes = Buffer.from(match[2], 'base64');
    if (match[1].toLowerCase() === 'png')
      return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (match[1].toLowerCase() === 'jpeg')
      return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      value.length <= 2000
    );
  } catch {
    return false;
  }
}
function isSafeBanner(value) {
  return (
    isSafeImage(value) ||
    (typeof value === 'string' &&
      (/^#[\da-f]{3,8}$/i.test(value) ||
        /^gradient-(indigo|emerald|sunset|dusk|aurora|midnight)$/.test(value) ||
        /^(rgb|hsl)a?\([\d\s.,%/+-]+\)$/i.test(value)))
  );
}
function validateCourseBody(req, res, next) {
  const body = req.body || {};
  if (
    body.title !== undefined &&
    (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.length > 160)
  )
    return res.status(400).json({
      error: 'O título deve ter entre 2 e 160 caracteres.',
    });
  if (
    body.description !== undefined &&
    (typeof body.description !== 'string' || body.description.length > 20000)
  )
    return res.status(400).json({
      error: 'Descrição inválida (limite de 20 000 caracteres).',
    });
  for (const key of ['isFree', 'isPublished', 'allowStudentScreenShare', 'allowStudentCamera'])
    if (body[key] !== undefined && ![true, false, 0, 1].includes(body[key]))
      return res.status(400).json({
        error: 'Opção de curso inválida.',
      });
  for (const key of ['thumbnailUrl', 'bannerUrl'])
    if (body[key] !== undefined && !isSafeImage(body[key]))
      return res.status(400).json({
        error: 'Imagem de curso inválida. Use JPG, PNG ou WebP, ou um link http/https.',
      });
  if (
    body.price !== undefined &&
    (typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price < 0 ||
      body.price > 100000)
  )
    return res.status(400).json({
      error: 'Preço inválido.',
    });
  if (
    body.modules !== undefined &&
    (!Array.isArray(body.modules) ||
      body.modules.length > 50 ||
      body.modules.some(
        (m) => !m || typeof m !== 'object' || !Array.isArray(m.lessons) || m.lessons.length > 100,
      ))
  )
    return res.status(400).json({
      error: 'Estrutura de módulos inválida (máximo de 50 módulos e 100 aulas por módulo).',
    });
  for (const key of [
    'category',
    'difficulty',
    'language',
    'defaultCallMode',
    'thumbnailPosition',
    'bannerPosition',
  ]) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > 160))
      return res.status(400).json({
        error: 'Dados de curso inválidos.',
      });
  }
  for (const key of ['learningOutcomes', 'requirements'])
    if (
      body[key] !== undefined &&
      (!Array.isArray(body[key]) ||
        body[key].length > 50 ||
        body[key].some((value) => typeof value !== 'string' || value.length > 1000))
    )
      return res.status(400).json({
        error: 'Objetivos e requisitos devem ser listas com até 50 textos de 1000 caracteres.',
      });
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        value.length <= 2000
      );
    } catch {
      return false;
    }
  };
  const lessons = (body.modules || []).flatMap((module) => module.lessons);
  if (
    lessons.length > 500 ||
    lessons.some(
      (lesson) =>
        !lesson ||
        typeof lesson.title !== 'string' ||
        lesson.title.length > 200 ||
        !['video', 'text', 'article', 'resource', 'quiz', 'project'].includes(lesson.type) ||
        (lesson.videoUrl && !safeUrl(lesson.videoUrl)) ||
        JSON.stringify(lesson.content || lesson.richArticle || lesson.customData || '').length >
          100000 ||
        (lesson.quiz &&
          (!Array.isArray(lesson.quiz.questions) ||
            lesson.quiz.questions.length > 100 ||
            lesson.quiz.questions.some(
              (question) =>
                !question ||
                typeof question.question !== 'string' ||
                question.question.length > 2000 ||
                (question.options &&
                  (!Array.isArray(question.options) || question.options.length > 10)),
            ))),
    )
  )
    return res.status(400).json({
      error:
        'Conteúdo das aulas inválido. Use até 500 aulas por curso e 100 perguntas por questionário.',
    });
  if (
    body.channels !== undefined &&
    (!Array.isArray(body.channels) ||
      body.channels.length > 100 ||
      body.channels.some(
        (channel) => !channel || typeof channel.name !== 'string' || channel.name.length > 80,
      ))
  )
    return res.status(400).json({
      error: 'Canais inválidos.',
    });
  if (body.documents !== undefined) {
    if (!Array.isArray(body.documents) || body.documents.length > 20)
      return res.status(400).json({
        error: 'Use até 20 documentos por curso.',
      });
    let total = 0;
    for (const document of body.documents) {
      const value = document?.url || document?.data;
      if (typeof value !== 'string')
        return res.status(400).json({
          error: 'Documento inválido.',
        });
      if (safeUrl(value)) continue;
      const match =
        /^data:(application\/pdf|image\/(png|jpeg|webp)|text\/plain);base64,([a-z\d+/]+={0,2})$/i.exec(
          value,
        );
      if (!match)
        return res.status(400).json({
          error: 'Use PDF, TXT, JPG, PNG ou WebP, ou uma ligação http/https.',
        });
      const bytes = Buffer.from(match[3], 'base64');
      total += bytes.length;
      if (
        bytes.length > 2 * 1024 * 1024 ||
        total > 4 * 1024 * 1024 ||
        (match[1] === 'application/pdf' && bytes.toString('ascii', 0, 5) !== '%PDF-') ||
        (match[2] && !isSafeImage(value))
      )
        return res.status(400).json({
          error: 'Use ficheiros válidos até 2 MB e 4 MB de documentos no total.',
        });
    }
  }
  return next();
}
exports.isSafeImage = isSafeImage;
exports.isSafeBanner = isSafeBanner;
exports.validateCourseBody = validateCourseBody;
