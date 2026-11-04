export const podeEnsinar = (utilizador) =>
  utilizador?.role === 'CREATOR' ||
  (utilizador?.role === 'ADMIN' && utilizador.eFormador !== false);

// Ser formador não concede acesso aos cursos de outros autores.
export const podeGerirEsteCurso = (utilizador, curso) => {
  if (!utilizador?.id || !curso) return false;

  return Boolean(
    utilizador.role === 'ADMIN' ||
    [curso.idFormador, curso.instructorId, curso.creator?.id, curso.owner?.id].some(
      (id) => id != null && String(id) === String(utilizador.id),
    ) ||
    curso.isCreator === true ||
    curso.isCollaborator === true,
  );
};

export const temInscricaoCurso = (curso) =>
  Boolean(curso && (curso.isEnrolled || curso.userEnrollment || curso.isMember));
