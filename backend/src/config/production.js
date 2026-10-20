function validateProductionEnvironment(env) {
  const errors = [];

  if (env.NODE_ENV !== 'production') {
    return ['NODE_ENV deve ser production.'];
  }

  const origins = [env.CLIENT_URL, env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(','));

  if (!origins.length) errors.push('Configure CLIENT_URL e FRONTEND_URL com o domínio público.');

  for (const origin of origins) {
    try {
      const url = new URL(origin.trim());

      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/' ||
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        /(^|\.)(example\.(com|org|net)|exemplo\.pt)$/.test(url.hostname)
      ) {
        throw new Error();
      }
    } catch {
      errors.push(
        'As origens públicas devem ser domínios HTTPS reais, sem caminhos ou credenciais.',
      );
      break;
    }
  }

  if (
    !env.JWT_SECRET ||
    env.JWT_SECRET.trim().length < 32 ||
    /YOUR[_-]|alterar|chave_secreta|super-secret|change[-_ ]?(this|me)/i.test(env.JWT_SECRET)
  )
    errors.push('Configure JWT_SECRET com um segredo aleatório de pelo menos 32 caracteres.');

  try {
    const url = new URL(env.DATABASE_URL);

    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      !url.username ||
      !url.password ||
      /CHANGE_ME/i.test(url.password)
    )
      throw new Error();
  } catch {
    errors.push('Configure DATABASE_URL com uma ligação PostgreSQL e credenciais próprias.');
  }

  for (const key of [
    'ENABLE_DEMO_LOGIN',
    'ENABLE_DEV_PASSWORD_RESET',
    'LOCAL_POSTGRES_DOCKER',
    'ENABLE_PAYMENT_SIMULATION',
  ]) {
    if (env[key] === 'true') errors.push(`${key} não pode estar ativo em produção.`);
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    errors.push(
      'Configure SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM para recuperar contas por email.',
    );
  }

  if (env.TRUST_PROXY_HOPS && !/^[1-5]$/.test(env.TRUST_PROXY_HOPS)) {
    errors.push('TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5.');
  }

  return errors;
}

exports.validateProductionEnvironment = validateProductionEnvironment;
