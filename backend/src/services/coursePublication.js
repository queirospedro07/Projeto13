const { randomUUID } = require('node:crypto');
const {
  queryOne,
  queryAll,
  execute,
  transaction,
  lockTransaction,
} = require('../database/connection');
const { canManageCourse } = require('./courseAccess');
const { loadAssessment } = require('./assessments');

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function checkVersion(course, expectedUpdatedAt) {
  if (expectedUpdatedAt !== undefined && typeof expectedUpdatedAt !== 'string')
    fail('Versão do curso inválida.');
  if (expectedUpdatedAt && expectedUpdatedAt !== course.updatedAt)
    fail('O curso foi alterado entretanto. Atualize a página e reveja a versão atual.', 409);
}

async function assertReadyForReview(course) {
  if (!course.title?.trim() || !course.description?.trim() || !course.category?.trim())
    fail('Preencha o título, a descrição e a categoria antes de enviar o curso para revisão.');
  if (!course.isFree && !(course.price > 0))
    fail('Defina um preço superior a zero para um curso pago.');
  const modules = await queryAll('SELECT * FROM course_modules WHERE "courseId" = $1', [course.id]);
  if (!modules.length)
    fail('Adicione pelo menos um módulo com aulas antes de enviar para revisão.');
  for (const module of modules) {
    const lessons = await queryAll('SELECT * FROM lessons WHERE "moduleId" = $1', [module.id]);
    if (!module.title?.trim() || !lessons.length)
      fail('Cada módulo deve ter um título e pelo menos uma aula.');
    for (const lesson of lessons) {
      if (!lesson.title?.trim()) fail('Todas as aulas precisam de um título.');
      if (lesson.type === 'video' && !lesson.videoUrl?.trim())
        fail(`Adicione o vídeo da aula "${lesson.title}".`);
      if (lesson.type === 'quiz') {
        const quiz = await loadAssessment(lesson.id);
        if (!quiz?.questions?.length) fail(`Adicione perguntas ao questionário "${lesson.title}".`);
        for (const question of quiz.questions) {
          if (!question.question?.trim())
            fail(`Preencha os enunciados do questionário "${lesson.title}".`);
          if (
            question.type !== 'open-ended' &&
            (question.options.length < 2 ||
              question.options.some((option) => !option.text.trim()) ||
              !question.options.some((option) => option.isCorrect))
          )
            fail(`Defina as opções e a resposta correta do questionário "${lesson.title}".`);
        }
      } else if (lesson.type !== 'video' && !lesson.content?.trim())
        fail(`Preencha o conteúdo da aula "${lesson.title}".`);
    }
  }
}

async function notify(userId, title, content, link) {
  await execute(
    "INSERT INTO notificacoes(id,id_utilizador,tipo,titulo,conteudo,ligacao,esta_lida,criado_em) VALUES($1,$2,'system',$3,$4,$5,0,$6)",
    [randomUUID(), userId, title, content, link, new Date().toISOString()],
  );
}

async function submitCourse(user, id) {
  return transaction(async () => {
    await lockTransaction(`course-community:${id}`);

    const course = await queryOne('SELECT * FROM courses WHERE id=$1', [id]);
    if (!course) fail('Curso não encontrado.', 404);
    if (!(await canManageCourse(user, course)))
      fail('Sem permissão para submeter este curso.', 403);
    if (course.approvalStatus === 'PENDING')
      return { approvalStatus: 'PENDING', message: 'O curso já aguarda revisão.' };
    if (course.approvalStatus === 'APPROVED')
      fail('Este curso já está aprovado. Guarde primeiro as alterações.', 409);
    if (course.approvalStatus === 'REJECTED')
      fail('Guarde as correções antes de voltar a enviar o curso.', 409);
    await assertReadyForReview(course);

    const now = new Date().toISOString();

    await execute(
      "UPDATE cursos SET estado_aprovacao='PENDING', e_publicado=0, submetido_para_revisao_em=$1, atualizado_em=$1 WHERE id=$2",
      [now, id],
    );

    const admins = await queryAll('SELECT id FROM users WHERE role=\'ADMIN\' AND "isSuspended"=0');
    for (const admin of admins)
      await notify(
        admin.id,
        'Curso para revisão',
        `O curso "${course.title}" aguarda revisão.`,
        '/admin?tab=courses',
      );

    return { approvalStatus: 'PENDING', message: 'Curso enviado para revisão.' };
  });
}

async function reviewCourse(id, action, input = {}) {
  const notes = input.notes ?? (action === 'APPROVED' ? 'Curso aprovado pela administração.' : '');
  if (typeof notes !== 'string' || !notes.trim() || notes.length > 2000)
    fail('Escreva um feedback entre 1 e 2000 caracteres.');

  return transaction(async () => {
    await lockTransaction(`course-community:${id}`);

    const course = await queryOne('SELECT * FROM courses WHERE id=$1', [id]);
    if (!course) fail('Curso não encontrado.', 404);
    checkVersion(course, input.expectedUpdatedAt);
    if (
      course.approvalStatus !== 'PENDING' &&
      !(action === 'REJECTED' && course.approvalStatus === 'APPROVED')
    )
      fail('O estado do curso mudou. Atualize a lista antes de tomar uma decisão.', 409);
    if (action === 'APPROVED') await assertReadyForReview(course);
    const now = new Date().toISOString();

    await execute(
      'UPDATE cursos SET estado_aprovacao=$1,e_publicado=$2,notas_admin=$3,revisto_em=$4,atualizado_em=$4 WHERE id=$5',
      [action, action === 'APPROVED' ? 1 : 0, notes.trim(), now, id],
    );
    await notify(
      course.creatorId,
      action === 'APPROVED' ? 'Curso aprovado e publicado' : 'Alterações solicitadas ao curso',
      `"${course.title}": ${notes.trim()}`,
      `/creator/courses/${id}/edit`,
    );

    return {
      success: true,
      approvalStatus: action,
      message:
        action === 'APPROVED' ? 'Curso aprovado e publicado.' : 'Feedback enviado ao formador.',
    };
  });
}

exports.checkVersion = checkVersion;
exports.submitCourse = submitCourse;
exports.reviewCourse = reviewCourse;
