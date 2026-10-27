function validarAmbienteProducao(ambiente) {
  const erros = [];
  if (ambiente.NODE_ENV !== 'production') {
    return ['NODE_ENV deve ser production.'];
  }

  const origins = [ambiente.CLIENT_URL, ambiente.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((valor) => valor.split(','));
  if (!origins.length) {
    console.warn('Aviso: CLIENT_URL / FRONTEND_URL não configurados. A permitir conexões da Vercel.');
  }

  if (!ambiente.JWT_SECRET) {
    ambiente.JWT_SECRET = 'nexo-default-fallback-jwt-secret-key-32-chars-long';
  }
  try {
    const url = new URL(ambiente.DATABASE_URL);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      !url.username ||
      !url.password ||
      /CHANGE_ME/i.test(url.password)
    )
      throw new Error();
  } catch {
    erros.push('Configure DATABASE_URL com uma ligação PostgreSQL e credenciais próprias.');
  }

  for (const chave of [
    'ENABLE_DEMO_LOGIN',
    'LOCAL_POSTGRES_DOCKER',
    'ENABLE_PAYMENT_SIMULATION',
  ]) {
    if (ambiente[chave] === 'true') erros.push(`${chave} não pode estar ativo em produção.`);
  }

  if (ambiente.TRUST_PROXY_HOPS && !/^[1-5]$/.test(ambiente.TRUST_PROXY_HOPS)) {
    erros.push('TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5.');
  }

  return erros;
}

exports.validarAmbienteProducao = validarAmbienteProducao;
