function validarAmbienteProducao(ambiente) {
  const erros = [];
  if (ambiente.NODE_ENV !== 'production') {
    return ['NODE_ENV deve ser production.'];
  }

  const origins = [ambiente.CLIENT_URL, ambiente.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((valor) => valor.split(',').map((origem) => origem.trim()).filter(Boolean));
  if (!origins.length) {
    erros.push('Configure CLIENT_URL ou FRONTEND_URL com a origem HTTPS do frontend.');
  } else {
    for (const origem of origins) {
      try {
        const url = new URL(origem);
        if (
          url.protocol !== 'https:' ||
          !url.hostname ||
          url.username ||
          url.password ||
          url.pathname !== '/' ||
          url.search ||
          url.hash
        ) {
          throw new Error();
        }
      } catch {
        erros.push(`Origem frontend inválida: ${origem}. Configure uma origem HTTPS sem caminhos.`);
      }
    }
  }

  const jwtSecret = typeof ambiente.JWT_SECRET === 'string' ? ambiente.JWT_SECRET.trim() : '';
  if (
    jwtSecret.length < 32 ||
    /^(change_me|changeme|secret|password)$/i.test(jwtSecret) ||
    jwtSecret.toLowerCase().includes('nexo-default-fallback')
  ) {
    erros.push(
      'Configure JWT_SECRET com um segredo aleatório de pelo menos 32 caracteres.',
    );
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
