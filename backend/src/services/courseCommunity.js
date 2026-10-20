const { randomUUID } = require('node:crypto');
const { queryOne, execute, transaction, lockTransaction } = require('../database/connection');
const { canManageCourse } = require('./courseAccess');

async function ensureCourseCommunity(user, courseId) {
  return transaction(async () => {
    await lockTransaction(`course-community:${courseId}`);
    const course = await queryOne('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!course) throw Object.assign(new Error('Curso não encontrado.'), { status: 404 });
    if (!(await canManageCourse(user, course)))
      throw Object.assign(new Error('Sem permissão para configurar a comunidade.'), {
        status: 403,
      });
    if (
      course.spaceId &&
      !(await queryOne('SELECT id FROM courses WHERE "spaceId" = $1 AND id <> $2 LIMIT 1', [
        course.spaceId,
        course.id,
      ]))
    )
      return course.spaceId;
    const spaceId = randomUUID();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO espacos (id,nome,slug,descricao,url_icone,url_banner,e_privado,categoria,id_proprietario,total_membros,criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,1,$7,$8,1,$9)`,
      [
        spaceId,
        `Comunidade ${course.title}`,
        `comunidade-${spaceId}`,
        course.description,
        course.thumbnailUrl,
        course.bannerUrl,
        course.category,
        course.creatorId,
        now,
      ],
    );
    await execute('UPDATE cursos SET id_espaco = $1, atualizado_em = $2 WHERE id = $3', [
      spaceId,
      now,
      course.id,
    ]);
    await execute(
      "INSERT INTO membros_espacos(id,id_utilizador,id_espaco,papel,aderiu_em) VALUES($1,$2,$3,'OWNER',$4) ON CONFLICT DO NOTHING",
      [randomUUID(), course.creatorId, spaceId, now],
    );
    await execute(
      `INSERT INTO membros_espacos(id,id_utilizador,id_espaco,papel,aderiu_em)
       SELECT 'member-' || $1 || '-' || id_utilizador, id_utilizador, $1, 'MEMBER', $2
       FROM inscricoes WHERE id_curso = $3 AND id_utilizador <> $4 ON CONFLICT DO NOTHING`,
      [spaceId, now, course.id, course.creatorId],
    );
    return spaceId;
  });
}
exports.ensureCourseCommunity = ensureCourseCommunity;
