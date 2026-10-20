const { randomUUID } = require('node:crypto');
const { transaction, lockTransaction, queryOne, execute } = require('../database/connection');

function fail(message, status) {
  throw Object.assign(new Error(message), { status });
}

async function changeUserRole(actorId, userId, input) {
  if (
    !['STUDENT', 'CREATOR', 'ADMIN'].includes(input.role) ||
    typeof input.isTeacher !== 'boolean' ||
    (input.role === 'STUDENT' && input.isTeacher) ||
    (input.role === 'CREATOR' && !input.isTeacher)
  )
    fail('Escolha um cargo válido.', 400);

  return transaction(async () => {
    await lockTransaction('admin-user-roles');

    const actor = await queryOne('SELECT papel, esta_suspenso FROM utilizadores WHERE id=$1', [
      actorId,
    ]);
    if (actor?.papel !== 'ADMIN' || actor.esta_suspenso)
      fail('Sem permissão para alterar cargos.', 403);
    const user = await queryOne('SELECT * FROM users WHERE id=$1', [userId]);
    if (!user) fail('Utilizador não encontrado.', 404);
    if (actorId === userId) fail('Não pode alterar o cargo da sua própria conta.', 403);
    if (input.role === 'ADMIN' && user.isSuspended)
      fail('Reative a conta antes de a tornar administradora.', 409);
    if (user.role === 'ADMIN' && input.role !== 'ADMIN') {
      const count = await queryOne(
        'SELECT COUNT(*) AS total FROM users WHERE role=\'ADMIN\' AND "isSuspended"=0',
      );
      if (count.total <= 1) fail('Tem de existir pelo menos um administrador ativo.', 409);
    }

    if (user.role === input.role && user.isTeacher === input.isTeacher)
      return { id: user.id, role: user.role, isTeacher: user.isTeacher };
    const now = new Date().toISOString();

    await execute(
      'UPDATE utilizadores SET papel=$1,admin_formador=$2,versao_sessao=versao_sessao+1,atualizado_em=$3 WHERE id=$4',
      [input.role, input.role === 'ADMIN' && input.isTeacher ? 1 : 0, now, userId],
    );

    const label =
      input.role === 'ADMIN'
        ? input.isTeacher
          ? 'Administrador e formador'
          : 'Administrador'
        : input.role === 'CREATOR'
          ? 'Formador'
          : 'Aluno';

    await execute(
      "INSERT INTO notificacoes(id,id_utilizador,tipo,titulo,conteudo,ligacao,esta_lida,criado_em) VALUES($1,$2,'system','Permissões da conta atualizadas',$3,'/profile',0,$4)",
      [
        randomUUID(),
        userId,
        `O seu cargo passou a ${label}. Inicie sessão novamente para atualizar as permissões.`,
        now,
      ],
    );

    return { id: userId, role: input.role, isTeacher: input.isTeacher };
  });
}

exports.changeUserRole = changeUserRole;
