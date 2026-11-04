const { randomUUID } = require('node:crypto');
const { transacao, bloquearTransacao, consultarUm, executar } = require('../database/connection');

function fail(mensagem, estado) {
  throw Object.assign(new Error(mensagem), {
    status: estado,
  });
}

async function alterarUtilizadorCargo(actorId, utilizadorId, entrada) {
  if (
    !['STUDENT', 'CREATOR', 'ADMIN'].includes(entrada.role) ||
    typeof entrada.eFormador !== 'boolean' ||
    (entrada.role === 'STUDENT' && entrada.eFormador) ||
    (entrada.role === 'CREATOR' && !entrada.eFormador)
  )
    fail('Escolha um cargo válido.', 400);

  return transacao(async () => {
    await bloquearTransacao('admin-user-roles');

    const actor = await consultarUm('SELECT papel, esta_suspenso FROM utilizadores WHERE id=$1', [
      actorId,
    ]);
    if (actor?.papel !== 'ADMIN' || actor.esta_suspenso)
      fail('Sem permissão para alterar cargos.', 403);
    const utilizador = await consultarUm('SELECT * FROM consulta_utilizadores WHERE id=$1', [
      utilizadorId,
    ]);
    if (!utilizador) fail('Utilizador não encontrado.', 404);
    if (actorId === utilizadorId) fail('Não pode alterar o cargo da sua própria conta.', 403);
    if (entrada.role === 'ADMIN' && utilizador.estaSuspenso)
      fail('Reative a conta antes de a tornar administradora.', 409);
    if (utilizador.role === 'ADMIN' && entrada.role !== 'ADMIN') {
      const contar = await consultarUm(
        'SELECT COUNT(*) AS total FROM consulta_utilizadores WHERE role=\'ADMIN\' AND "estaSuspenso"=0',
      );
      if (contar.total <= 1) fail('Tem de existir pelo menos um administrador ativo.', 409);
    }

    if (utilizador.role === entrada.role && utilizador.eFormador === entrada.eFormador)
      return {
        id: utilizador.id,
        role: utilizador.role,
        eFormador: utilizador.eFormador,
      };
    const agora = new Date().toISOString();

    await executar(
      'UPDATE utilizadores SET papel=$1,admin_formador=$2,versao_sessao=versao_sessao+1,atualizado_em=$3 WHERE id=$4',
      [entrada.role, entrada.role === 'ADMIN' && entrada.eFormador ? 1 : 0, agora, utilizadorId],
    );

    const label =
      entrada.role === 'ADMIN'
        ? entrada.eFormador
          ? 'Administrador e formador'
          : 'Administrador'
        : entrada.role === 'CREATOR'
          ? 'Formador'
          : 'Aluno';

    await executar(
      "INSERT INTO notificacoes(id,id_utilizador,tipo,titulo,conteudo,ligacao,esta_lida,criado_em) VALUES($1,$2,'system','Permissões da conta atualizadas',$3,'/perfil',0,$4)",
      [
        randomUUID(),
        utilizadorId,
        `O seu cargo passou a ${label}. Inicie sessão novamente para atualizar as permissões.`,
        agora,
      ],
    );

    return {
      id: utilizadorId,
      role: entrada.role,
      eFormador: entrada.eFormador,
    };
  });
}

exports.alterarUtilizadorCargo = alterarUtilizadorCargo;
