export const formatarDuracao = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const formatarBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatarExperiencia = (experiencia) => {
  return `${(experiencia || 0).toLocaleString('pt-PT')} XP`;
};

export const formatarDificuldade = (dificuldade) => {
  switch (dificuldade?.toLowerCase()) {
    case 'beginner':
    case 'iniciante':
      return 'Iniciante';
    case 'intermediate':
    case 'intermédio':
    case 'intermediario':
      return 'Intermédio';
    case 'advanced':
    case 'avançado':
    case 'avancado':
      return 'Avançado';
    default:
      return dificuldade || 'Geral';
  }
};

export const formatarCursoPreco = (valor) => {
  if (typeof valor === 'object' && valor !== null) {
    const rawPreco2 = Number(valor.price ?? 0);
    const isGratuitoCurso =
      Boolean(valor.eGratuito) ||
      valor.price === 0 ||
      valor.price === null ||
      valor.price === undefined ||
      Number.isNaN(rawPreco2) ||
      rawPreco2 <= 0;
    if (isGratuitoCurso) return 'Grátis';

    return `€${rawPreco2
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1')}`;
  }

  const rawPreco = Number(valor ?? 0);
  if (Number.isNaN(rawPreco) || rawPreco <= 0) return 'Grátis';

  return `€${rawPreco
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')}`;
};

export const formatarCategoria = (categoria) => {
  if (!categoria) return 'Geral';
  const raw = String(categoria).trim();
  switch (raw.toLowerCase()) {
    case 'programming':
    case 'programação':
    case 'programacao':
    case 'programação & software':
      return 'Programação';
    case 'design':
    case 'design & criatividade':
    case 'ui/ux':
      return 'Design & Criatividade';
    case 'ai':
    case 'ai & data':
    case 'ia':
    case 'ia & dados':
      return 'IA & Dados';
    case 'data':
    case 'dados':
      return 'Dados & Bases de Dados';
    case 'cloud':
    case 'cloud & devops':
    case 'devops':
      return 'Cloud & DevOps';
    case 'cybersecurity':
    case 'security':
    case 'cibersegurança':
    case 'ciberseguranca':
      return 'Cibersegurança';
    case 'business':
    case 'negócios & gestão':
      return 'Negócios & Gestão';
    case 'marketing':
    case 'marketing & vendas':
      return 'Marketing & Vendas';
    default:
      return raw;
  }
};

export const formatarCargo = (cargo) => {
  switch (String(cargo || '').toUpperCase()) {
    case 'ADMIN':
      return 'Administrador & Formador';
    case 'CREATOR':
    case 'INSTRUCTOR':
    case 'OWNER':
      return 'Formador';
    case 'COLABORADOR':
    case 'COLLABORATOR':
      return 'Colaborador';
    case 'MODERATOR':
      return 'Moderador';
    case 'MEMBER':
      return 'Membro';
    case 'STUDENT':
    default:
      return 'Aluno';
  }
};

export const formatarAulaType = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'video':
      return 'Vídeo';
    case 'text':
    case 'article':
      return 'Artigo';
    case 'code':
      return 'Código';
    case 'quiz':
      return 'Questionário';
    case 'resource':
      return 'Recursos';
    default:
      return 'Vídeo';
  }
};

export const formatarRelativoTempo = (isoString) => {
  if (!isoString) return '';
  const dados = new Date(isoString);
  const agora = new Date();
  const diffMs = agora.getTime() - dados.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDays = Math.floor(diffHoras / 24);
  if (diffMinutos < 1) return 'Agora mesmo';
  if (diffMinutos < 60) return `Há ${diffMinutos}m`;
  if (diffHoras < 24) return `Há ${diffHoras}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return dados.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
