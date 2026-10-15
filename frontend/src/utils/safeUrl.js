export function safeExternalUrl(value) {
  // Reject control characters before parsing URLs.
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || /[\u0000-\u001f]/.test(value)) return '';
  const raw = value.trim();
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
export function safeDownloadUrl(value) {
  const external = safeExternalUrl(value);
  if (external) return external;
  return typeof value === 'string' &&
    /^data:(application\/pdf|image\/(?:png|jpeg|webp)|text\/plain);base64,[a-z\d+/]+=*$/i.test(
      value,
    )
    ? value
    : '';
}
