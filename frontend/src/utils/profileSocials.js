export const PROFILE_NETWORKS = [
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://oseusite.pt',
    prefix: '',
  },
  {
    key: 'github',
    label: 'GitHub',
    placeholder: 'utilizador ou link do perfil',
    prefix: 'https://github.com/',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'utilizador ou link do perfil',
    prefix: 'https://www.linkedin.com/in/',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: '@utilizador ou link do perfil',
    prefix: 'https://www.instagram.com/',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    placeholder: '@utilizador ou link do perfil',
    prefix: 'https://x.com/',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: '@canal ou link do canal',
    prefix: 'https://www.youtube.com/@',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: '@utilizador ou link do perfil',
    prefix: 'https://www.tiktok.com/@',
  },
  {
    key: 'twitch',
    label: 'Twitch',
    placeholder: 'utilizador ou link do canal',
    prefix: 'https://www.twitch.tv/',
  },
  {
    key: 'discord',
    label: 'Discord',
    placeholder: 'https://discord.gg/convite',
    prefix: '',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'utilizador ou link do perfil',
    prefix: 'https://www.facebook.com/',
  },
];
export function normalizeProfileLink(network, value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/\s/.test(raw)) throw new Error('O link não pode conter espaços.');
  let candidate = raw;
  if (!/^https?:\/\//i.test(raw)) {
    if (/^[a-z][a-z\d+.-]*:/i.test(raw)) throw new Error('Use um link http ou https.');
    candidate =
      !network.prefix || /^(?:www\.|[a-z\d.-]+\.(?:com|net|tv|gg)(?:\/|$))/i.test(raw)
        ? `https://${raw}`
        : network.prefix
          ? network.prefix + raw.replace(/^@/, '')
          : `https://${raw}`;
  }
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Introduza um link ou nome de utilizador válido.');
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !url.hostname.includes('.') ||
    url.username ||
    url.password ||
    url.href.length > 500
  ) {
    throw new Error('Introduza um link http ou https válido (até 500 caracteres).');
  }
  return url.href;
}
export function getProfileLinks(profile = {}) {
  profile = profile || {};
  return PROFILE_NETWORKS.flatMap((network) => {
    const value = profile.socialLinks?.[network.key] || profile[network.key];
    if (!value) return [];
    try {
      return [
        {
          ...network,
          url: normalizeProfileLink(network, value),
        },
      ];
    } catch {
      return [];
    }
  });
}
