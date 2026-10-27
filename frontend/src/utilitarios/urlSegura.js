export function seguroExternoUrl(valor) {
  // Reject control characters before parsing URLs.
  // eslint-disable-next-line no-control-regex
  if (typeof valor !== 'string' || /[\u0000-\u001f]/.test(valor)) return '';
  const raw = valor.trim();
  if (/^\/(?!\/)/.test(raw) && !raw.includes('\\')) return raw;
  try {
    const url = new URL(raw);

    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export function seguroDescarregarUrl(valor) {
  const externo = seguroExternoUrl(valor);
  if (externo) return externo;

  return typeof valor === 'string' &&
    /^data:(application\/pdf|image\/(?:png|jpeg|webp)|text\/plain);base64,[a-z\d+/]+=*$/i.test(
      valor,
    )
    ? valor
    : '';
}
