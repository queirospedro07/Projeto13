function validarAmbienteProducao(ambiente) {
  const erros = [];
  if (ambiente.NODE_ENV !== 'production') {
    return ['NODE_ENV deve ser production.'];
  }

  const origins = [ambiente.CLIENT_URL, ambiente.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((valor) => valor.split(','));
  if (!origins.length) erros.push('Configure CLIENT_URL e FRONTEND_URL com o domínio público.');
  for (const origem of origins) {
    try {
      const url = new URL(origem.trim());
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
      erros.push(
        'As origens públicas devem ser domínios HTTPS reais, sem caminhos ou credenciais.',
      );
      break;
    }
  }

  if (
    !ambiente.JWT_SECRET ||
    ambiente.JWT_SECRET.trim().length < 32 ||
    /YOUR[_-]|alterar|chave_secreta|super-secret|change[-_ ]?(this|me)/i.test(ambiente.JWT_SECRET)
  )
    erros.push('Configure JWT_SECRET com um segredo aleatório de pelo menos 32 caracteres.');
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
    'ENABLE_DEV_PASSWORD_RESET',
    'LOCAL_POSTGRES_DOCKER',
    'ENABLE_PAYMENT_SIMULATION',
  ]) {
    if (ambiente[chave] === 'true') erros.push(`${chave} não pode estar ativo em produção.`);
  }

  if (!ambiente.SMTP_HOST || !ambiente.SMTP_USER || !ambiente.SMTP_PASS || !ambiente.SMTP_FROM) {
    erros.push(
      'Configure SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM para recuperar contas por email.',
    );
  }

  if (ambiente.TRUST_PROXY_HOPS && !/^[1-5]$/.test(ambiente.TRUST_PROXY_HOPS)) {
    erros.push('TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5.');
  }

  return erros;
}

exports.validarAmbienteProducao = validarAmbienteProducao;
